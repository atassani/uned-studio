"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import packageJson from '../../package.json';

interface QuestionType {
  index: number;
  section: string;
  number: number;
  question: string;
  answer: string;
  explanation: string;
  options?: string[]; // For multiple choice questions
  appearsIn?: string[];
}


interface AreaType {
  area: string;
  file: string;
  type: "True False" | "Multiple Choice";
  shortName: string;
}

const EMOJI_SUCCESS = "✅";
const EMOJI_FAIL = "❌";
const EMOJI_ASK = "❓";
const EMOJI_SECTION = "📚";
const EMOJI_PROGRESS = "📊";
const EMOJI_DONE = "🎉";

function groupBySection(questions: QuestionType[]): Map<string, QuestionType[]> {
  const map = new Map<string, QuestionType[]>();
  for (const q of questions) {
    if (!map.has(q.section)) map.set(q.section, []);
    map.get(q.section)!.push(q);
  }
  return map;
}

function formatRichText(text?: string): { __html: string } {
  if (!text) return { __html: "" };
  const withLineBreaks = text.replace(/\n/g, "<br>");
  const sanitized = DOMPurify.sanitize(withLineBreaks, {
    ADD_TAGS: ["table", "thead", "tbody", "tfoot", "tr", "td", "th", "br"],
    ADD_ATTR: ["colspan", "rowspan", "style"],
  });
  return { __html: sanitized };
}

export default function QuizApp() {
  const canResumeRef = useRef(false);
  const [allQuestions, setAllQuestions] = useState<QuestionType[]>([]); // All loaded questions

  const [questions, setQuestions] = useState<QuestionType[]>([]); // Filtered questions for this session
  const [status, setStatus] = useState<Record<number, "correct" | "fail" | "pending">>({});
  // 'current' is the index in the filtered 'questions' array
  const [current, setCurrent] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<null | { correct: boolean; explanation: string }>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState<boolean>(true);
  const [selectionMode, setSelectionMode] = useState<null | "all" | "sections" | "questions">(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const questionScrollRef = useRef<HTMLDivElement | null>(null);
  const [questionScrollMeta, setQuestionScrollMeta] = useState<{ thumbTop: number; thumbHeight: number; show: boolean }>({ thumbTop: 0, thumbHeight: 0, show: false });
  const resumeQuestionRef = useRef<number | null>(null);
  const currentLoadingAreaRef = useRef<string | null>(null);

  // New area-related state
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaType | null>(null);
  const [showAreaSelection, setShowAreaSelection] = useState<boolean>(true);
  const [currentQuizType, setCurrentQuizType] = useState<"True False" | "Multiple Choice" | null>(null);

  // Question order control state
  const [questionOrder, setQuestionOrder] = useState<"random" | "sequential">("random");

  // Persist current question index per area (must be after selectedArea is defined)

  useEffect(() => {
    if (selectedArea && current !== null) {
      const areaKey = selectedArea.shortName;
      localStorage.setItem(`currentQuestion_${areaKey}`, String(current));
    }
  }, [selectedArea, current]);

  // Persist question order preference per area
  useEffect(() => {
    if (selectedArea) {
      const areaKey = selectedArea.shortName;
      localStorage.setItem(`questionOrder_${areaKey}`, questionOrder);
    }
  }, [selectedArea, questionOrder]);

  // Load areas on component mount and migrate any old global quizStatus to per-area keys
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/areas.json`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((areasData: AreaType[]) => {
        setAreas(areasData);
        // Migrate any old global quizStatus to per-area keys for all areas
        const oldQuizStatus = localStorage.getItem('quizStatus');
        if (oldQuizStatus) {
          // Try to migrate to all areas if not already present
          areasData.forEach(area => {
            const areaKey = area.shortName;
            if (!localStorage.getItem(`quizStatus_${areaKey}`)) {
              localStorage.setItem(`quizStatus_${areaKey}`, oldQuizStatus);
            }
          });
          localStorage.removeItem('quizStatus');
        }
        // Always show area selection after reload for test compatibility
        setShowAreaSelection(true);
        // Auto-restore last studied area (by shortName)
        const currentAreaShortName = localStorage.getItem('currentArea');
        if (currentAreaShortName) {
          const areaToRestore = areasData.find(area => area.shortName === currentAreaShortName);
          if (areaToRestore) {
            setSelectedArea(areaToRestore);
            setCurrentQuizType(areaToRestore.type);
            // Restore question order for this area
            const savedOrder = localStorage.getItem(`questionOrder_${areaToRestore.shortName}`) as "random" | "sequential" | null;
            if (savedOrder) {
              setQuestionOrder(savedOrder);
            } else {
              setQuestionOrder("random");
            }
            // Do not hide area selection here; let user/test choose area
            return;
          }
        }
      })
      .catch((err) => console.error('Failed to load areas:', err));
  }, []);

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
    localStorage.setItem('currentArea', area.shortName);

    // Always load questions and restore progress if available
    const areaKey = area.shortName;
    const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
    const savedCurrent = localStorage.getItem(`currentQuestion_${areaKey}`);
    const savedSelectedQuestions = localStorage.getItem(`selectedQuestions_${areaKey}`);
    const savedOrder = localStorage.getItem(`questionOrder_${areaKey}`) as "random" | "sequential" | null;
    
    let restoredOrder: "random" | "sequential" = "random";
    if (savedOrder === "sequential") restoredOrder = "sequential";
    setQuestionOrder(restoredOrder);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${area.file}`);
    if (currentLoadingAreaRef.current !== loadingId) return;
    if (response.ok) {
      const questionsData = await response.json();
      const questionsWithIndex = questionsData.map((q: QuestionType, idx: number) => ({ ...q, index: idx }));
      if (currentLoadingAreaRef.current !== loadingId) return;
      setAllQuestions(questionsWithIndex);
      let parsedStatus: Record<number, "correct" | "fail" | "pending"> = {};
      if (savedStatus) {
        parsedStatus = JSON.parse(savedStatus);
      } else {
        parsedStatus = questionsWithIndex.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
          acc[q.index] = "pending";
          return acc;
        }, {});
      }
      setStatus(parsedStatus);
      
      // Order questions according to restoredOrder
      let orderedQuestions = [...questionsWithIndex];
      if (restoredOrder === "sequential") {
        orderedQuestions.sort((a, b) => a.number - b.number);
      }
      
      // If we have saved selected questions, filter to only those questions
      if (savedSelectedQuestions) {
        const selectedIndices = JSON.parse(savedSelectedQuestions) as number[];
        orderedQuestions = orderedQuestions.filter(q => selectedIndices.includes(q.index));
      } else if (savedStatus) {
        // Legacy session without savedSelectedQuestions - infer from saved status indices
        const statusIndices = Object.keys(JSON.parse(savedStatus)).map(Number);
        orderedQuestions = orderedQuestions.filter(q => statusIndices.includes(q.index));
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
      const allAnswered = Object.values(parsedStatus).length > 0 && Object.values(parsedStatus).every(s => s !== "pending");
      if (allAnswered) {
        localStorage.removeItem(`currentQuestion_${areaKey}`);
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
          const nextPending = orderedQuestions.findIndex(q => parsedStatus[q.index] === "pending");
          if (nextPending !== -1) {
            idx = nextPending;
          }
        }
      } else {
        // If no saved current, try to resume at first pending
        const nextPending = orderedQuestions.findIndex(q => parsedStatus[q.index] === "pending");
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

  // Load questions for selected area on every area change
  useEffect(() => {
    if (!selectedArea) return;
    loadAreaAndQuestions(selectedArea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea]);

  // Persist status to localStorage whenever it changes
  useEffect(() => {
    if (questions.length > 0 && selectedArea) {
      const areaKey = selectedArea.shortName;
      // Only persist if the status corresponds to the current area's questions
      // Check by comparing status keys with questions length
      const statusKeys = Object.keys(status).map(Number);
      const expectedLength = questions.length;
      const statusMatchesCurrentArea = statusKeys.length === expectedLength;
      
      if (statusMatchesCurrentArea) {
        localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(status));
      }
    }
  }, [status, questions.length, selectedArea]);

  // Keep a visible scroll indicator for the question selection view
  useEffect(() => {
    if (selectionMode !== "questions") return;

    function updateScrollIndicator() {
      const el = questionScrollRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
      const show = maxScrollTop > 0;
      const trackHeight = clientHeight;
      const thumbHeight = show ? Math.max((clientHeight / scrollHeight) * trackHeight, 20) : trackHeight;
      const thumbTop = show && maxScrollTop > 0 ? (scrollTop / maxScrollTop) * (trackHeight - thumbHeight) : 0;
      setQuestionScrollMeta({ thumbTop, thumbHeight, show });
    }

    const el = questionScrollRef.current;
    updateScrollIndicator();
    if (!el) return;
    el.addEventListener("scroll", updateScrollIndicator);
    window.addEventListener("resize", updateScrollIndicator);
    return () => {
      el.removeEventListener("scroll", updateScrollIndicator);
      window.removeEventListener("resize", updateScrollIndicator);
    };
  }, [selectionMode, allQuestions.length]);

  // Define all functions used in the component
  const pendingQuestions = useCallback(() => {
    return questions
      .map((q, i) => [i, q] as [number, QuestionType])
      .filter(([, q]) => status[q.index] === "pending");
  }, [questions, status]);

  // Reset quiz state
  const resetQuiz = useCallback(() => {
    // Clear React state first
    setShowSelectionMenu(true);
    setSelectionMode(null);
    setQuestions([]);
    setStatus({});
    setCurrent(null);
    setShowStatus(false);
    setShowResult(null);
    setSelectedSections(new Set());
    setSelectedQuestions(new Set());

    // Robust localStorage clearing for iOS Safari compatibility
    const clearLocalStorageRobust = () => {
      if (!selectedArea) {
        // Clear generic currentArea if no selected area
        try {
          localStorage.removeItem('currentArea');
        } catch (error) {
          console.warn('Failed to remove currentArea:', error);
        }
        return;
      }
      
      const areaKey = selectedArea.shortName;
      const keysToRemove = [
        'currentArea',
        `quizStatus_${areaKey}`,
        `currentQuestion_${areaKey}`,
        `selectedQuestions_${areaKey}`,
        `questionOrder_${areaKey}`
      ];

      // Method 1: Standard removal with error handling
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key: ${key}`, error);
        }
      });

      // Method 2: Verification and retry for iOS Safari edge cases
      // Some iOS versions may not immediately remove items
      setTimeout(() => {
        keysToRemove.forEach(key => {
          try {
            if (localStorage.getItem(key) !== null) {
              localStorage.removeItem(key);
              console.log(`Retried removal of localStorage key: ${key}`);
            }
          } catch (error) {
            console.error(`Failed to remove localStorage key on retry: ${key}`, error);
          }
        });
      }, 50);

      // Method 3: iOS Safari fallback - try setting to empty string if removal fails
      setTimeout(() => {
        keysToRemove.forEach(key => {
          try {
            if (localStorage.getItem(key) !== null) {
              localStorage.setItem(key, '');
              console.log(`Fallback: set localStorage key to empty: ${key}`);
            }
          } catch (error) {
            console.error(`Fallback failed for localStorage key: ${key}`, error);
          }
        });
      }, 100);
    };

    // Execute localStorage clearing with iOS compatibility measures
    try {
      clearLocalStorageRobust();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      // Last resort for iOS Safari - try clearing all localStorage
      try {
        localStorage.clear();
        console.log('Performed full localStorage.clear() as fallback');
      } catch (clearError) {
        console.error('Even localStorage.clear() failed:', clearError);
      }
    }
  }, [selectedArea]);

  // Start quiz with all questions
  // Centralized ordering logic
  function getOrderedQuestions(questions: QuestionType[]): QuestionType[] {
    if (questionOrder === 'sequential') {
      return [...questions].sort((a, b) => a.number - b.number);
    }
    return [...questions];
  }

  const startQuizAll = useCallback(() => {
    if (!selectedArea) return;
    const areaKey = selectedArea.shortName;
    localStorage.removeItem(`quizStatus_${areaKey}`);
    localStorage.removeItem(`currentQuestion_${areaKey}`);
    localStorage.removeItem(`selectedQuestions_${areaKey}`); // Clear selected questions
    const orderedQuestions = getOrderedQuestions(allQuestions);
    setQuestions(orderedQuestions);
    const newStatus: Record<number, "correct" | "fail" | "pending"> = orderedQuestions.reduce((acc, q) => {
      acc[q.index] = "pending";
      return acc;
    }, {} as Record<number, "correct" | "fail" | "pending">);
    setStatus(newStatus);
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));
    // Store selected questions for session restoration
    localStorage.setItem(`selectedQuestions_${areaKey}`, JSON.stringify(orderedQuestions.map(q => q.index)));
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
  }, [allQuestions, selectedArea, questionOrder]);

  // Start quiz with selected sections
  const startQuizSections = useCallback(() => {
    if (!selectedArea) return;
    const areaKey = selectedArea.shortName;
    const filtered = allQuestions.filter(q => selectedSections.has(q.section));
    const orderedQuestions = getOrderedQuestions(filtered);
    setQuestions(orderedQuestions);
    const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
    let newStatus: Record<number, "correct" | "fail" | "pending">;
    if (savedStatus) {
      const parsedStatus = JSON.parse(savedStatus);
      newStatus = filtered.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
        acc[q.index] = parsedStatus[q.index] || "pending";
        return acc;
      }, {});
    } else {
      newStatus = filtered.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
        acc[q.index] = "pending";
        return acc;
      }, {});
    }
    setStatus(newStatus);
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));
    // Store selected questions for session restoration
    localStorage.setItem(`selectedQuestions_${areaKey}`, JSON.stringify(orderedQuestions.map(q => q.index)));
    let startIdx: number | null = null;
    const savedCurrent = localStorage.getItem(`currentQuestion_${areaKey}`);
    if (savedCurrent !== null) {
      const idx = Number(savedCurrent);
      if (!isNaN(idx) && idx >= 0 && idx < filtered.length) {
        startIdx = idx;
      }
    }
    if (filtered.length > 0) {
      if (startIdx !== null && startIdx >= 0 && startIdx < filtered.length) {
        setCurrent(startIdx);
      } else {
        setCurrent(0);
      }
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [allQuestions, selectedSections, selectedArea, questionOrder]);

  // Start quiz with selected questions
  const startQuizQuestions = useCallback(() => {
    if (!selectedArea) return;
    const areaKey = selectedArea.shortName;
    const filtered = allQuestions.filter(q => selectedQuestions.has(q.index));
    const orderedQuestions = getOrderedQuestions(filtered);
    setQuestions(orderedQuestions);
    const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
    let newStatus: Record<number, "correct" | "fail" | "pending">;
    if (savedStatus) {
      const parsedStatus = JSON.parse(savedStatus);
      newStatus = filtered.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
        acc[q.index] = parsedStatus[q.index] || "pending";
        return acc;
      }, {});
    } else {
      newStatus = filtered.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
        acc[q.index] = "pending";
        return acc;
      }, {});
    }
    setStatus(newStatus);
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));
    // Store selected questions for session restoration
    localStorage.setItem(`selectedQuestions_${areaKey}`, JSON.stringify(orderedQuestions.map(q => q.index)));
    let startIdx: number | null = null;
    const savedCurrent = localStorage.getItem(`currentQuestion_${areaKey}`);
    if (savedCurrent !== null) {
      const idx = Number(savedCurrent);
      if (!isNaN(idx) && idx >= 0 && idx < filtered.length) {
        startIdx = idx;
      }
    }
    if (filtered.length > 0) {
      if (startIdx !== null && startIdx >= 0 && startIdx < filtered.length) {
        setCurrent(startIdx);
      } else {
        setCurrent(0);
      }
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [allQuestions, selectedQuestions, selectedArea, questionOrder]);

  // Load questions for selected area
  const loadQuestionsForArea = useCallback(async (area: AreaType) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${area.file}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const questionsData = await response.json();
      
      // Add indices to questions for tracking
      const questionsWithIndex = questionsData.map((q: QuestionType, idx: number) => ({ ...q, index: idx }));
      setAllQuestions(questionsWithIndex);
      
      // Load saved status for this area
      const areaKey = area.shortName;
      const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
        if (savedStatus) {
          setStatus(JSON.parse(savedStatus));
        } else {
          // Initialize all questions as pending
          const pendingStatus = questionsWithIndex.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
            acc[q.index] = "pending";
            return acc;
          }, {});
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
    return (
      <div className="space-y-8 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold mb-4">¿Qué quieres estudiar?</div>
        <div className="flex flex-col gap-4 w-64">
          {areas.map((area, index) => (
            <button
              key={area.file}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-lg text-left flex flex-col items-start"
              onClick={async () => {
                await loadAreaAndQuestions(area);
              }}
              aria-label={`Estudiar ${area.area}`}
            >
              <span className="font-mono mr-2">({index + 1})</span>
              <span className="text-3xl font-extrabold tracking-widest leading-none">{area.shortName.toUpperCase()}</span>
              <span className="text-base font-normal text-blue-100 mt-1" style={{ lineHeight: 1 }}>{area.area}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Selection menu UI
  function renderSelectionMenu() {
    return (
      <div className="space-y-8 flex flex-col items-center justify-center">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 Área: {selectedArea.area}
          </div>
        )}
        <div className="text-2xl font-bold mb-4">¿Cómo quieres las preguntas?</div>
        
        {/* Question Order Selection */}
        <div className="flex flex-col items-center space-y-2 mb-4">
          <div className="text-lg font-semibold mb-2">Orden de preguntas:</div>
          <div className="flex items-center justify-center w-64">
            <span
              className={`text-sm font-medium mr-3 cursor-pointer ${questionOrder === 'random' ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => setQuestionOrder('random')}
              tabIndex={0}
              role="button"
              aria-label="Orden aleatorio"
            >
              Orden aleatorio
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={questionOrder === 'sequential'}
                onChange={e => setQuestionOrder(e.target.checked ? 'sequential' : 'random')}
                className="sr-only peer"
                aria-label="Alternar orden de preguntas"
              />
              <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 transition-all duration-300">
                <div className={`absolute left-0 top-0 h-8 w-8 rounded-full bg-blue-600 transition-transform duration-300 ${questionOrder === 'sequential' ? 'translate-x-6' : ''}`}></div>
              </div>
            </label>
            <span
              className={`text-sm font-medium ml-3 cursor-pointer ${questionOrder === 'sequential' ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => setQuestionOrder('sequential')}
              tabIndex={0}
              role="button"
              aria-label="Orden secuencial"
            >
              Orden secuencial
            </span>
          </div>
        </div>
        
        <button className="px-6 py-3 bg-blue-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("all"); startQuizAll(); }} aria-label="Todas las preguntas">Todas las preguntas</button>
        <button className="px-6 py-3 bg-green-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("sections"); }} aria-label="Seleccionar secciones">Seleccionar secciones</button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("questions"); }} aria-label="Seleccionar preguntas">Seleccionar preguntas</button>
        <button className="px-6 py-3 bg-gray-500 text-white rounded text-lg w-64 mt-6" onClick={() => { setShowAreaSelection(true); setShowSelectionMenu(false); localStorage.removeItem('currentArea'); }} aria-label="Cambiar área">Cambiar área</button>
      </div>
    );
  }



  // Section selection UI
  function renderSectionSelection() {
    // Get unique sections
    const sections = Array.from(new Set(allQuestions.map(q => q.section)));
    const allChecked = selectedSections.size === sections.length;
    const noneChecked = selectedSections.size === 0;
    const handleCheckAll = () => setSelectedSections(new Set(sections));
    const handleUncheckAll = () => setSelectedSections(new Set());
    return (
      <div className="space-y-8 flex flex-col items-center justify-center">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 Área: {selectedArea.area}
          </div>
        )}
        <div className="text-2xl font-bold mb-4">Selecciona las secciones</div>
        <div className="flex gap-4 mb-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            onClick={handleCheckAll}
            disabled={allChecked}
          >
            Marcar todas
          </button>
          <button
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            onClick={handleUncheckAll}
            disabled={noneChecked}
          >
            Desmarcar todas
          </button>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          {sections.map(section => (
            <label key={section} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSections.has(section)}
                onChange={e => {
                  const newSet = new Set(selectedSections);
                  if (e.target.checked) newSet.add(section);
                  else newSet.delete(section);
                  setSelectedSections(newSet);
                }}
              />
              <span>{section}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-green-600 text-white rounded text-lg"
            disabled={selectedSections.size === 0}
            onClick={startQuizSections}
            aria-label="Empezar"
          >
            Empezar
          </button>
          <button className="px-6 py-3 bg-gray-400 text-white rounded text-lg" onClick={resetQuiz}>Cancelar</button>
        </div>
      </div>
    );
  }

  // Question selection UI
  function renderQuestionSelection() {
    // Group questions by section
    const grouped = groupBySection(allQuestions);
    return (
      <div className="space-y-8 flex flex-col items-center justify-center">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 Área: {selectedArea.area}
          </div>
        )}
        <div className="text-2xl font-bold mb-4">Selecciona las preguntas</div>
        <div className="relative w-full">
          <div ref={questionScrollRef} className="max-h-96 overflow-y-auto w-full pr-4">
            {[...grouped.entries()].map(([section, qs]) => (
              <div key={section} className="mb-6">
                <div className="font-bold text-lg mb-2">{EMOJI_SECTION} {section}</div>
                <div className="grid grid-cols-5 gap-2">
                  {qs.map((q: QuestionType) => (
                    <label key={q.index} className="flex flex-row items-center justify-center cursor-pointer select-none gap-2">
                      <span className="text-2xl">{q.number}</span>
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(q.index)}
                        onChange={e => {
                          const newSet = new Set(selectedQuestions);
                          if (e.target.checked) newSet.add(q.index);
                          else newSet.delete(q.index);
                          setSelectedQuestions(newSet);
                        }}
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
                style={{ height: `${questionScrollMeta.thumbHeight}px`, transform: `translateY(${questionScrollMeta.thumbTop}px)` }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-purple-600 text-white rounded text-lg"
            disabled={selectedQuestions.size === 0}
            onClick={startQuizQuestions}
            aria-label="Empezar"
          >
            Empezar
          </button>
          <button className="px-6 py-3 bg-gray-400 text-white rounded text-lg" onClick={resetQuiz}>Cancelar</button>
        </div>
      </div>
    );
  }

  const handleAnswer = useCallback((ans: string) => {
    if (current == null || !selectedArea) return;
    const q = questions[current];
    const expected = q.answer.trim().toUpperCase();
    const user = ans.trim().toUpperCase();

    let correct = false;

    if (currentQuizType === "True False") {
      // True/False logic (existing)
      correct = (user === expected) ||
        (user === "V" && expected === "VERDADERO") ||
        (user === "F" && expected === "FALSO") ||
        (user === "VERDADERO" && expected === "V") ||
        (user === "FALSO" && expected === "F");
    } else if (currentQuizType === "Multiple Choice") {
      // Multiple choice logic - convert letter to option text and compare
      const userLetter = user.toLowerCase();
      const userIndex = userLetter.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, 'c' = 2, etc.
      const userAnswer = q.options?.[userIndex] || '';
      correct = userAnswer === q.answer;
    }

    const newStatus: Record<number, "correct" | "fail" | "pending"> = { ...status, [q.index]: correct ? "correct" : "fail" };
    setStatus(newStatus);
    const areaKey = selectedArea.shortName;
    localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(newStatus));
    setShowResult({ correct, explanation: q.explanation });
  }, [current, questions, status, selectedArea, currentQuizType]);

  const nextQuestion = useCallback(() => {
    const pending = pendingQuestions();
    if (pending.length === 0) {
      setShowStatus(false);
      setCurrent(null);
      setShowResult(null);
      return;
    }
    let nextIdx: number | null = null;
    if (questionOrder === 'sequential') {
      // Find the next higher-numbered pending question after current, or the lowest if at end
      const currentIdx = current ?? -1;
      // Get all pending questions sorted by .number
      const pendingSorted = pending
        .map(([idx, q]) => ({ idx, number: q.number }))
        .sort((a, b) => a.number - b.number);
      // Find the next higher-numbered pending
      let found = false;
      for (let i = 0; i < pendingSorted.length; ++i) {
        if (current !== null && questions[current] && pendingSorted[i].number > questions[current].number) {
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
  }, [pendingQuestions]);

  const handleContinue = useCallback((action: string) => {
    if (action === "C" && showResult) {
      resumeQuestionRef.current = null;
      canResumeRef.current = false;
      nextQuestion();
      return;
    }
        if (action === "E") {
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
  }, [showResult, current, nextQuestion]);

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
    const grouped = groupBySection(questions);
    const correctCount = Object.values(status).filter((s) => s === "correct").length;
    const failCount = Object.values(status).filter((s) => s === "fail").length;
    const pendingCount = questions.length - (correctCount + failCount);
    const actionButtons = (
      <div className="flex gap-4 mt-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleContinue("C")} disabled={pendingQuestions().length === 0} aria-label="Continuar">
          {pendingQuestions().length === 0 ? EMOJI_DONE + " ¡Completado!" : "Continuar"}
        </button>
        <button 
          className="px-4 py-2 bg-orange-500 text-white rounded" 
          onClick={resetQuiz}
          onTouchEnd={resetQuiz}
          aria-label="Volver a empezar"
        >
          🔄 Volver a empezar
        </button>
        <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={() => { 
          setShowAreaSelection(true); 
          setShowStatus(false);
          setShowResult(null);
        }} aria-label="Cambiar área">
          Cambiar área
        </button>
      </div>
    );
    return (
      <div className="space-y-8">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 Área: {selectedArea.area}
          </div>
        )}
        {actionButtons}
        <div className="mt-2 text-base flex items-center gap-2">
          {EMOJI_PROGRESS} {questions.length}
          <span className="ml-2">| {EMOJI_SUCCESS} {correctCount}</span>
          <span>| {EMOJI_FAIL} {failCount}</span>
          <span>| {EMOJI_ASK} {pendingCount}</span>
        </div>
        {[...grouped.entries()].map(([section, qs]) => (
          <div key={section}>
            <div className="font-bold text-lg mb-2">{EMOJI_SECTION} {section}</div>
            <div className="grid grid-cols-5 gap-2">
              {qs.map((q: QuestionType) => {
                let emoji = EMOJI_ASK;
                if (status[q.index] === "correct") emoji = EMOJI_SUCCESS;
                else if (status[q.index] === "fail") emoji = EMOJI_FAIL;
                return (
                  <div key={q.index} className="flex flex-col items-center">
                    <span className="text-2xl">{q.number}{emoji}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-4">
          <span>{EMOJI_SUCCESS} = Correcta </span>
          <span>{EMOJI_FAIL} = Fallada </span>
          <span>{EMOJI_ASK} = Pendiente</span>
        </div>
        {actionButtons}
      </div>
    );
  }

  // Question rendering
  function renderQuestion() {
    if (current == null) return null;
    const q = questions[current];
    const correctCount = Object.values(status).filter((s) => s === "correct").length;
    const failCount = Object.values(status).filter((s) => s === "fail").length;
    const pendingCount = questions.length - (correctCount + failCount);
    return (
      <div className="space-y-6">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 Área: {selectedArea.area}
          </div>
        )}
        <div className="font-bold text-lg">{EMOJI_SECTION} {q.section}</div>
        <div className="mt-2 text-sm">
          <div className="mt-2 text-base flex items-center gap-2">
            {EMOJI_PROGRESS} {questions.length}
            <span className="ml-2">| {EMOJI_SUCCESS} {correctCount}</span>
            <span>| {EMOJI_FAIL} {failCount}</span>
            <span>| {EMOJI_ASK} {pendingCount}</span>
          </div>
        </div>
        <div
          className="text-xl font-semibold rich-content question-text"
          dangerouslySetInnerHTML={formatRichText(`${q.number}. ${q.question}`)}
        ></div>
        {/* appearsIn bullet list if present */}
        {Array.isArray(q.appearsIn) && q.appearsIn.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Aparece en:</div>
            <ul className="list-disc list-inside ml-4">
              {q.appearsIn.map((ref: string, idx: number) => (
                <li key={idx}>{ref}</li>
              ))}
            </ul>
          </div>
        )}
        {currentQuizType === "Multiple Choice" && Array.isArray(q.options) && (
          <div className="mt-4 space-y-2">
            {q.options.map((option: string, index: number) => {
              const letter = String.fromCharCode(65 + index); // 'A', 'B', 'C', etc.
              return (
                <div key={index} className="text-base">
                  <span className="font-bold">{letter})</span> {option}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Render buttons based on quiz type */}
        {currentQuizType === "True False" ? (
          <div className="flex gap-4 mt-4">
            <button className="px-6 py-2 bg-green-600 text-white rounded text-lg" onClick={() => handleAnswer("V")}>V</button>
            <button className="px-6 py-2 bg-red-600 text-white rounded text-lg" onClick={() => handleAnswer("F")}>F</button>
            <button className="px-6 py-2 bg-gray-400 text-white rounded text-lg" onClick={goToStatusWithResume}>Options</button>
          </div>
        ) : (
          // Multiple Choice A/B/C buttons
          <div className="flex gap-4 mt-4">
            {Array.isArray(q.options) && q.options.map((option: string, index: number) => {
              const letter = String.fromCharCode(65 + index); // 'A', 'B', 'C', etc.
              return (
                <button
                  key={index}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-lg"
                  onClick={() => handleAnswer(letter.toLowerCase())}
                >
                  {letter}
                </button>
              );
            })}
            <button className="px-6 py-2 bg-gray-400 text-white rounded text-lg" onClick={goToStatusWithResume}>Options</button>
          </div>
        )}
      </div>
    );
  }

  // Result rendering
  function renderResult() {
    // Show results as a grid when all questions are answered
    const allAnswered = questions.length > 0 && Object.values(status).filter(s => s === "pending").length === 0;

    if (showResult) {
      const correctCount = Object.values(status).filter((s) => s === "correct").length;
      const failCount = Object.values(status).filter((s) => s === "fail").length;
      const pendingCount = questions.length - (correctCount + failCount);
      const q = current !== null ? questions[current] : null;
      return (
        <div className="space-y-4 mt-8">
          {/* Show area name at top */}
          {selectedArea && (
            <div className="text-lg font-bold text-blue-600 mb-2">
              🎓 Área: {selectedArea.area}
            </div>
          )}
          <div className="mt-2 text-base flex items-center gap-2">
            {EMOJI_PROGRESS} {questions.length}
            <span className="ml-2">| {EMOJI_SUCCESS} {correctCount}</span>
            <span>| {EMOJI_FAIL} {failCount}</span>
            <span>| {EMOJI_ASK} {pendingCount}</span>
          </div>
          {q && (
            <>
              <div className="font-bold text-lg">{EMOJI_SECTION} {q.section}</div>
              <div
                className="text-xl font-semibold rich-content"
                dangerouslySetInnerHTML={formatRichText(`${q.number}. ${q.question}`)}
              ></div>
            </>
          )}
          <div className="text-2xl">
            {showResult.correct ? EMOJI_SUCCESS + " ¡Correcto!" : EMOJI_FAIL + " Incorrecto."}
          </div>
          <div
            className={`text-base font-semibold mt-2 rich-content ${showResult.correct ? "text-green-600" : "text-red-600"}`}
            dangerouslySetInnerHTML={formatRichText(
              current !== null && questions[current] 
                ? (currentQuizType === "Multiple Choice" 
                    ? (() => {
                        const q = questions[current];
                        const answerIndex = q.options?.findIndex(option => option === q.answer) ?? -1;
                        const answerLetter = answerIndex >= 0 ? String.fromCharCode(65 + answerIndex) : '';
                        return `Respuesta esperada ${answerLetter}) ${q.answer}`;
                      })()
                    : questions[current].answer
                  )
                : ""
            )}
          ></div>
          <div className="text-base rich-content" dangerouslySetInnerHTML={formatRichText(showResult.explanation)}></div>
          {/* appearsIn bullet list if present */}
          {current !== null && questions[current] && Array.isArray(questions[current].appearsIn) && questions[current].appearsIn.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold">Aparece en:</div>
              <ul className="list-disc list-inside ml-4">
                {questions[current].appearsIn.map((ref: string, idx: number) => (
                  <li key={idx}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleContinue("C")}>Continuar</button>
            <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => handleContinue("E")}>Options</button>
          </div>
        </div>
      );
    }

    if (allAnswered) {
      const grouped = groupBySection(questions);
      const correctCount = Object.values(status).filter((s) => s === "correct").length;
      const failCount = Object.values(status).filter((s) => s === "fail").length;
      const pendingCount = questions.length - (correctCount + failCount);
      return (
        <div className="space-y-8 mt-8">
          {/* Show area name at top */}
          {selectedArea && (
            <div className="text-lg font-bold text-blue-600 mb-2">
              🎓 Área: {selectedArea.area}
            </div>
          )}
          <div className="text-2xl font-bold">{EMOJI_DONE} ¡Quiz completado!</div>
          <div className="mt-2 text-base flex items-center gap-2">
            {EMOJI_PROGRESS} {questions.length}
            <span className="ml-2">{EMOJI_SUCCESS} {correctCount}</span>
            <span>{EMOJI_FAIL} {failCount}</span>
            <span>{EMOJI_ASK} {pendingCount}</span>
          </div>
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={resetQuiz}>🔄 Volver a empezar</button>
          </div>
          {[...grouped.entries()].map(([section, qs]) => (
            <div key={section}>
              <div className="font-bold text-lg mb-2">{EMOJI_SECTION} {section}</div>
              <div className="grid grid-cols-5 gap-2">
                {qs.map((q: QuestionType) => {
                  let emoji = EMOJI_ASK;
                  if (status[q.index] === "correct") emoji = EMOJI_SUCCESS;
                  else if (status[q.index] === "fail") emoji = EMOJI_FAIL;
                  return (
                    <div key={q.index} className="flex flex-col items-center">
                      <span className="text-2xl">{q.number}{emoji}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-4">
            <span>{EMOJI_SUCCESS} = Correcta </span>
            <span>{EMOJI_FAIL} = Fallada </span>
            <span>{EMOJI_ASK} = Pendiente</span>
          </div>
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={resetQuiz}>🔄 Volver a empezar</button>
          </div>
        </div>
      );
    }

    return null;
  }

  // If all questions are answered, show only the results grid
  // Keyboard shortcuts handler (after all logic)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      const isTextInput = active && (
        active.tagName === 'TEXTAREA' ||
        (active.tagName === 'INPUT' && !['checkbox', 'radio'].includes((active as HTMLInputElement).type)) ||
        active.getAttribute('contenteditable') === 'true'
      );
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
          localStorage.setItem('currentArea', area.shortName);
        }
      }
      if (showSelectionMenu && !selectionMode) {
        if (e.key.toLowerCase() === 't') { setSelectionMode('all'); startQuizAll(); }
        if (e.key.toLowerCase() === 's') { setSelectionMode('sections'); }
        if (e.key.toLowerCase() === 'p') { setSelectionMode('questions'); }
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
        if (currentQuizType === "True False") {
          if (e.key.toLowerCase() === 'v') handleAnswer('V');
          if (e.key.toLowerCase() === 'f') handleAnswer('F');
        } else if (currentQuizType === "Multiple Choice") {
          const letter = e.key.toLowerCase();
          if (['a', 'b', 'c', 'd', 'e', 'f'].includes(letter)) {
            handleAnswer(letter);
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
  }, [showAreaSelection, areas, showSelectionMenu, selectionMode, selectedSections, selectedQuestions, showStatus, showResult, current, questions, currentQuizType, questionOrder, loadQuestionsForArea, handleAnswer, goToStatusWithResume, handleContinue, resetQuiz, startQuizAll, startQuizSections, startQuizQuestions, pendingQuestions]);

  const allAnswered = questions.length > 0 && Object.values(status).filter(s => s === "pending").length === 0;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 relative">
        {showAreaSelection
          ? renderAreaSelection()
          : (showSelectionMenu
              ? (selectionMode === "sections"
                  ? renderSectionSelection()
                  : selectionMode === "questions"
                    ? renderQuestionSelection()
                    : renderSelectionMenu())
              : (showResult
                  ? renderResult()
                  : (allAnswered
                      ? renderResult()
                      : showStatus
                        ? renderStatusGrid()
                        : renderQuestion())))}
        {/* Version link only on main menu (no selection in progress) */}
        {showAreaSelection ? <VersionLink /> : (showSelectionMenu && !selectionMode ? <VersionLink /> : null)}
      </div>
    </div>
  );
}

// Version link component for bottom left of main frame
function VersionLink() {
  return (
    <Link
      href="/version-history"
      className="absolute right-4 bottom-4 text-xs text-gray-500 hover:underline z-20"
      style={{ fontSize: "0.75rem" }}
      aria-label="Historial de versiones"
    >
      v{packageJson.version}
    </Link>
  );
}
