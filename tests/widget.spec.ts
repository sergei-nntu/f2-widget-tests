import { test, expect } from '@playwright/test';
import { WidgetPage } from './pages/widget.page';
import {CHAT_MESSAGES, STATUS_SEQUENCES, FEEDBACK_REASONS, REPORT_CATEGORIES} from './data/constants';

test.describe('Chatbot Widget Tests', () => {
  let widgetPage: WidgetPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new WidgetPage(page);
    await widgetPage.goto();
    await widgetPage.openWidget();
    await widgetPage.verifyWidgetIsOpened();
    await widgetPage.waitForLoadingToComplete();
  });

  test('Verify that the user can send a message in English (LTR)', async () => {
    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);

    await widgetPage.verifyEnglishLTR();
  });

  test('Verify that the user can send a message in Arabic (RTL)', async () => {
    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_AR);

    await widgetPage.verifyArabicRTL();
  });

  test('Verify that the user can rate a response with a Thumbs Up', async () => {
    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);

    await widgetPage.rateWithThumbsUp();

    await widgetPage.verifyThumbsUpSelected();
  });

  test('Verify that the user can submit a full Thumbs Down feedback cycle', async () => {
    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);

    await widgetPage.openFeedbackDialog();

    await widgetPage.selectFeedbackReason(FEEDBACK_REASONS.NOT_FOLLOW_INSTRUCTIONS);

    await expect(widgetPage.submitButton).toBeEnabled();
    await widgetPage.submitFeedback(FEEDBACK_REASONS.FEEDBACK_LOW);
  });

  test('Verify that the user can submit feedback with reason "Other"', async () => {
    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);

    await widgetPage.thumbsDownButton.click();

    const feedbackText = FEEDBACK_REASONS.FEEDBACK;
    await widgetPage.submitOtherFeedback(feedbackText);
  });

  test('Verify that the user can report content via the "Flag" icon', async () => {
    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);

    const category = REPORT_CATEGORIES.DANGEROUS_CONTENT;
    const details = FEEDBACK_REASONS.FEEDBACK;

    await widgetPage.submitFullReport(category, details);

  });

  test('Verify that the system displays offline status and recovers after network restoration', async () => {
    await expect(widgetPage.websocketStatus).toHaveText('Online');

    await widgetPage.setNetworkOffline(true);

    await widgetPage.inputField.fill(CHAT_MESSAGES.USER_HELLO_EN);
    await widgetPage.sendButton.click();

    await widgetPage.verifyOfflineStatus();

    await widgetPage.setNetworkOffline(false);

    await widgetPage.verifyOnlineStatus();
  });

  test.describe('Rating Inactivity Tests', () => {

    test.beforeEach(async ({ page }) => {
      await page.clock.install();

      await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);
      await widgetPage.verifyEnglishLTR();

      await widgetPage.fastForwardTime(6, 0);
      await expect(widgetPage.ratingDialog).toBeVisible();
    });

    test('Verify that the user can submit a low rating (1-3 stars) with details', async () => {
      const feedback = FEEDBACK_REASONS.FEEDBACK;
      await widgetPage.submitLowRating('1', feedback);

      await widgetPage.verifySessionRestored();
    });

    test('Verify that the user can submit a high rating (4-5 stars)', async () => {
      await widgetPage.submitHighRating('5');

      await widgetPage.verifySessionRestored();
    });
  });

  test('Verify that an empty session does not expire after 5 minutes', async ({ page }) => {
    await page.clock.install();

    await expect(widgetPage.websocketStatus).toHaveText('Online');

    await widgetPage.fastForwardTime(6, 0);

    await widgetPage.verifySessionIsActive();

    await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);
    await expect(widgetPage.botResponseCard).toBeVisible();
  });

  test.describe('Widget Persistence Tests', () => {

    test.beforeEach(async ({ page }) => {
      await page.clock.install();
    });

    test('Verify that the user can close and reopen the widget within 5 minutes without losing the session', async () => {
      const userText = CHAT_MESSAGES.USER_HELLO_EN;
      await widgetPage.sendMessage(userText);
      await widgetPage.verifyEnglishLTR();

      await widgetPage.closeWidget();

      await widgetPage.fastForwardTime(4, 50);

      await widgetPage.openWidget();

      await widgetPage.verifyWidgetRestored();

      await expect(widgetPage.userMessage).toContainText(userText);
      await expect(widgetPage.botResponseCard).toBeVisible();

    });

    test('Verify that the session expires if the widget is closed for more than 5 minutes', async () => {
      await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);
      await widgetPage.verifyEnglishLTR();

      await widgetPage.closeWidget();

      await widgetPage.fastForwardTime(6, 0);

      await widgetPage.openWidget();

      await expect(widgetPage.ratingDialog).toBeVisible();
      await expect(widgetPage.websocketStatus).toHaveText('Online');

      await expect(widgetPage.userMessage).toBeHidden();
      await expect(widgetPage.botResponseCard).toBeHidden();
    });

    test('Verify step-by-step status re-initialization and clearing old session', async () => {

      await widgetPage.sendMessage(CHAT_MESSAGES.USER_HELLO_EN);
      await widgetPage.verifyEnglishLTR();

      await widgetPage.closeWidget();
      await widgetPage.fastForwardTime(6, 0);

      await widgetPage.openWidget();

      await widgetPage.verifyStatusSequence(widgetPage.websocketStatus, [...STATUS_SEQUENCES.WS_REINIT]);
      await widgetPage.verifyStatusSequence(widgetPage.pollingStatus, [...STATUS_SEQUENCES.POLLING_REINIT]);

      await expect(widgetPage.ratingDialog).toBeVisible();
      await expect(widgetPage.userMessage).toBeHidden();

    });
  });
});