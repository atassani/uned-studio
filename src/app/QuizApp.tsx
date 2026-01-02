"use client";
import { useEffect, useState, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";

interface QuestionType {
  index: number;
  section: string;
  number: number;
  question: string;
  answer: string;
  explanation: string;
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

  // Load questions and status from localStorage
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/questions.json`)
      .then((r) => r.json())
      .then((data) => {
        const questionsWithIndex = data.map((q: Omit<QuestionType, "index">, i: number) => ({ ...q, index: i }));
        setAllQuestions(questionsWithIndex);
        setShowSelectionMenu(true);
        setSelectionMode(null);
        setQuestions([]);
        setStatus({});
        setCurrent(null);
        setShowStatus(false);
        setShowResult(null);
      });
  }, []);

  // Persist status to localStorage whenever it changes
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem("quizStatus", JSON.stringify(status));
    }
  }, [status, questions.length]);

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
  function pendingQuestions() {
    // Return array of [index, question] for pending questions in filtered array
    return questions
      .map((q, i) => [i, q] as [number, QuestionType])
      .filter(([i, q]) => status[q.index] === "pending");
  }

  // Reset quiz state
  function resetQuiz() {
    // Show selection menu
    setShowSelectionMenu(true);
    setSelectionMode(null);
    setQuestions([]);
    setStatus({});
    setCurrent(null);
    setShowStatus(false);
    setShowResult(null);
    setSelectedSections(new Set());
    setSelectedQuestions(new Set());
  }

  // Start quiz with all questions
  function startQuizAll() {
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
  }

  // Start quiz with selected sections
  function startQuizSections() {
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
  }

  // Start quiz with selected questions
  function startQuizQuestions() {
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
  }
  // Selection menu UI
  function renderSelectionMenu() {
    return (
      <div className="space-y-8 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold mb-4">¿Cómo quieres las preguntas de  Lógica I?</div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("all"); startQuizAll(); }}>Todas las preguntas</button>
        <button className="px-6 py-3 bg-green-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("sections"); }}>Seleccionar secciones</button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded text-lg w-64" onClick={() => { setSelectionMode("questions"); }}>Seleccionar preguntas</button>
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
          >
            Empezar
          </button>
          <button className="px-6 py-3 bg-gray-400 text-white rounded text-lg" onClick={resetQuiz}>Cancelar</button>
        </div>
      </div>
    );
  }

  function handleAnswer(ans: string) {
    if (current == null) return;
    const q = questions[current];
    // Normalize answer: 'V' <-> 'Verdadero', 'F' <-> 'Falso'
    const expected = q.answer.trim().toUpperCase();
    const user = ans.trim().toUpperCase();
    const correct = (user === expected) ||
      (user === "V" && expected === "VERDADERO") ||
      (user === "F" && expected === "FALSO") ||
      (user === "VERDADERO" && expected === "V") ||
      (user === "FALSO" && expected === "F");
    const newStatus: Record<number, "correct" | "fail" | "pending"> = { ...status, [q.index]: correct ? "correct" : "fail" };
    setStatus(newStatus);
    localStorage.setItem("quizStatus", JSON.stringify(newStatus));
    setShowResult({ correct, explanation: q.explanation });
  }

  function nextQuestion() {
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
  }

  function handleContinue(action: string) {
    // If we're in the result view and user clicks Continuar, go to a random pending question
    if (action === "C" && showResult) {
      resumeQuestionRef.current = null;
      canResumeRef.current = false;
      nextQuestion();
      return;
    }

    if (action === "E") {
      // Only set resume if we're currently on a question view (not result)
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
      // Coming back from status grid: resume if allowed, otherwise random pending
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
  }

  // Helper to go to status and enable resume (only from question view)
  function goToStatusWithResume() {
    if (current !== null) {
      resumeQuestionRef.current = current;
      canResumeRef.current = true;
    }
    setShowStatus(true);
    setShowResult(null);
  }

  // Status grid rendering
  function renderStatusGrid() {
    const grouped = groupBySection(questions);
    const correctCount = Object.values(status).filter((s) => s === "correct").length;
    const failCount = Object.values(status).filter((s) => s === "fail").length;
    const pendingCount = questions.length - (correctCount + failCount);
    return (
      <div className="space-y-8">
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleContinue("C")} disabled={pendingQuestions().length === 0}>
            {pendingQuestions().length === 0 ? EMOJI_DONE + " ¡Completado!" : "Continuar"}
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={resetQuiz}>
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
        <div className="mt-2 text-sm">
          {EMOJI_PROGRESS} Total: {questions.length} | Correctas: {correctCount} | Falladas: {failCount} | Pendientes: {pendingCount}
        </div>
        <div className="font-bold text-lg">{EMOJI_SECTION} {q.section}</div>
        <div
          className="text-xl font-semibold rich-content"
          dangerouslySetInnerHTML={formatRichText(`${q.number}. ${q.question}`)}
        ></div>
        <div className="flex gap-4 mt-4">
          <button className="px-6 py-2 bg-green-600 text-white rounded text-lg" onClick={() => handleAnswer("V")}>V</button>
          <button className="px-6 py-2 bg-red-600 text-white rounded text-lg" onClick={() => handleAnswer("F")}>F</button>
          <button className="px-6 py-2 bg-gray-400 text-white rounded text-lg" onClick={goToStatusWithResume}>Ver estado</button>
        </div>
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
  const allAnswered = questions.length > 0 && Object.values(status).filter(s => s === "pending").length === 0;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        {showSelectionMenu
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
                    : renderQuestion()))}
      </div>
    </div>
  );
}
