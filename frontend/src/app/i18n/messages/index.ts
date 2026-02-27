import { AppLanguage } from '../config';
import { caMessages } from './ca';
import { enMessages } from './en';
import { esMessages } from './es';

export const messagesByLanguage = {
  es: esMessages,
  en: enMessages,
  ca: caMessages,
} as const;

export type MessageKey = keyof typeof esMessages;
export type TranslationValues = Record<string, string | number>;

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}

export function translate(
  language: AppLanguage,
  key: MessageKey,
  values?: TranslationValues
): string {
  const languageMessages = messagesByLanguage[language];
  const raw = languageMessages[key] ?? esMessages[key] ?? key;
  return interpolate(raw, values);
}
