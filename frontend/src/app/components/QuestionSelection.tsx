import { QuestionType, AreaType } from '../types';
import { groupBySection } from '../utils';
import { EMOJI_SECTION } from '../constants';
import { useI18n } from '../i18n/I18nProvider';

interface QuestionSelectionProps {
  selectedArea: AreaType | null;
  allQuestions: QuestionType[];
  selectedQuestions: Set<number>;
  setSelectedQuestions: (questions: Set<number>) => void;
  questionScrollRef: React.RefObject<HTMLDivElement | null>;
  questionScrollMeta: {
    thumbTop: number;
    thumbHeight: number;
    show: boolean;
  };
  startQuizQuestions: () => void;
  resetQuiz: () => void;
}

export function QuestionSelection({
  selectedArea,
  allQuestions,
  selectedQuestions,
  setSelectedQuestions,
  questionScrollRef,
  questionScrollMeta,
  startQuizQuestions,
  resetQuiz,
}: QuestionSelectionProps) {
  const { t } = useI18n();
  // Group questions by section
  const grouped = groupBySection(allQuestions);

  return (
    <div className="space-y-8 flex flex-col items-center justify-center">
      {/* Show area name at top */}
      {selectedArea && (
        <div className="text-lg font-bold text-blue-600 mb-2">
          🎓 {t('common.areaLabel')}: {selectedArea.area}
        </div>
      )}
      <div className="text-2xl font-bold mb-4">{t('questions.title')}</div>
      <div className="relative w-full">
        <div ref={questionScrollRef} className="max-h-96 overflow-y-auto w-full pr-4">
          {[...grouped.entries()].map(([section, qs]) => (
            <div key={section} className="mb-6">
              <div className="font-bold text-lg mb-2">
                {EMOJI_SECTION} {section}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {qs.map((q: QuestionType) => (
                  <label
                    key={q.index}
                    className="flex flex-row items-center justify-center cursor-pointer select-none gap-2"
                  >
                    <span className="text-2xl">{q.number}</span>
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(q.index)}
                      onChange={(e) => {
                        const newSet = new Set(selectedQuestions);
                        if (e.target.checked) newSet.add(q.index);
                        else newSet.delete(q.index);
                        setSelectedQuestions(newSet);
                      }}
                      className="form-checkbox h-5 w-5 text-blue-600"
                      aria-label={t('questions.selectQuestionAria', { number: q.number })}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {questionScrollMeta.show && (
          <div className="absolute top-0 right-1 h-full w-2 rounded-full bg-slate-200 pointer-events-none">
            <div
              className="w-full bg-slate-500 rounded-full"
              style={{
                height: `${questionScrollMeta.thumbHeight}px`,
                transform: `translateY(${questionScrollMeta.thumbTop}px)`,
              }}
            />
          </div>
        )}
      </div>
      <div className="flex gap-4">
        <button
          className="px-6 py-3 bg-purple-600 text-white rounded text-lg"
          disabled={selectedQuestions.size === 0}
          onClick={startQuizQuestions}
          aria-label={t('common.start')}
          data-testid="start-quiz-button"
        >
          {t('common.start')}
        </button>
        <button className="px-6 py-3 bg-gray-400 text-white rounded text-lg" onClick={resetQuiz}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
