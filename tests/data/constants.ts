export const APP_CONFIG = {
    BASE_URL: 'https://dypsbih29akf1.cloudfront.net',
} as const;

export const CHAT_MESSAGES = {
    USER_HELLO_EN: 'Hello',
    USER_HELLO_AR: 'مرحباً',
} as const;

export const FEEDBACK_REASONS = {
    FEEDBACK: 'The bot did not understand my request',
    FEEDBACK_LOW: 'The bot was too slow and irrelevant.',
    NOT_FOLLOW_INSTRUCTIONS: "Didn't follow instructions"
} as const;
export const REPORT_CATEGORIES = {
    DANGEROUS_CONTENT: 'Dangerous & Harmful Content',
} as const;

export const STATUS_SEQUENCES = {
    WS_REINIT: ['Initializing...', 'Reconnecting...', 'Connecting...', 'Online'],
    POLLING_REINIT: ['Connecting...', 'Online']
} as const;