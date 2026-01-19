'use client';
import { useCallback } from 'react';
import { QuestionType, AreaType } from '../types';

interface UseQuizLogicProps {
  allQuestions: QuestionType[];
  selectedSections: Set<string>;
  selectedQuestions: Set<number>;
  selectedArea: AreaType | null;
  shuffleQuestions: boolean;
  setQuestions: (questions: QuestionType[]) => void;
  setStatus: (status: Record<number, 'correct' | 'fail' | 'pending'>) => void;
  setCurrent: (current: number | null) => void;
  setShowStatus: (show: boolean) => void;
  setShowResult: (result: null | { correct: boolean; explanation: string }) => void;
  setShowSelectionMenu: (show: boolean) => void;
  setSelectionMode: (mode: null | 'all' | 'sections' | 'questions') => void;
  setSelectedSections: (sections: Set<string>) => void;
  setSelectedQuestions: (questions: Set<number>) => void;
}

export function useQuizLogic({
  allQuestions,
  selectedSections,
  selectedQuestions,
  selectedArea,
  shuffleQuestions,
  setQuestions,
  setStatus,
  setCurrent,
  setShowStatus,
  setShowResult,
  setShowSelectionMenu,
  setSelectionMode,
  setSelectedSections,
  setSelectedQuestions,
}: UseQuizLogicProps) {
  // Start quiz with all questions
  const startQuizAll = useCallback(() => {
    if (!selectedArea) return;

    const areaKey = selectedArea.shortName;
    const orderedQuestions = [...allQuestions];

    // Apply ordering based on shuffleQuestions setting
    if (shuffleQuestions) {
      // Fisher-Yates shuffle using Math.random
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedQuestions[i], orderedQuestions[j]] = [orderedQuestions[j], orderedQuestions[i]];
      }
    } else {
      // Sequential: sort by question number
      orderedQuestions.sort((a, b) => a.number - b.number);
    }

    setQuestions(orderedQuestions);

    // Load or initialize status
    const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
    let newStatus: Record<number, 'correct' | 'fail' | 'pending'>;
    if (savedStatus) {
      const parsedStatus = JSON.parse(savedStatus);
      newStatus = orderedQuestions.reduce(
        (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
          acc[q.index] = parsedStatus[q.index] || 'pending';
          return acc;
        },
        {}
      );
    } else {
      newStatus = orderedQuestions.reduce(
        (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
          acc[q.index] = 'pending';
          return acc;
        },
        {}
      );
    }
    setStatus(newStatus);
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));

    // Store selected questions for session restoration
    localStorage.setItem(
      `selectedQuestions_${areaKey}`,
      JSON.stringify(orderedQuestions.map((q) => q.index))
    );

    // Always start at the beginning when starting all questions
    if (orderedQuestions.length > 0) {
      setCurrent(0);
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [
    allQuestions,
    selectedArea,
    shuffleQuestions,
    setQuestions,
    setStatus,
    setCurrent,
    setShowStatus,
    setShowResult,
    setShowSelectionMenu,
    setSelectionMode,
  ]);

  // Start quiz with selected sections
  const startQuizSections = useCallback(() => {
    if (!selectedArea) return;

    const areaKey = selectedArea.shortName;
    const filtered = allQuestions.filter((q) => selectedSections.has(q.section));

    const orderedQuestions = [...filtered];

    // Apply ordering based on shuffleQuestions setting
    if (shuffleQuestions) {
      // Fisher-Yates shuffle using Math.random
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedQuestions[i], orderedQuestions[j]] = [orderedQuestions[j], orderedQuestions[i]];
      }
    } else {
      // Sequential: sort by question number
      orderedQuestions.sort((a, b) => a.number - b.number);
    }

    setQuestions(orderedQuestions);

    // Load or initialize status
    const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
    let newStatus: Record<number, 'correct' | 'fail' | 'pending'>;
    if (savedStatus) {
      const parsedStatus = JSON.parse(savedStatus);
      newStatus = orderedQuestions.reduce(
        (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
          acc[q.index] = parsedStatus[q.index] || 'pending';
          return acc;
        },
        {}
      );
    } else {
      newStatus = orderedQuestions.reduce(
        (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
          acc[q.index] = 'pending';
          return acc;
        },
        {}
      );
    }
    setStatus(newStatus);
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));

    // Store selected questions for session restoration
    localStorage.setItem(
      `selectedQuestions_${areaKey}`,
      JSON.stringify(orderedQuestions.map((q) => q.index))
    );

    // Always start at the beginning when starting a new section selection
    if (orderedQuestions.length > 0) {
      setCurrent(0);
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [
    allQuestions,
    selectedSections,
    selectedArea,
    shuffleQuestions,
    setQuestions,
    setStatus,
    setCurrent,
    setShowStatus,
    setShowResult,
    setShowSelectionMenu,
    setSelectionMode,
  ]);

  // Start quiz with selected questions
  const startQuizQuestions = useCallback(() => {
    if (!selectedArea) return;

    const areaKey = selectedArea.shortName;
    const filtered = allQuestions.filter((q) => selectedQuestions.has(q.index));

    const orderedQuestions = [...filtered];

    // Apply ordering based on shuffleQuestions setting
    if (shuffleQuestions) {
      // Fisher-Yates shuffle using Math.random
      for (let i = orderedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedQuestions[i], orderedQuestions[j]] = [orderedQuestions[j], orderedQuestions[i]];
      }
    } else {
      // Sequential: sort by question number
      orderedQuestions.sort((a, b) => a.number - b.number);
    }

    setQuestions(orderedQuestions);

    // Load or initialize status
    const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
    let newStatus: Record<number, 'correct' | 'fail' | 'pending'>;
    if (savedStatus) {
      const parsedStatus = JSON.parse(savedStatus);
      newStatus = orderedQuestions.reduce(
        (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
          acc[q.index] = parsedStatus[q.index] || 'pending';
          return acc;
        },
        {}
      );
    } else {
      newStatus = orderedQuestions.reduce(
        (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
          acc[q.index] = 'pending';
          return acc;
        },
        {}
      );
    }
    setStatus(newStatus);
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));

    // Store selected questions for session restoration
    localStorage.setItem(
      `selectedQuestions_${areaKey}`,
      JSON.stringify(orderedQuestions.map((q) => q.index))
    );

    // Always start at the beginning when starting a new question selection
    if (orderedQuestions.length > 0) {
      setCurrent(0);
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [
    allQuestions,
    selectedQuestions,
    selectedArea,
    shuffleQuestions,
    setQuestions,
    setStatus,
    setCurrent,
    setShowStatus,
    setShowResult,
    setShowSelectionMenu,
    setSelectionMode,
  ]);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setShowSelectionMenu(true);
    setShowStatus(false);
    setShowResult(null);
    setCurrent(null);
    setQuestions([]);
    setSelectionMode(null);
    setSelectedSections(new Set());
    setSelectedQuestions(new Set());
  }, [
    setShowSelectionMenu,
    setShowStatus,
    setShowResult,
    setCurrent,
    setQuestions,
    setSelectionMode,
    setSelectedSections,
    setSelectedQuestions,
  ]);

  return {
    startQuizAll,
    startQuizSections,
    startQuizQuestions,
    resetQuiz,
  };
}
