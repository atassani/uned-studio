'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { QuestionType, AreaType } from './types';
import { shuffleOptionsWithMemory, createSeededRng, getUserDisplayName } from './utils';
import packageJson from '../../package.json';
import { AreaSelection } from './components/AreaSelection';
import { SelectionMenu } from './components/SelectionMenu';
import { SectionSelection } from './components/SectionSelection';
import { QuestionSelection } from './components/QuestionSelection';
import { StatusGrid } from './components/StatusGrid';
import { QuestionDisplay } from './components/QuestionDisplay';
import { ResultDisplay } from './components/ResultDisplay';
import { useAuth } from './hooks/useAuth';
import {
  trackAreaSelection,
  trackQuizStart,
  trackQuizComplete,
  trackAnswerSubmit,
  trackAuth,
} from './lib/analytics';

import { useQuizPersistence } from './hooks/useQuizPersistence';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useQuizLogic } from './hooks/useQuizLogic';
import { storage } from './storage';

export default function QuizApp() {
  // Auth hook
  const { user, logout } = useAuth();

  // Track user answers for each question (index -> answer string)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const canResumeRef = useRef(false);
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([]); // All loaded questions
  const [questions, setQuestions] = useState<QuestionType[]>([]); // Filtered questions for this session
  const [status, setStatus] = useState<Record<number, 'correct' | 'fail' | 'pending'>>({});
  // 'current' is the index in the filtered 'questions' array
  const [current, setCurrent] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<null | { correct: boolean; explanation: string }>(
    null
  );
  const [showSelectionMenu, setShowSelectionMenu] = useState<boolean>(true);
  const [selectionMode, setSelectionMode] = useState<null | 'all' | 'sections' | 'questions'>(null);
  const previousAnswerOrderRef = useRef<Record<number, string[]>>({});
  const currentAnswerOrderRef = useRef<Record<number, string[]>>({});
  const answerShuffleSeedRef = useRef(0);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const questionScrollRef = useRef<HTMLDivElement | null>(null);
  const [questionScrollMeta, setQuestionScrollMeta] = useState<{
    thumbTop: number;
    thumbHeight: number;
    show: boolean;
  }>({ thumbTop: 0, thumbHeight: 0, show: false });
  const resumeQuestionRef = useRef<number | null>(null);
  const currentLoadingAreaRef = useRef<string | null>(null);

  // New area-related state
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaType | null>(null);
  const [showAreaSelection, setShowAreaSelection] = useState<boolean>(true);
  const [currentQuizType, setCurrentQuizType] = useState<'True False' | 'Multiple Choice' | null>(
    null
  );

  // Shuffle questions toggle state
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true); // true = random, false = sequential
  // Shuffle answers toggle state
  const [shuffleAnswers, setShuffleAnswers] = useState<boolean>(false);

  // Compute displayOptions for MCQ at the top level, using useMemo at the component level
  const displayOptions = useMemo(() => {
    if (
      current === null ||
      currentQuizType !== 'Multiple Choice' ||
      !questions[current] ||
      !Array.isArray(questions[current].options)
    ) {
      return [];
    }

    const q = questions[current];
    const baseOptions = q.options ?? [];

    if (shuffleAnswers && baseOptions.length > 1) {
      const cachedOrder = currentAnswerOrderRef.current[q.index];
      if (cachedOrder) {
        return cachedOrder;
      }
      const previousOrder = previousAnswerOrderRef.current[q.index];
      const rng = createSeededRng(answerShuffleSeedRef.current * 977 + q.index * 131);
      const nextOrder = shuffleOptionsWithMemory(baseOptions, previousOrder, rng);
      currentAnswerOrderRef.current[q.index] = nextOrder;
      return nextOrder;
    }

    const sequentialOrder = [...baseOptions];
    currentAnswerOrderRef.current[q.index] = sequentialOrder;
    return sequentialOrder;
  }, [current, currentQuizType, questions, shuffleAnswers]);

  // Use custom hooks for persistence, keyboard shortcuts, and quiz logic
  useQuizPersistence(
    selectedArea,
    current,
    shuffleQuestions,
    setShuffleQuestions,
    shuffleAnswers,
    setShuffleAnswers,
    status,
    questions.length
  );

  // Load areas on component mount and migrate any old global quizStatus to per-area keys
  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = () => {
    setAreasError(null); // Clear any previous errors

    // Support custom areas file via env var or ?areas= query param
    let areasFile = process.env.NEXT_PUBLIC_AREAS_FILE || 'areas.json';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('areas')) {
        areasFile = params.get('areas')!;
      }
    }
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${areasFile}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Error ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then((areasData: AreaType[]) => {
        setAreas(areasData);
        setAreasError(null);
        // Only show area selection if no area is selected
        const currentAreaShortName = storage.getCurrentArea();
        if (currentAreaShortName) {
          const areaToRestore = areasData.find((area) => area.shortName === currentAreaShortName);
          if (areaToRestore) {
            setSelectedArea(areaToRestore);
            setCurrentQuizType(areaToRestore.type);
            // Restore shuffleQuestions for this area
            const savedShuffleQuestions = storage.getAreaShuffleQuestions(areaToRestore.shortName);
            if (typeof savedShuffleQuestions === 'boolean') {
              setShuffleQuestions(savedShuffleQuestions);
            } else {
              setShuffleQuestions(true);
            }
            // Restore shuffleAnswers for this area
            const savedShuffleAnswers = storage.getAreaShuffleAnswers(areaToRestore.shortName);
            if (typeof savedShuffleAnswers === 'boolean') {
              setShuffleAnswers(savedShuffleAnswers);
            } else {
              setShuffleAnswers(false);
            }
            setShowAreaSelection(false);
            return;
          }
        }
        setShowAreaSelection(true);
      })
      .catch((err) => {
        console.error('Failed to load areas:', err);
        setAreasError(
          err.message || 'Failed to load study areas. Please check your connection and try again.'
        );
      });
  };

  useEffect(() => {
    previousAnswerOrderRef.current = {};
    currentAnswerOrderRef.current = {};
    answerShuffleSeedRef.current = 0;
  }, [selectedArea]);

  // Shared function to load area questions and restore progress
  const loadAreaAndQuestions = async (area: AreaType, forceMenu = false) => {
    // Track the current area being loaded to prevent race conditions
    const loadingId = `${area.shortName}_${Date.now()}`;
    currentLoadingAreaRef.current = loadingId;

    // Reset current state when switching areas to prevent cross-contamination
    setCurrent(null);
    // Reset questions immediately to prevent persistence useEffect from using wrong data
    setQuestions([]);

    setSelectedArea(area);
    setCurrentQuizType(area.type);
    setShowAreaSelection(false);
    // Track area for persistence
    storage.setCurrentArea(area.shortName);

    // Track area selection in Google Analytics
    trackAreaSelection(area.shortName);

    // Always load questions and restore progress if available
    const areaKey = area.shortName;
    const savedStatus = storage.getAreaQuizStatus(areaKey);
    const savedCurrent = storage.getAreaCurrentQuestion(areaKey);
    const savedSelectedQuestions = storage.getAreaSelectedQuestions(areaKey);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${area.file}`);
    if (currentLoadingAreaRef.current !== loadingId) return;
    if (response.ok) {
      const questionsData = await response.json();
      const questionsWithIndex = questionsData.map((q: QuestionType, idx: number) => ({
        ...q,
        index: idx,
      }));
      if (currentLoadingAreaRef.current !== loadingId) return;
      setAllQuestions(questionsWithIndex);
      let parsedStatus: Record<number, 'correct' | 'fail' | 'pending'> = {};
      if (savedStatus) {
        parsedStatus = savedStatus;
      } else {
        parsedStatus = questionsWithIndex.reduce(
          (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
            acc[q.index] = 'pending';
            return acc;
          },
          {}
        );
      }
      setStatus(parsedStatus);

      // Load shuffle preference for this area from localStorage
      const savedShuffleQuestions = storage.getAreaShuffleQuestions(areaKey);
      const shouldShuffleQuestions =
        savedShuffleQuestions !== undefined ? savedShuffleQuestions : true;

      // Order questions according to shuffle preference
      let orderedQuestions = [...questionsWithIndex];
      if (!shouldShuffleQuestions) {
        orderedQuestions.sort((a, b) => a.number - b.number);
      } else {
        // Replace Math.random() with Fisher-Yates shuffle for stable randomization
        function fisherYatesShuffle<T>(array: T[]): T[] {
          const shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        }

        // Use Fisher-Yates shuffle for random order
        orderedQuestions = fisherYatesShuffle(orderedQuestions);
      }

      // If we have saved selected questions, filter to only those questions
      if (savedSelectedQuestions) {
        const selectedIndices = savedSelectedQuestions;
        orderedQuestions = orderedQuestions.filter((q) => selectedIndices.includes(q.index));
      } else if (savedStatus) {
        // Legacy session without savedSelectedQuestions - infer from saved status indices
        const statusIndices = Object.keys(savedStatus).map(Number);
        orderedQuestions = orderedQuestions.filter((q) => statusIndices.includes(q.index));
      }

      // If forced via parameter, always show the menu on area change
      if (forceMenu) {
        setQuestions([]);
        setCurrent(null);
        setShowSelectionMenu(true);
        setSelectionMode(null);
        setShowStatus(false);
        setShowResult(null);
        return;
      }
      // If all questions are answered, show the menu and clean up currentQuestion
      const allAnswered =
        Object.values(parsedStatus).length > 0 &&
        Object.values(parsedStatus).every((s) => s !== 'pending');
      if (allAnswered) {
        storage.setAreaCurrentQuestion(areaKey, undefined);
        setQuestions([]);
        setCurrent(null);
        setShowSelectionMenu(true);
        setSelectionMode(null);
        setShowStatus(false);
        setShowResult(null);
        return;
      }
      // If there is no saved progress, show the selection menu
      if (!savedStatus && !savedCurrent) {
        setQuestions([]);
        setCurrent(null);
        setShowSelectionMenu(true);
        setSelectionMode(null);
        setShowStatus(false);
        setShowResult(null);
        return;
      }
      // Otherwise, resume at the last question or first pending
      let idx = 0;
      if (savedCurrent !== null) {
        const n = Number(savedCurrent);
        if (!isNaN(n) && n >= 0 && n < orderedQuestions.length) {
          idx = n;
        } else {
          // If savedCurrent is out of range, find first pending
          const nextPending = orderedQuestions.findIndex(
            (q) => parsedStatus[q.index] === 'pending'
          );
          if (nextPending !== -1) {
            idx = nextPending;
          }
        }
      } else {
        // If no saved current, try to resume at first pending
        const nextPending = orderedQuestions.findIndex((q) => parsedStatus[q.index] === 'pending');
        if (nextPending !== -1) {
          idx = nextPending;
        }
      }

      setQuestions(orderedQuestions);
      setCurrent(idx);
      setShowSelectionMenu(false);
      setSelectionMode(null);
      setShowStatus(false);
      setShowResult(null);
      return;
    }
    setShowSelectionMenu(true);
    setQuestions([]);
    setCurrent(null);
  };

  // Get quiz logic functions from custom hook
  const {
    startQuizAll: baseStartQuizAll,
    startQuizSections: baseStartQuizSections,
    startQuizQuestions: baseStartQuizQuestions,
    resetQuiz,
  } = useQuizLogic({
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
  });

  const prepareNewRun = useCallback(() => {
    // Ensure a new seed for answer shuffling on every run
    answerShuffleSeedRef.current = Math.floor(Math.random() * 1e9);
    // Reset answer order caches so new shuffle is generated for each run
    previousAnswerOrderRef.current = {};
    currentAnswerOrderRef.current = {};
  }, []);

  const startQuizAll = useCallback(() => {
    prepareNewRun();
    baseStartQuizAll();

    // Track quiz start in Google Analytics
    if (selectedArea) {
      trackQuizStart(selectedArea.shortName, 'all_questions');
    }
  }, [prepareNewRun, baseStartQuizAll, selectedArea]);

  const startQuizSections = useCallback(() => {
    prepareNewRun();
    baseStartQuizSections();

    // Track quiz start in Google Analytics
    if (selectedArea) {
      trackQuizStart(selectedArea.shortName, 'sections');
    }
  }, [prepareNewRun, baseStartQuizSections, selectedArea]);

  const startQuizQuestions = useCallback(() => {
    prepareNewRun();
    baseStartQuizQuestions();

    // Track quiz start in Google Analytics
    if (selectedArea) {
      trackQuizStart(selectedArea.shortName, 'questions');
    }
  }, [prepareNewRun, baseStartQuizQuestions, selectedArea]);

  // Load questions for selected area on every area change
  useEffect(() => {
    if (!selectedArea) return;
    loadAreaAndQuestions(selectedArea);
  }, [selectedArea]);

  // Keep a visible scroll indicator for the question selection view
  useEffect(() => {
    if (selectionMode !== 'questions') return;

    function updateScrollIndicator() {
      const el = questionScrollRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
      const show = maxScrollTop > 0;
      const trackHeight = clientHeight;
      const thumbHeight = show
        ? Math.max((clientHeight / scrollHeight) * trackHeight, 20)
        : trackHeight;
      const thumbTop =
        show && maxScrollTop > 0 ? (scrollTop / maxScrollTop) * (trackHeight - thumbHeight) : 0;
      setQuestionScrollMeta({ thumbTop, thumbHeight, show });
    }

    const el = questionScrollRef.current;
    updateScrollIndicator();
    if (!el) return;
    el.addEventListener('scroll', updateScrollIndicator);
    window.addEventListener('resize', updateScrollIndicator);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicator);
      window.removeEventListener('resize', updateScrollIndicator);
    };
  }, [selectionMode, allQuestions.length]);

  // Define all functions used in the component
  const pendingQuestions = useCallback(() => {
    return questions
      .map((q, i) => [i, q] as [number, QuestionType])
      .filter(([, q]) => status[q.index] === 'pending');
  }, [questions, status]);

  const loadQuestionsForArea = useCallback(async (area: AreaType) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${area.file}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const questionsData = await response.json();

      // Add indices to questions for tracking
      const questionsWithIndex = questionsData.map((q: QuestionType, idx: number) => ({
        ...q,
        index: idx,
      }));
      setAllQuestions(questionsWithIndex);

      // Load saved status for this area
      const areaKey = area.shortName;

      const savedStatus = storage.getAreaQuizStatus(areaKey);
      if (savedStatus) {
        setStatus(savedStatus);
      } else {
        // Initialize all questions as pending
        const pendingStatus = questionsWithIndex.reduce(
          (acc: Record<number, 'correct' | 'fail' | 'pending'>, q: QuestionType) => {
            acc[q.index] = 'pending';
            return acc;
          },
          {}
        );
        setStatus(pendingStatus);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setAllQuestions([]);
      setStatus({});
    }
  }, []);
  // Area selection UI
  function renderAreaSelection() {
    if (areasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold mb-2">Error al cargar las áreas</h2>
              <p className="text-sm text-red-600 dark:text-red-300 mb-4">{areasError}</p>
              <button
                onClick={loadAreas}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <AreaSelection areas={areas} loadAreaAndQuestions={loadAreaAndQuestions} />;
  }

  // Selection menu UI
  function renderSelectionMenu() {
    return (
      <SelectionMenu
        currentQuizType={currentQuizType}
        selectedArea={selectedArea}
        shuffleQuestions={shuffleQuestions}
        setShuffleQuestions={setShuffleQuestions}
        shuffleAnswers={shuffleAnswers}
        setShuffleAnswers={setShuffleAnswers}
        setSelectionMode={setSelectionMode}
        startQuizAll={startQuizAll}
        setShowAreaSelection={setShowAreaSelection}
        setShowSelectionMenu={setShowSelectionMenu}
      />
    );
  }

  // Section selection UI
  function renderSectionSelection() {
    return (
      <SectionSelection
        selectedArea={selectedArea}
        allQuestions={allQuestions}
        selectedSections={selectedSections}
        setSelectedSections={setSelectedSections}
        startQuizSections={startQuizSections}
        resetQuiz={resetQuiz}
      />
    );
  }

  // Question selection UI
  function renderQuestionSelection() {
    return (
      <QuestionSelection
        selectedArea={selectedArea}
        allQuestions={allQuestions}
        selectedQuestions={selectedQuestions}
        setSelectedQuestions={setSelectedQuestions}
        questionScrollRef={questionScrollRef}
        questionScrollMeta={questionScrollMeta}
        startQuizQuestions={startQuizQuestions}
        resetQuiz={resetQuiz}
      />
    );
  }

  const handleAnswer = useCallback(
    (ans: string) => {
      if (current == null || !selectedArea) return;
      const q = questions[current];
      const expected = q.answer.trim().toUpperCase();
      const user = ans.trim().toUpperCase();

      let correct = false;
      let answerToStore = ans;

      if (currentQuizType === 'True False') {
        correct =
          user === expected ||
          (user === 'V' && expected === 'VERDADERO') ||
          (user === 'F' && expected === 'FALSO') ||
          (user === 'VERDADERO' && expected === 'V') ||
          (user === 'FALSO' && expected === 'F');
      } else if (currentQuizType === 'Multiple Choice') {
        const userLetter = user.toLowerCase();
        const userIndex = userLetter.charCodeAt(0) - 97;
        const userAnswer = displayOptions[userIndex] || '';
        correct = userAnswer === q.answer;
        answerToStore = userAnswer;
      }

      const newStatus: Record<number, 'correct' | 'fail' | 'pending'> = {
        ...status,
        [q.index]: correct ? 'correct' : 'fail',
      };
      setStatus(newStatus);
      setUserAnswers((prev) => ({ ...prev, [q.index]: answerToStore }));
      const areaKey = selectedArea.shortName;
      storage.setAreaQuizStatus(areaKey, newStatus);
      setShowResult({ correct, explanation: q.explanation });

      // Track answer submission in Google Analytics
      if (currentQuizType) {
        trackAnswerSubmit(selectedArea.shortName, currentQuizType, correct);
      }
    },
    [current, questions, status, selectedArea, currentQuizType, displayOptions]
  );

  const nextQuestion = useCallback(() => {
    const pending = pendingQuestions();
    if (pending.length === 0) {
      // Quiz completed - track completion in Google Analytics
      if (selectedArea && status) {
        const totalQuestions = questions.length;
        const correctAnswers = Object.values(status).filter((s) => s === 'correct').length;
        const quizType = selectionMode || 'unknown';

        trackQuizComplete(selectedArea.shortName, String(quizType), correctAnswers, totalQuestions);
      }

      setShowStatus(false);
      setCurrent(null);
      setShowResult(null);
      return;
    }
    let nextIdx: number | null = null;
    if (!shuffleQuestions) {
      // Find the next higher-numbered pending question after current, or the lowest if at end
      // Get all pending questions sorted by .number
      const pendingSorted = pending
        .map(([idx, q]) => ({ idx, number: q.number }))
        .sort((a, b) => a.number - b.number);
      // Find the next higher-numbered pending
      let found = false;
      for (let i = 0; i < pendingSorted.length; ++i) {
        if (
          current !== null &&
          questions[current] &&
          pendingSorted[i].number > questions[current].number
        ) {
          nextIdx = pendingSorted[i].idx;
          found = true;
          break;
        }
      }
      if (!found) {
        // If none found, go to the lowest-numbered pending
        nextIdx = pendingSorted.length > 0 ? pendingSorted[0].idx : null;
      }
    } else {
      // Random order
      if (pending.length > 0) {
        [nextIdx] = pending[Math.floor(Math.random() * pending.length)];
      } else {
        nextIdx = null;
      }
    }
    setCurrent(nextIdx ?? null);
    setShowStatus(false);
    setShowResult(null);
  }, [pendingQuestions, current, questions, shuffleQuestions, selectedArea, status, selectionMode]);

  const handleContinue = useCallback(
    (action: string) => {
      if (action === 'C' && showResult) {
        resumeQuestionRef.current = null;
        canResumeRef.current = false;
        nextQuestion();
        return;
      }
      if (action === 'E') {
        if (!showResult && current !== null) {
          resumeQuestionRef.current = current;
          canResumeRef.current = true;
        } else {
          resumeQuestionRef.current = null;
          canResumeRef.current = false;
        }
        setShowStatus(true);
        setShowResult(null);
      } else {
        if (resumeQuestionRef.current !== null && canResumeRef.current) {
          setShowStatus(false);
          setCurrent(resumeQuestionRef.current);
          resumeQuestionRef.current = null;
          canResumeRef.current = false;
        } else {
          resumeQuestionRef.current = null;
          canResumeRef.current = false;
          nextQuestion();
        }
      }
    },
    [showResult, current, nextQuestion]
  );

  // Helper to go to status and enable resume (only from question view)
  const goToStatusWithResume = useCallback(() => {
    if (current !== null) {
      resumeQuestionRef.current = current;
      canResumeRef.current = true;
    }
    setShowStatus(true);
    setShowResult(null);
  }, [current]);

  // Status grid rendering
  function renderStatusGrid() {
    // Calculate original section order from allQuestions to maintain consistent ordering
    const originalSectionOrder = Array.from(new Set(allQuestions.map((q) => q.section)));

    return (
      <StatusGrid
        selectedArea={selectedArea}
        questions={questions}
        status={status}
        userAnswers={userAnswers}
        currentQuizType={currentQuizType}
        handleContinue={handleContinue}
        pendingQuestions={pendingQuestions}
        resetQuiz={resetQuiz}
        setShowAreaSelection={setShowAreaSelection}
        setShowStatus={setShowStatus}
        setShowResult={setShowResult}
        originalSectionOrder={originalSectionOrder}
      />
    );
  }

  // Question rendering
  function renderQuestion() {
    return (
      <QuestionDisplay
        selectedArea={selectedArea}
        current={current}
        questions={questions}
        status={status}
        currentQuizType={currentQuizType}
        displayOptions={displayOptions}
        handleAnswer={handleAnswer}
        goToStatusWithResume={goToStatusWithResume}
      />
    );
  }

  // Result rendering
  // If all questions are answered, show only the results grid
  // Use keyboard shortcuts custom hook
  useKeyboardShortcuts({
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
  });

  const allAnswered =
    questions.length > 0 && Object.values(status).filter((s) => s === 'pending').length === 0;
  const renderContent = () => {
    if (showAreaSelection) {
      return renderAreaSelection();
    }
    if (showSelectionMenu) {
      if (selectionMode === 'sections') {
        return renderSectionSelection();
      }
      if (selectionMode === 'questions') {
        return renderQuestionSelection();
      }
      return renderSelectionMenu();
    }
    if (showResult) {
      return (
        <ResultDisplay
          selectedArea={selectedArea}
          questions={questions}
          current={current}
          currentQuizType={currentQuizType}
          showResult={showResult}
          status={status}
          userAnswers={userAnswers}
          handleContinue={handleContinue}
          resetQuiz={resetQuiz}
        />
      );
    }
    if (allAnswered) {
      return (
        <ResultDisplay
          selectedArea={selectedArea}
          questions={questions}
          current={current}
          currentQuizType={currentQuizType}
          showResult={null}
          status={status}
          userAnswers={userAnswers}
          handleContinue={handleContinue}
          resetQuiz={resetQuiz}
        />
      );
    }
    if (showStatus) {
      return renderStatusGrid();
    }
    return renderQuestion();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 relative">
        {/* User name and logout button in top-right (only show if auth is enabled) */}
        {process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {getUserDisplayName(user)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <button
              onClick={() => {
                trackAuth('logout', user?.isGuest ? 'guest' : 'google');
                logout();
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        )}
        {renderContent()}
        <span
          className="absolute right-4 bottom-4 text-xs text-gray-500 hover:underline z-20"
          style={{ fontSize: '0.75rem' }}
        >
          v{packageJson.version}
        </span>
      </div>
    </div>
  );
}
