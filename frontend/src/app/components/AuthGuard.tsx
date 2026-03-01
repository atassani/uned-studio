'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { getCognitoLoginUrl, useAuth } from '../hooks/useAuth';
import { trackAuth } from '../lib/analytics';
import packageJson from '../../../package.json';
import { useI18n } from '../i18n/I18nProvider';
import { AppLanguage, isLanguageSelectionEnabled, SUPPORTED_LANGUAGES } from '../i18n/config';
import { storage } from '../storage';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithGoogle, loginAsGuest } = useAuth();
  const { t, activeLanguage, setActiveLanguage } = useI18n();
  const languageSelectionEnabled = isLanguageSelectionEnabled();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const normalizedPath = (pathname || '/').replace(/\/+$/, '') || '/';
    const candidate = normalizedPath.slice(1);
    if (!SUPPORTED_LANGUAGES.includes(candidate as AppLanguage)) {
      return;
    }
    const routeLanguage = candidate as AppLanguage;
    storage.setRouteLanguageOverride(routeLanguage);
    storage.setLanguage(routeLanguage);
    if (routeLanguage !== activeLanguage) {
      setActiveLanguage(routeLanguage);
    }
    router.replace('/');
  }, [pathname, activeLanguage, setActiveLanguage, router]);

  useEffect(() => {
    // Only log in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Runtime env:', {
        NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
        NEXT_PUBLIC_DATA_BASE_URL: process.env.NEXT_PUBLIC_DATA_BASE_URL,
        NEXT_PUBLIC_AREAS_FILE: process.env.NEXT_PUBLIC_AREAS_FILE,
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
        NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
        NEXT_PUBLIC_REDIRECT_SIGN_IN: process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN,
        NEXT_PUBLIC_REDIRECT_SIGN_OUT: process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT,
        NODE_ENV: process.env.NODE_ENV,
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginUrl = getCognitoLoginUrl();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center relative">
          {languageSelectionEnabled && (
            <div className="mb-6 text-left">
              <label
                htmlFor="login-language-selector"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                {t('language.selectorLabel')}
              </label>
              <select
                id="login-language-selector"
                data-testid="login-language-selector"
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">{t('auth.loginSubtitle')}</p>
          </div>
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-200 mb-4">{t('auth.loginDescription')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.loginHint')}</p>
          </div>
          <div className="space-y-3">
            {loginUrl ? (
              <a
                data-testid="google-login-btn"
                href={loginUrl}
                onClick={() => {
                  trackAuth('login', 'google');
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('auth.loginWithGoogle')}
              </a>
            ) : (
              <button
                data-testid="google-login-btn"
                onClick={() => {
                  trackAuth('login', 'google');
                  loginWithGoogle();
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('auth.loginWithGoogle')}
              </button>
            )}

            <button
              data-testid="guest-login-btn"
              onClick={() => {
                trackAuth('login', 'guest');
                loginAsGuest();
              }}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
            >
              {t('auth.continueAsGuest')}
            </button>
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>{t('auth.googleBenefitLabel')}</strong> {t('auth.googleBenefitText')}
            </p>
            <p>
              <strong>{t('auth.guestBenefitLabel')}</strong> {t('auth.guestBenefitText')}
            </p>
          </div>

          {/* Version display in bottom right corner */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
            v{packageJson.version}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
