import { notFound } from 'next/navigation';
import { LanguageRouteRedirect } from '../components/LanguageRouteRedirect';
import { AppLanguage, SUPPORTED_LANGUAGES } from '../i18n/config';

type LanguageRouteParams = {
  language: string;
};

interface LanguageRoutePageProps {
  params: LanguageRouteParams;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((language) => ({ language }));
}

function isSupportedLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

export default function LanguageRoutePage({ params }: LanguageRoutePageProps) {
  const { language } = params;
  if (!isSupportedLanguage(language)) {
    notFound();
  }
  return <LanguageRouteRedirect language={language} />;
}
