'use client';
import { useEffect } from 'react';
import { AreaType, QuestionType } from '../types';
import { storage } from '../storage';

interface UseKeyboardShortcutsProps {
  showAreaSelection: boolean;
  areas: AreaType[];
  setSelectedArea: (area: AreaType) => void;
  setCurrentQuizType: (type: 'True False' | 'Multiple Choice') => void;
  setShowAreaSelection: (show: boolean) => void;
  setShowSelectionMenu: (show: boolean) => void;
  loadQuestionsForArea: (area: AreaType) => void;
  showSelectionMenu: boolean;
  selectionMode: null | 'all' | 'sections' | 'questions';
  setSelectionMode: (mode: null | 'all' | 'sections' | 'questions') => void;
  startQuizAll: () => void;
  startQuizSections: () => void;
  startQuizQuestions: () => void;
  selectedSections: Set<string>;
  selectedQuestions: Set<number>;
  showStatus: boolean;
  showResult: null | { correct: boolean; explanation: string };
  current: number | null;
  questions: QuestionType[];
  currentQuizType: 'True False' | 'Multiple Choice' | null;
  handleAnswer: (answer: string) => void;
  goToStatusWithResume: () => void;
  handleContinue: (action: 'C' | 'E') => void;
  resetQuiz: () => void;
  pendingQuestions: () => [number, QuestionType][];
}

export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps) {
  const {
    showAreaSelection,
    areas,
    setSelectedArea,
    setCurrentQuizType,
    setShowAreaSelection,
    setShowSelectionMenu,
    loadQuestionsForArea,
    showSelectionMenu,
    selectionMode,
    setSelectionMode,
    startQuizAll,
    startQuizSections,
    startQuizQuestions,
    selectedSections,
    selectedQuestions,
    showStatus,
    showResult,
    current,
    questions,
    currentQuizType,
    handleAnswer,
    goToStatusWithResume,
    handleContinue,
    resetQuiz,
    pendingQuestions,
  } = props;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      const isTextInput =
        active &&
        (active.tagName === 'TEXTAREA' ||
          (active.tagName === 'INPUT' &&
            !['checkbox', 'radio'].includes((active as HTMLInputElement).type)) ||
          active.getAttribute('contenteditable') === 'true');
      if (isTextInput) return;

      if (showAreaSelection) {
        // Allow number keys 1,2,3 for quick area selection
        const num = parseInt(e.key);
        if (num >= 1 && num <= areas.length) {
          const area = areas[num - 1];
          setSelectedArea(area);
          setCurrentQuizType(area.type);
          setShowAreaSelection(false);
          setShowSelectionMenu(true);
          loadQuestionsForArea(area);
          // Track area for persistence
          storage.setCurrentArea(area.shortName);
        }
      }

      if (showSelectionMenu && !selectionMode) {
        if (e.key.toLowerCase() === 't') {
          setSelectionMode('all');
          startQuizAll();
        }
        if (e.key.toLowerCase() === 's') {
          setSelectionMode('sections');
        }
        if (e.key.toLowerCase() === 'p') {
          setSelectionMode('questions');
        }
      }

      if (showSelectionMenu && selectionMode === 'sections') {
        if (e.key === 'Enter' || e.key === 'Return' || e.key === 'NumpadEnter') {
          if (selectedSections.size > 0) startQuizSections();
        }
      }

      if (showSelectionMenu && selectionMode === 'questions') {
        if (e.key === 'Enter' || e.key === 'Return' || e.key === 'NumpadEnter') {
          if (selectedQuestions.size > 0) startQuizQuestions();
        }
      }

      if (!showSelectionMenu && !showStatus && !showResult && current !== null) {
        if (currentQuizType === 'True False') {
          if (e.key.toLowerCase() === 'v') handleAnswer('V');
          if (e.key.toLowerCase() === 'f') handleAnswer('F');
        } else if (currentQuizType === 'Multiple Choice') {
          const letter = e.key.toLowerCase();
          if (['a', 'b', 'c', 'd', 'e', 'f'].includes(letter)) {
            handleAnswer(letter);
          }
          // Numeric shortcuts: 1 = A, 2 = B, ...
          const num = parseInt(e.key, 10);
          if (
            !isNaN(num) &&
            num >= 1 &&
            current !== null &&
            questions[current]?.options &&
            num <= questions[current].options.length
          ) {
            const letterForNum = String.fromCharCode(96 + num); // 1->a, 2->b, ...
            handleAnswer(letterForNum);
          }
        }
        if (e.key.toLowerCase() === 'e') goToStatusWithResume();
      }

      if (!showSelectionMenu && showResult) {
        if (e.key.toLowerCase() === 'c') handleContinue('C');
        if (e.key.toLowerCase() === 'e') handleContinue('E');
      }

      if (!showSelectionMenu && showStatus) {
        if (e.key.toLowerCase() === 'c' && pendingQuestions().length > 0) handleContinue('C');
        if (e.key.toLowerCase() === 'v') resetQuiz();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showAreaSelection,
    areas,
    setSelectedArea,
    setCurrentQuizType,
    setShowAreaSelection,
    setShowSelectionMenu,
    loadQuestionsForArea,
    showSelectionMenu,
    selectionMode,
    setSelectionMode,
    startQuizAll,
    startQuizSections,
    startQuizQuestions,
    selectedSections,
    selectedQuestions,
    showStatus,
    showResult,
    current,
    questions,
    currentQuizType,
    handleAnswer,
    goToStatusWithResume,
    handleContinue,
    resetQuiz,
    pendingQuestions,
  ]);
}
