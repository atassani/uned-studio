'use client';
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/I18nProvider';

export default function LoginPage() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
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
