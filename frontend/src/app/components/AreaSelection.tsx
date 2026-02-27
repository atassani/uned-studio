import { AreaType } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { AppLanguage, SUPPORTED_LANGUAGES } from '../i18n/config';

interface AreaSelectionProps {
  areas: AreaType[];
  loadAreaAndQuestions: (area: AreaType) => Promise<void>;
  canConfigureAreas?: boolean;
  onConfigureAreas?: () => void;
  languageSelectionEnabled?: boolean;
  activeLanguage?: AppLanguage;
  onLanguageChange?: (language: AppLanguage) => void;
}

export function AreaSelection({
  areas,
  loadAreaAndQuestions,
  canConfigureAreas = false,
  onConfigureAreas,
  languageSelectionEnabled = false,
  activeLanguage = 'es',
  onLanguageChange,
}: AreaSelectionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-8 flex flex-col items-center justify-center">
      {languageSelectionEnabled && onLanguageChange && (
        <div className="w-64">
          <label
            htmlFor="language-selector"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            {t('language.selectorLabel')}
          </label>
          <select
            id="language-selector"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900"
            data-testid="language-selector"
            aria-label={t('language.selectorAria')}
            value={activeLanguage}
            onChange={(event) => onLanguageChange(event.target.value as AppLanguage)}
          >
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {t(`language.option.${language}` as const)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="text-2xl font-bold mb-4">{t('areas.selection.title')}</div>
      <div className="flex flex-col gap-4 w-64">
        {areas.map((area, index) => (
          <button
            key={area.file}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-lg text-left flex flex-col items-start"
            data-testid={`area-${area.shortName}`}
            onClick={async () => {
              await loadAreaAndQuestions(area);
            }}
            aria-label={t('areas.selection.studyAria', { area: area.area })}
          >
            <span className="font-mono mr-2">({index + 1})</span>
            <span className="text-3xl font-extrabold tracking-widest leading-none">
              {area.shortName.toUpperCase()}
            </span>
            <span className="text-base font-normal text-blue-100 mt-1" style={{ lineHeight: 1 }}>
              {area.area}
            </span>
          </button>
        ))}
        {canConfigureAreas && onConfigureAreas && (
          <button
            className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded text-lg text-center mt-4"
            onClick={onConfigureAreas}
            aria-label={t('areas.selection.configureAria')}
            data-testid="configure-areas-button"
          >
            {t('areas.selection.configureButton')}
          </button>
        )}
      </div>
    </div>
  );
}
