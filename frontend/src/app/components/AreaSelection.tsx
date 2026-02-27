import { AreaType } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface AreaSelectionProps {
  areas: AreaType[];
  loadAreaAndQuestions: (area: AreaType) => Promise<void>;
  canConfigureAreas?: boolean;
  onConfigureAreas?: () => void;
}

export function AreaSelection({
  areas,
  loadAreaAndQuestions,
  canConfigureAreas = false,
  onConfigureAreas,
}: AreaSelectionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-8 flex flex-col items-center justify-center">
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
