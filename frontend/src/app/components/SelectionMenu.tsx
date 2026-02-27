import { AreaType } from '../types';
import { storage } from '../storage';
import { useI18n } from '../i18n/I18nProvider';

interface SelectionMenuProps {
  selectedArea: AreaType | null;
  currentQuizType: 'True False' | 'Multiple Choice' | null;
  shuffleQuestions: boolean;
  setShuffleQuestions: (shuffle: boolean) => void;
  shuffleAnswers: boolean;
  setShuffleAnswers: (shuffle: boolean) => void;
  startQuizAll: () => void;
  openSectionsSelection: () => void;
  openQuestionsSelection: () => void;
  setShowAreaSelection: (show: boolean) => void;
  setShowSelectionMenu: (show: boolean) => void;
}

export function SelectionMenu({
  selectedArea,
  currentQuizType,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleAnswers,
  setShuffleAnswers,
  startQuizAll,
  openSectionsSelection,
  openQuestionsSelection,
  setShowAreaSelection,
  setShowSelectionMenu,
}: SelectionMenuProps) {
  const { t } = useI18n();
  return (
    <div
      className="space-y-8 flex flex-col items-center justify-center"
      data-testid="selection-menu"
    >
      {/* Show area name at top */}
      {selectedArea && (
        <div className="text-lg font-bold text-blue-600 mb-2">
          🎓 {t('common.areaLabel')}: {selectedArea.area}
        </div>
      )}
      <div className="text-2xl font-bold mb-4">{t('menu.title')}</div>
      {/* Question Order Selection: Available for both True/False and Multiple Choice */}
      <div className="flex flex-col items-center space-y-2 mb-2">
        <div className="text-lg font-semibold mb-2">{t('menu.questionOrder')}</div>
        <div className="flex items-center justify-center w-64">
          <span
            className={`text-sm font-medium mr-3 cursor-pointer ${shuffleQuestions ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setShuffleQuestions(true)}
            tabIndex={0}
            role="button"
            aria-label={t('menu.randomOrderAria')}
            data-testid="order-random-button"
          >
            {t('menu.random')}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!shuffleQuestions}
              onChange={(e) => setShuffleQuestions(!e.target.checked)}
              className="sr-only peer"
              aria-label={t('menu.toggleQuestionOrderAria')}
              data-testid="question-order-toggle"
            />
            <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 transition-all duration-300">
              <div
                className={`absolute left-0 top-0 h-8 w-8 rounded-full bg-blue-600 transition-transform duration-300 ${!shuffleQuestions ? 'translate-x-6' : ''}`}
              ></div>
            </div>
          </label>
          <span
            className={`text-sm font-medium ml-3 cursor-pointer ${!shuffleQuestions ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setShuffleQuestions(false)}
            tabIndex={0}
            role="button"
            aria-label={t('menu.sequentialOrderAria')}
            data-testid="order-sequential-button"
          >
            {t('menu.sequential')}
          </span>
        </div>
      </div>
      {/* Answer Order Selection: Only for Multiple Choice */}
      {currentQuizType === 'Multiple Choice' && (
        <div className="flex flex-col items-center space-y-2 mb-4">
          <div className="text-lg font-semibold mb-2">{t('menu.answerOrder')}</div>
          <div className="flex items-center justify-center w-64">
            <span
              className={`text-sm font-medium mr-3 cursor-pointer ${shuffleAnswers ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => setShuffleAnswers(true)}
              tabIndex={0}
              role="button"
              aria-label={t('menu.randomAnswersAria')}
              data-testid="answer-order-random-button"
            >
              {t('menu.random')}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!shuffleAnswers}
                onChange={(e) => setShuffleAnswers(!e.target.checked)}
                className="sr-only peer"
                aria-label={t('menu.toggleAnswerOrderAria')}
                data-testid="answer-order-toggle"
              />
              <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 transition-all duration-300">
                <div
                  className={`absolute left-0 top-0 h-8 w-8 rounded-full bg-blue-600 transition-transform duration-300 ${!shuffleAnswers ? 'translate-x-6' : ''}`}
                ></div>
              </div>
            </label>
            <span
              className={`text-sm font-medium ml-3 cursor-pointer ${!shuffleAnswers ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => setShuffleAnswers(false)}
              tabIndex={0}
              role="button"
              aria-label={t('menu.sequentialAnswersAria')}
              data-testid="answer-order-sequential-button"
            >
              {t('menu.sequential')}
            </span>
          </div>
        </div>
      )}
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded text-lg w-64"
        onClick={() => {
          startQuizAll();
        }}
        aria-label={t('menu.allQuestionsAria')}
        data-testid="quiz-all-button"
      >
        {t('menu.allQuestions')}
      </button>
      <button
        className="px-6 py-3 bg-green-600 text-white rounded text-lg w-64"
        onClick={openSectionsSelection}
        aria-label={t('menu.selectSectionsAria')}
        data-testid="quiz-sections-button"
      >
        {t('menu.selectSections')}
      </button>
      <button
        className="px-6 py-3 bg-purple-600 text-white rounded text-lg w-64"
        onClick={openQuestionsSelection}
        aria-label={t('menu.selectQuestionsAria')}
        data-testid="quiz-questions-button"
      >
        {t('menu.selectQuestions')}
      </button>
      <button
        className="px-6 py-3 bg-gray-500 text-white rounded text-lg w-64 mt-6"
        data-testid="change-area-button"
        onClick={() => {
          setShowAreaSelection(true);
          setShowSelectionMenu(false);
          storage.setCurrentArea(undefined);
        }}
        aria-label={t('menu.changeAreaAria')}
      >
        {t('menu.changeArea')}
      </button>
    </div>
  );
}
