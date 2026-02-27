import { getDefaultLanguage, type AppLanguage } from './config';
import { MessageKey, TranslationValues, translate } from './messages';

export function tForLanguage(language: AppLanguage, key: MessageKey, values?: TranslationValues) {
  return translate(language, key, values);
}

export function tDefault(key: MessageKey, values?: TranslationValues) {
  return translate(getDefaultLanguage(), key, values);
}
