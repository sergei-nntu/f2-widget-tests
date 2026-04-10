import { type Locator, type Page, expect } from '@playwright/test';
import { APP_CONFIG } from '../data/constants';

export class WidgetPage {
    readonly page: Page;
    readonly chatbotButton: Locator;
    readonly appHeader: Locator;
    readonly inputField: Locator;
    readonly sendButton: Locator;
    readonly botResponseCard: Locator;
    readonly userMessage: Locator;
    readonly typingIndicator: Locator;
    readonly thumbsUpButton: Locator;
    readonly thumbsDownButton: Locator;
    readonly feedbackDialog: Locator;
    readonly submitButton: Locator;
    readonly nextButton: Locator;
    readonly detailsTextarea: Locator;
    readonly reportButton: Locator;
    readonly reportModalTitle: Locator;
    readonly reportTextarea: Locator;
    readonly reportCategoryOption: (value: string) => Locator;
    readonly websocketStatus: Locator;
    readonly pollingStatus: Locator;
    readonly networkErrorBanner: Locator;
    readonly networkRestoredBanner: Locator;
    readonly ratingDialog: Locator;
    readonly ratingOption: (value: string) => Locator;
    readonly ratingFeedbackTextarea: Locator;
    readonly ratingModalTitle: Locator;
    readonly closeButton: Locator;
    readonly loadingSpinner: Locator;
    readonly websocketStatusContainer: Locator;
    readonly pollingStatusContainer: Locator;


    constructor(page: Page) {
        this.page = page;

        this.chatbotButton = page.locator('button.logo');
        this.appHeader = page.locator('app-header');
        this.inputField = page.locator('input.message-input');
        this.sendButton = page.locator('button.send-button');

        this.botResponseCard = page.locator('mat-card.text-container').last();
        this.userMessage = page.locator('mat-card.text-container.highlighted').last();

        this.typingIndicator = page.locator('app-typing-indicator, .typing, .loading-dots').first();

        this.thumbsUpButton = this.botResponseCard.getByLabel('Set thumbs up');
        this.thumbsDownButton = this.botResponseCard.getByLabel('Set thumbs down');

        this.feedbackDialog = page.locator('mat-dialog-container');

        this.submitButton = page.getByRole('button', { name: 'Submit' });
        this.nextButton = this.feedbackDialog.getByRole('button', { name: 'Next' });

        this.detailsTextarea = this.page.getByPlaceholder('Please describe the issue.');

        this.reportButton = this.botResponseCard.getByLabel('Send a report');

        this.reportModalTitle = page.getByText('Can you provide more details?');
        this.reportCategoryOption = (value: string) =>
            page.locator(`input[type="radio"][value="${value}"]`);

        this.reportTextarea = page.getByPlaceholder('Providing more context would be helpful...');

        this.websocketStatus = page.locator('div[title="WebSocket"] span');
        this.pollingStatus = page.locator('div[title="Polling"] span');

        this.networkErrorBanner = page.getByText('Network error, try again later');
        this.networkRestoredBanner = page.getByText('Network restored');

        this.ratingDialog = page.locator('mat-dialog-container');

        this.ratingOption = (value: string) =>
            this.ratingDialog.locator(`input[type="radio"][value="${value}"]`);

        this.ratingModalTitle = page.getByText('What went wrong?');
        this.ratingFeedbackTextarea = page.getByPlaceholder('Your feedback is important to us');

        this.closeButton = page.getByLabel('Minimize chat');

        this.loadingSpinner = page.locator('mat-spinner');

        this.websocketStatusContainer = page.locator('div[title="WebSocket"]');
        this.pollingStatusContainer = page.locator('div[title="Polling"]');


    }

    async goto() {
        await this.page.goto(APP_CONFIG.BASE_URL);
    }

    async openWidget() {

        await this.chatbotButton.waitFor({ state: 'visible' });
        await this.chatbotButton.click({ force: true });
    }

    async verifyWidgetIsOpened() {
        await expect(this.appHeader).toBeVisible();
        await expect(this.inputField).toBeVisible();
    }

    async sendMessage(text: string) {
        await this.inputField.fill(text);
        await expect(this.inputField).toHaveValue(text);
        await this.sendButton.click();
        // await this.page.keyboard.press('Enter');
    }

    async verifyEnglishLTR() {
        const typingIndicator = this.page.locator('app-typing-indicator, .typing-indicator, mat-card:has(.dot)');
        await typingIndicator.waitFor({ state: 'hidden', timeout: 20000 });

        await expect(this.botResponseCard).toHaveCSS('direction', 'ltr');

        const responseText = this.botResponseCard.locator('.text');

        await responseText.waitFor({ state: 'visible', timeout: 15000 })

        await expect(responseText).not.toBeEmpty({ timeout: 10000 });
        await expect(responseText).toHaveText(/^[a-zA-Z0-9\s.,!?'"-]+$/);
    }

    async verifyArabicRTL() {
        const typingIndicator = this.page.locator('app-typing-indicator, .typing-indicator, mat-card:has(.dot)');
        await typingIndicator.waitFor({ state: 'hidden', timeout: 20000 });

        const responseText = this.botResponseCard.locator('.text');

        await responseText.waitFor({ state: 'visible', timeout: 15000 })

        await expect(responseText).not.toBeEmpty({ timeout: 10000 });
        await expect(responseText).toHaveText(/[\u0600-\u06FF]/);
    }

    async rateWithThumbsUp() {
        const typingIndicator = this.page.locator('app-typing-indicator, .typing-indicator');
        await typingIndicator.waitFor({ state: 'hidden' });

        await this.thumbsUpButton.click();
    }

    async verifyThumbsUpSelected() {
        const icon = this.thumbsUpButton.locator('mat-icon');
        await expect(icon).toHaveText('thumb_up');

        await expect(this.thumbsUpButton).toBeEnabled();
    }

    async openFeedbackDialog() {
        await this.thumbsDownButton.click();
        await expect(this.feedbackDialog).toBeVisible();
    }

    async selectFeedbackReason(reason: string) {
        await this.feedbackDialog.getByRole('button', { name: reason, exact: false }).click();
    }

    async submitFeedback(details?: string) {
        const detailsArea = this.page.locator('textarea');
        if (await detailsArea.isVisible() && details) {
            await detailsArea.fill(details);
        }

        await this.submitButton.click();

        await expect(this.feedbackDialog).toBeHidden();
        await expect(this.thumbsDownButton).toBeEnabled();
    }

    async submitOtherFeedback(details: string) {
        await this.feedbackDialog.getByRole('button', { name: 'Other' }).click();

        await this.nextButton.click();

        await expect(this.feedbackDialog.locator('h3')).toHaveText('What is the problem?');

        await this.detailsTextarea.fill(details);

        await this.submitButton.click();

        await expect(this.feedbackDialog).toBeHidden();
        await expect(this.thumbsDownButton).toBeEnabled();
    }

    async selectReportCategory(categoryValue: string) {
        const option = this.reportCategoryOption(categoryValue);
        await option.click({ force: true });
    }

    async submitFullReport(category: string, details: string) {
        await this.typingIndicator.waitFor({ state: 'hidden' });

        await this.reportButton.click();

        await this.selectReportCategory(category);
        await this.nextButton.click();

        await expect(this.reportModalTitle).toBeVisible();
        await this.reportTextarea.fill(details);

        await this.submitButton.click();

        await expect(this.reportModalTitle).toBeHidden();
        await expect(this.reportButton).toBeEnabled();
    }

    async setNetworkOffline(isOffline: boolean) {
        await this.page.context().setOffline(isOffline);
    }

    async verifyOfflineStatus() {
        await expect(this.websocketStatus).toHaveText('Offline');
        await expect(this.pollingStatus).toHaveText('Offline');

        await expect(this.websocketStatus).toHaveClass(/status-offline/);

        await expect(this.networkErrorBanner).toBeVisible();
    }

    async verifyOnlineStatus() {
        await expect(this.websocketStatus).toHaveText('Online');
        await expect(this.pollingStatus).toHaveText('Online');

        await expect(this.websocketStatus).toHaveClass(/status-online/);

        await expect(this.networkRestoredBanner).toBeVisible();
    }

    async submitLowRating(stars: string, feedback: string) {
        await this.ratingOption(stars).click();
        await this.nextButton.click();

        await expect(this.ratingModalTitle).toBeVisible();
        await this.ratingFeedbackTextarea.fill(feedback);
        await this.submitButton.click();

        await expect(this.ratingDialog).toBeHidden();
    }

    async submitHighRating(stars: string) {
        await this.ratingOption(stars).click();
        await this.submitButton.click();

        await expect(this.ratingDialog).toBeHidden();
    }

    async fastForwardTime(minutes: number, seconds: number) {
        const totalMs = (minutes * 60 + seconds) * 1000;
        await this.page.clock.fastForward(totalMs);
    }

    async verifySessionRestored() {
        await expect(this.websocketStatus).toHaveText('Online', { timeout: 15000 });
        await expect(this.pollingStatus).toHaveText('Online', { timeout: 15000 });

        await expect(this.userMessage).toHaveCount(0);

        await expect(this.inputField).toBeEmpty();
        await expect(this.inputField).toBeEnabled();
    }

    async verifySessionIsActive() {
        await expect(this.websocketStatus).toHaveText('Online');
        await expect(this.pollingStatus).toHaveText('Online');

        await expect(this.ratingDialog).toBeHidden();
    }

    async verifyWidgetRestored() {
        await expect(this.appHeader).toBeVisible();

        await expect(this.websocketStatus).toHaveText('Online', { timeout: 15000 });

        await this.botResponseCard.waitFor({ state: 'visible', timeout: 10000 });
    }

    async closeWidget() {
        await this.closeButton.click();
        await expect(this.appHeader).toBeHidden();
    }

    async waitForLoadingToComplete() {
        await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
    }

    async startStatusMonitoring() {
        await this.page.evaluate(() => {
            window['_statusHistory'] = new Map();
            window['_statusHistory'].set('ws', new Set());
            window['_statusHistory'].set('poll', new Set());

            const selectors = {
                'ws': 'div[title="WebSocket"] span',
                'poll': 'div[title="Polling"] span'
            };

            const rootObserver = new MutationObserver(() => {
                for (const [key, selector] of Object.entries(selectors)) {
                    const el = document.querySelector(selector);
                    if (el) {
                        const txt = el.textContent?.trim();
                        if (txt && !window['_statusHistory'].get(key).has(txt)) {
                            window['_statusHistory'].get(key).add(txt);
                            console.log(`[MONITOR] Found ${key} status: "${txt}"`);
                        }

                        if (!window[`_obs_${key}`]) {
                            const subObs = new MutationObserver(() => {
                                const t = el.textContent?.trim();
                                if (t && !window['_statusHistory'].get(key).has(t)) {
                                    window['_statusHistory'].get(key).add(t);
                                    console.log(`[MONITOR] Changed ${key} status to: "${t}"`);
                                }
                            });
                            subObs.observe(el, { childList: true, characterData: true, subtree: true });
                            window[`_obs_${key}`] = subObs;
                        }
                    }
                }
            });

            rootObserver.observe(document.body, { childList: true, subtree: true });
            window['_rootObserver'] = rootObserver;
            console.log('[MONITOR] Global observer started');
        });
    }


    async verifyStatusSequence(key: 'ws' | 'poll', expectedStatuses: string[]) {
        const checkStatuses = async () => {
            return await this.page.evaluate(({ k, statuses }) => {
                const history = window['_statusHistory']?.get(k);
                return history && statuses.every(s => history.has(s));
            }, { k: key, statuses: expectedStatuses });
        };

        for (let i = 0; i < 10; i++) {
            const isComplete = await checkStatuses();
            if (isComplete) break;

            await this.page.clock.runFor(1000);
            await this.page.waitForTimeout(100);
        }

        try {
            await this.page.waitForFunction(({ k, statuses }) => {
                const history = window['_statusHistory']?.get(k);
                return history && statuses.every(s => history.has(s));
            }, { k: key, statuses: expectedStatuses }, { timeout: 5000 });
        } catch (error) {
            const actual = await this.page.evaluate((k) =>
                Array.from(window['_statusHistory']?.get(k) || []), key
            );
            throw new Error(`Timeout! Key: ${key}. Expected: [${expectedStatuses}]. Actually caught: [${actual}]`);
        }
    }

}
