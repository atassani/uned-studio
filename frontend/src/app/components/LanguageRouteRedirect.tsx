'use client';

import { useEffect } from 'react';
import { AppLanguage } from '../i18n/config';
import { storage } from '../storage';

interface LanguageRouteRedirectProps {
  language: AppLanguage;
}

function getStudioRootPath(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const normalizedBasePath = basePath.replace(/\/$/, '');
  return normalizedBasePath ? `${normalizedBasePath}/` : '/';
}

export function replaceToStudioRoot() {
  window.location.replace(getStudioRootPath());
}

export function LanguageRouteRedirect({ language }: LanguageRouteRedirectProps) {
  useEffect(() => {
    storage.setRouteLanguageOverride(language);
    storage.setLanguage(language);
    replaceToStudioRoot();
  }, [language]);

  return null;
}
