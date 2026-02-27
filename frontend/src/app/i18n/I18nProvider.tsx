'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AppLanguage, getDefaultLanguage, normalizeLanguage } from './config';
import { MessageKey, TranslationValues, translate } from './messages';

interface I18nContextValue {
  activeLanguage: AppLanguage;
  setActiveLanguage: (language: AppLanguage) => void;
  t: (key: MessageKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [activeLanguage, setActiveLanguageState] = useState<AppLanguage>(getDefaultLanguage());

  const setActiveLanguage = useCallback((language: AppLanguage) => {
    setActiveLanguageState(normalizeLanguage(language));
  }, []);

  const t = useCallback(
    (key: MessageKey, values?: TranslationValues) => {
      return translate(activeLanguage, key, values);
    },
    [activeLanguage]
  );

  const value = useMemo(
    () => ({
      activeLanguage,
      setActiveLanguage,
      t,
    }),
    [activeLanguage, setActiveLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context) {
    return context;
  }
  const fallbackLanguage = getDefaultLanguage();
  return {
    activeLanguage: fallbackLanguage,
    setActiveLanguage: () => undefined,
    t: (key: MessageKey, values?: TranslationValues) => translate(fallbackLanguage, key, values),
  };
}
