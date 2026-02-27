'use client';
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';
import { AppLanguage, isLanguageSelectionEnabled, SUPPORTED_LANGUAGES } from '../i18n/config';

export default function LoginPage() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const { t, activeLanguage, setActiveLanguage } = useI18n();
  const languageSelectionEnabled = isLanguageSelectionEnabled();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {languageSelectionEnabled && (
        <div className="w-72 mb-4">
          <label
            htmlFor="login-page-language-selector"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            {t('language.selectorLabel')}
          </label>
          <select
            id="login-page-language-selector"
            data-testid="login-page-language-selector"
            aria-label={t('language.selectorAria')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
            value={activeLanguage}
            onChange={(event) => setActiveLanguage(event.target.value as AppLanguage)}
          >
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {t(`language.option.${language}` as const)}
              </option>
            ))}
          </select>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">{t('login.pageTitle')}</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={loginWithGoogle}>
        {t('auth.loginWithGoogle')}
      </button>
      <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={loginAsGuest}>
        {t('login.guestEntry')}
      </button>
    </div>
  );
}
