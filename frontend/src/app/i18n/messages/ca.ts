import { esMessages } from './es';

// Phase 1 keeps Spanish copy while enabling i18n plumbing.
export const caMessages = { ...esMessages } as const;
