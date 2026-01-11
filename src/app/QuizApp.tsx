
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
}

interface MultipleChoiceQuestion extends QuestionType {
  options: string[];
}

interface AreaType {
  area: string;
  file: string;
  type: "True False" | "Multiple Choice";
}

interface QuizStatusByArea {
  [areaFile: string]: Record<number, "correct" | "fail" | "pending">;
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

  // New area-related state
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaType | null>(null);
  const [showAreaSelection, setShowAreaSelection] = useState<boolean>(true);
  const [currentQuizType, setCurrentQuizType] = useState<"True False" | "Multiple Choice" | null>(null);

  // Load areas on component mount
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
        
        // Migrate old localStorage data for backward compatibility
        const oldQuizStatus = localStorage.getItem('quizStatus');
        if (oldQuizStatus) {
          // Migrate to Lógica I area (the default/original area)
          const logicaArea = areasData.find(area => area.area === 'Lógica I');
          if (logicaArea) {
            const areaKey = logicaArea.file.replace('.json', '');
            localStorage.setItem(`quizStatus_${areaKey}`, oldQuizStatus);
            localStorage.removeItem('quizStatus'); // Remove old data
          }
        }
      })
      .catch((err) => console.error('Failed to load areas:', err));
  }, []);

  // Load questions for selected area
  useEffect(() => {
    if (!selectedArea) return;
    
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/${selectedArea.file}`)
      .then((r) => r.json())
      .then((data) => {
        const questionsWithIndex = data.map((q: Omit<QuestionType, "index">, i: number) => ({ ...q, index: i }));
        setAllQuestions(questionsWithIndex);
        setCurrentQuizType(selectedArea.type);
        setShowAreaSelection(false);
        setShowSelectionMenu(true);
        setSelectionMode(null);
        setQuestions([]);
        setStatus({});
        setCurrent(null);
        setShowStatus(false);
        setShowResult(null);
        
        // Check for existing quiz progress for this area
        const areaKey = selectedArea.file.replace('.json', '');
        const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
        if (savedStatus) {
          const parsedStatus = JSON.parse(savedStatus);
          setStatus(parsedStatus);
          
          // Find questions that match the saved status
          const resumableQuestions = questionsWithIndex.filter((q: QuestionType) => parsedStatus[q.index] !== undefined);
          if (resumableQuestions.length > 0) {
            setQuestions(resumableQuestions);
            const pending = resumableQuestions.filter((q: QuestionType) => parsedStatus[q.index] === 'pending');
            if (pending.length > 0) {
              const randomPending = Math.floor(Math.random() * pending.length);
              resumeQuestionRef.current = resumableQuestions.findIndex((q: QuestionType) => q.index === pending[randomPending].index);
              canResumeRef.current = true;
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load questions:', err));
  }, [selectedArea]);

  // Persist status to localStorage whenever it changes
  useEffect(() => {
    if (questions.length > 0 && selectedArea) {
      const areaKey = selectedArea.file.replace('.json', '');
      localStorage.setItem(`quizStatus_${areaKey}`, JSON.stringify(status));
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
    setShowSelectionMenu(true);
    setSelectionMode(null);
    setQuestions([]);
    setStatus({});
    setCurrent(null);
    setShowStatus(false);
    setShowResult(null);
    setSelectedSections(new Set());
    setSelectedQuestions(new Set());
  }, []);

  // Start quiz with all questions
  const startQuizAll = useCallback(() => {
    setQuestions(allQuestions);
    const newStatus = allQuestions.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
      acc[q.index] = "pending";
      return acc;
    }, {});
    setStatus(newStatus);
    localStorage.setItem("quizStatus", JSON.stringify(newStatus));
    if (allQuestions.length > 0) {
      const first = Math.floor(Math.random() * allQuestions.length);
      setCurrent(first);
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [allQuestions]);

  // Start quiz with selected sections
  const startQuizSections = useCallback(() => {
    const filtered = allQuestions.filter(q => selectedSections.has(q.section));
    setQuestions(filtered);
    const newStatus = filtered.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
      acc[q.index] = "pending";
      return acc;
    }, {});
    setStatus(newStatus);
    localStorage.setItem("quizStatus", JSON.stringify(newStatus));
    if (filtered.length > 0) {
      const first = Math.floor(Math.random() * filtered.length);
      setCurrent(first);
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [allQuestions, selectedSections]);

  // Start quiz with selected questions
  const startQuizQuestions = useCallback(() => {
    const filtered = allQuestions.filter(q => selectedQuestions.has(q.index));
    setQuestions(filtered);
    const newStatus = filtered.reduce((acc: Record<number, "correct" | "fail" | "pending">, q: QuestionType) => {
      acc[q.index] = "pending";
      return acc;
    }, {});
    setStatus(newStatus);
    localStorage.setItem("quizStatus", JSON.stringify(newStatus));
    if (filtered.length > 0) {
      const first = Math.floor(Math.random() * filtered.length);
      setCurrent(first);
      setShowStatus(false);
    } else {
      setCurrent(null);
      setShowStatus(true);
    }
    setShowResult(null);
    setShowSelectionMenu(false);
    setSelectionMode(null);
  }, [allQuestions, selectedQuestions]);

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
      const areaKey = area.file.replace('.json', '');
      const savedStatus = localStorage.getItem(`quizStatus_${areaKey}`);
      if (savedStatus) {
        setStatus(JSON.parse(savedStatus));
      } else {
        setStatus({});
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-lg text-left"
              onClick={() => {
                setSelectedArea(area);
                setCurrentQuizType(area.type);
                setShowAreaSelection(false);
                setShowSelectionMenu(true);
                loadQuestionsForArea(area);
              }}
              aria-label={`Estudiar ${area.area}`}
            >
              <span className="font-mono mr-2">({index + 1})</span>
              {area.area}
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
        <div className="text-2xl font-bold mb-4">¿Cómo quieres las preguntas de {selectedArea?.area}?</div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("all"); startQuizAll(); }} aria-label="Todas las preguntas">Todas las preguntas</button>
        <button className="px-6 py-3 bg-green-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("sections"); }} aria-label="Seleccionar secciones">Seleccionar secciones</button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("questions"); }} aria-label="Seleccionar preguntas">Seleccionar preguntas</button>
        <button className="px-6 py-3 bg-gray-500 text-white rounded text-lg w-64" onClick={() => { setShowAreaSelection(true); setShowSelectionMenu(false); }} aria-label="Cambiar área">Cambiar área</button>
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
      // Multiple choice logic - answer should match the letter
      correct = user === expected;
    }
    
    const newStatus: Record<number, "correct" | "fail" | "pending"> = { ...status, [q.index]: correct ? "correct" : "fail" };
    setStatus(newStatus);
    const areaKey = selectedArea.file.replace('.json', '');
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
    const [nextIdx] = pending[Math.floor(Math.random() * pending.length)];
    setCurrent(nextIdx);
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
    return (
      <div className="space-y-8">
        {/* Show area name at top */}
        {selectedArea && (
          <div className="text-lg font-bold text-blue-600 mb-2">
            🎓 {selectedArea.area}
          </div>
        )}
        <div className="mt-2 text-sm">
          {EMOJI_PROGRESS} Total: {questions.length} | Correctas: {correctCount} | Falladas: {failCount} | Pendientes: {pendingCount}
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
        <div className="flex gap-4 mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleContinue("C")} disabled={pendingQuestions().length === 0} aria-label="Continuar">
            {pendingQuestions().length === 0 ? EMOJI_DONE + " ¡Completado!" : "Continuar"}
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={resetQuiz} aria-label="Volver a empezar">
            🔄 Volver a empezar
          </button>
        </div>
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
            🎓 {selectedArea.area}
          </div>
        )}
        <div className="mt-2 text-sm">
          {EMOJI_PROGRESS} Total: {questions.length} | Correctas: {correctCount} | Falladas: {failCount} | Pendientes: {pendingCount}
        </div>
        <div className="font-bold text-lg">{EMOJI_SECTION} {q.section}</div>
        <div
          className="text-xl font-semibold rich-content question-text"
          dangerouslySetInnerHTML={formatRichText(`${q.number}. ${q.question}`)}
        ></div>
        
        {/* Show options for Multiple Choice as text */}
        {currentQuizType === "Multiple Choice" && (q as any).options && (
          <div className="mt-4 space-y-2">
            {(q as any).options.map((option: string, index: number) => {
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
            <button className="px-6 py-2 bg-gray-400 text-white rounded text-lg" onClick={goToStatusWithResume}>Ver estado</button>
          </div>
        ) : (
          // Multiple Choice A/B/C buttons
          <div className="flex gap-4 mt-4">
            {(q as any).options?.map((option: string, index: number) => {
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
            <button className="px-6 py-2 bg-gray-400 text-white rounded text-lg" onClick={goToStatusWithResume}>Ver estado</button>
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
          <div className="mt-2 text-sm">
            {EMOJI_PROGRESS} Total: {questions.length} | Correctas: {correctCount} | Falladas: {failCount} | Pendientes: {pendingCount}
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
            dangerouslySetInnerHTML={formatRichText(current !== null ? questions[current]?.answer : "")}
          ></div>
          <div className="text-base rich-content" dangerouslySetInnerHTML={formatRichText(showResult.explanation)}></div>
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleContinue("C")}>Continuar</button>
            <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => handleContinue("E")}>Ver estado</button>
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
          <div className="text-2xl font-bold">{EMOJI_DONE} ¡Quiz completado!</div>
          <div className="mt-2 text-sm">
            {EMOJI_PROGRESS} Total: {questions.length} | Correctas: {correctCount} | Falladas: {failCount} | Pendientes: {pendingCount}
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
          <button className="px-4 py-2 bg-orange-500 text-white rounded mt-4" onClick={resetQuiz}>🔄 Volver a empezar</button>
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
  }, [showAreaSelection, areas, showSelectionMenu, selectionMode, selectedSections, selectedQuestions, showStatus, showResult, current, questions, currentQuizType, loadQuestionsForArea, handleAnswer, goToStatusWithResume, handleContinue, resetQuiz, startQuizAll, startQuizSections, startQuizQuestions, pendingQuestions]);

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
