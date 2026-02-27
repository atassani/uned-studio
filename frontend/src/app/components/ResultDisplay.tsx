'use client';
import React from 'react';
import { QuestionType, AreaType } from '../types';
import { formatRichText, groupBySection } from '../utils';
import {
  EMOJI_SUCCESS,
  EMOJI_FAIL,
  EMOJI_ASK,
  EMOJI_SECTION,
  EMOJI_PROGRESS,
  EMOJI_DONE,
} from '../constants';
import { useI18n } from '../i18n/I18nProvider';

interface ResultDisplayProps {
  selectedArea: AreaType | null;
  questions: QuestionType[];
  current: number | null;
  currentQuizType: 'True False' | 'Multiple Choice' | null;
  showResult: null | { correct: boolean; explanation: string };
  status: Record<number, 'correct' | 'fail' | 'pending'>;
  userAnswers: Record<number, string>;
  handleContinue: (action: 'C' | 'E') => void;
  resetQuiz: () => void;
}

export function ResultDisplay({
  selectedArea,
  questions,
  current,
  currentQuizType,
  showResult,
  status,
  userAnswers,
  handleContinue,
  resetQuiz,
}: ResultDisplayProps) {
  const { t } = useI18n();
  const [reviewIndex, setReviewIndex] = React.useState<number | null>(null);
  const allAnswered =
    questions.length > 0 && Object.values(status).filter((s) => s === 'pending').length === 0;

  // Single question result display
  if (showResult) {
    return (
      <div className="space-y-4">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 {t('common.areaLabel')}: {selectedArea.area}
          </div>
        )}
        {current !== null && questions[current] && (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg flex-1">
                {EMOJI_SECTION} {questions[current].section}
              </div>
              <button
                className="ml-2 text-2xl"
                aria-label={t('quiz.optionsAria')}
                data-testid="options-button"
                onClick={() => handleContinue('E')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ⚙️
              </button>
            </div>
            <div
              className="text-xl font-semibold rich-content question-text"
              dangerouslySetInnerHTML={formatRichText(
                `${questions[current].number}. ${questions[current].question}`
              )}
            ></div>
          </>
        )}
        <div data-testid="quiz-result-text" className="text-2xl">
          {showResult.correct
            ? `${EMOJI_SUCCESS} ${t('quiz.correct')}`
            : `${EMOJI_FAIL} ${t('quiz.incorrect')}`}
        </div>
        <div
          className={`text-base font-semibold mt-2 rich-content ${showResult.correct ? 'text-green-600' : 'text-red-600'}`}
          dangerouslySetInnerHTML={formatRichText(
            current !== null && questions[current]
              ? currentQuizType === 'Multiple Choice'
                ? (() => {
                    const q = questions[current];
                    const answerIndex = q.options?.findIndex((option) => option === q.answer) ?? -1;
                    const answerLetter =
                      answerIndex >= 0 ? String.fromCharCode(65 + answerIndex) : '';
                    return `${t('quiz.expectedAnswerPrefix')} ${answerLetter}) ${q.answer}`;
                  })()
                : questions[current].answer
              : ''
          )}
        ></div>
        <div
          className="text-base rich-content"
          dangerouslySetInnerHTML={formatRichText(showResult.explanation)}
        ></div>
        {/* appearsIn bullet list if present */}
        {current !== null &&
          questions[current] &&
          Array.isArray(questions[current].appearsIn) &&
          questions[current].appearsIn.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-500">{t('common.appearsIn')}</div>
              <ul className="list-disc list-inside ml-4 text-sm text-gray-500">
                {questions[current].appearsIn.map((ref: string, idx: number) => (
                  <li key={idx}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        <div className="flex gap-4 mt-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            data-testid="result-continue-button"
            onClick={() => handleContinue('C')}
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    );
  }

  // Quiz completion summary display
  if (allAnswered) {
    const grouped = groupBySection(questions);
    const correctCount = Object.values(status).filter((s) => s === 'correct').length;
    const failCount = Object.values(status).filter((s) => s === 'fail').length;
    const pendingCount = questions.length - (correctCount + failCount);

    // If a question is selected for review, show its info
    if (reviewIndex !== null && questions[reviewIndex]) {
      const q = questions[reviewIndex];
      return (
        <>
          <div className="space-y-6 mt-8 question-info">
            {selectedArea && (
              <div className="text-lg font-bold text-blue-600 mb-2">
                🎓 {t('common.areaLabel')}: {selectedArea.area}
              </div>
            )}
            <div className="font-bold text-lg">
              {EMOJI_SECTION} {q.section}
            </div>
            <div
              className="text-xl font-semibold rich-content question-text"
              dangerouslySetInnerHTML={formatRichText(`${q.number}. ${q.question}`)}
            ></div>
            {/* Show user's answer and correct answer if available */}
            <div className="mt-2">
              <div className="font-semibold">{t('quiz.yourAnswer')}</div>
              <div className="text-base user-answer">
                {status[q.index] === 'pending' ? (
                  <span className="text-gray-500">{t('quiz.noAnswer')}</span>
                ) : (
                  userAnswers[q.index] || (
                    <span className="text-gray-500">{t('quiz.noAnswer')}</span>
                  )
                )}
              </div>
              <div className="font-semibold mt-2">{t('quiz.correctAnswer')}</div>
              <div className="text-base correct-answer">{q.answer}</div>
            </div>
            {/* appearsIn bullet list if present */}
            {Array.isArray(q.appearsIn) && q.appearsIn.length > 0 && (
              <div className="mt-2">
                <div className="text-sm text-gray-500">{t('common.appearsIn')}</div>
                <ul className="list-disc list-inside ml-4 text-sm text-gray-500">
                  {q.appearsIn.map((ref: string, idx: number) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setReviewIndex(null)}
            >
              {t('quiz.backToSummary')}
            </button>
          </div>
        </>
      );
    }

    return (
      <div className="space-y-8 mt-8">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 {t('common.areaLabel')}: {selectedArea.area}
          </div>
        )}
        <div className="text-2xl font-bold">
          {EMOJI_DONE} {t('quiz.completed')}
        </div>
        <div className="mt-2 text-base flex items-center gap-2">
          {EMOJI_PROGRESS} {questions.length}
          <span className="ml-2">
            {EMOJI_SUCCESS} {correctCount}
          </span>
          <span>
            {EMOJI_ASK} {pendingCount}
          </span>
        </div>
        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={resetQuiz}>
            {t('quiz.restart')}
          </button>
        </div>
        {[...grouped.entries()].map(([section, qs]) => (
          <div key={section}>
            <div className="font-bold text-lg mb-2">
              {EMOJI_SECTION} {section}
            </div>
            <div className="grid grid-cols-5 gap-2 status-grid">
              {qs.map((q: QuestionType) => {
                let emoji = EMOJI_ASK;
                if (status[q.index] === 'correct') emoji = EMOJI_SUCCESS;
                else if (status[q.index] === 'fail') emoji = EMOJI_FAIL;
                return (
                  <button
                    key={q.index}
                    className={`flex flex-col items-center focus:outline-none rounded status-box ${status[q.index]}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setReviewIndex(q.index)}
                    aria-label={t('quiz.viewQuestionAria', { number: q.number })}
                  >
                    <span className="text-2xl">
                      {q.number}
                      {emoji}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-4">
          <span>
            {EMOJI_SUCCESS} = {t('quiz.legendCorrect')}{' '}
          </span>
          <span>
            {EMOJI_FAIL} = {t('quiz.legendFailed')}{' '}
          </span>
          <span>
            {EMOJI_ASK} = {t('quiz.legendPending')}
          </span>
        </div>
        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={resetQuiz}>
            {t('quiz.restart')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
