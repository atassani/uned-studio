export const SUPPORTED_LANGUAGES = ['es', 'en', 'ca'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK_LANGUAGE: AppLanguage = 'es';

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) return fallback;
  const normalized = input.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export function normalizeLanguage(input: string | null | undefined): AppLanguage {
  if (!input) return FALLBACK_LANGUAGE;
  const normalized = input.trim().toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(normalized as AppLanguage)) {
    return normalized as AppLanguage;
  }
  return FALLBACK_LANGUAGE;
}

export function getDefaultLanguage(): AppLanguage {
  return normalizeLanguage(process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE);
}

export function isLanguageSelectionEnabled(): boolean {
  return parseBoolean(process.env.NEXT_PUBLIC_LANGUAGE_SELECTION_ENABLED, false);
}
