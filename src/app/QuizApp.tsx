"use client";
import { useEffect, useState } from "react";

const EMOJI_SUCCESS = "✅";
const EMOJI_FAIL = "❌";
const EMOJI_ASK = "❓";
const EMOJI_SECTION = "📚";
const EMOJI_PROGRESS = "📊";
const EMOJI_DONE = "🎉";

const COLUMNS = 5;

function loadQuestions() {
  // This will be replaced by fetch in the main component
  return [];
}

function groupBySection(questions) {
  const map = new Map();
  for (const q of questions) {
    if (!map.has(q.section)) map.set(q.section, []);
    map.get(q.section).push(q);
  }
  return map;
}

export default function QuizApp() {
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState({}); // { [index]: 'correct'|'fail'|'pending' }
  const [current, setCurrent] = useState(null); // index of current question
  const [showStatus, setShowStatus] = useState(true);
  const [showResult, setShowResult] = useState(null); // { correct, explanation }

  // Load questions and status from localStorage
  useEffect(() => {
    fetch("/questions.json")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.map((q, i) => ({ ...q, index: i })));
        // Try to load status from localStorage
        const savedStatus = localStorage.getItem("quizStatus");
        if (savedStatus) {
          setStatus(JSON.parse(savedStatus));
        } else {
          setStatus(
            data.reduce((acc, q, i) => {
              acc[i] = "pending";
              return acc;
            }, {})
          );
        }
      });
  }, []);

  // Persist status to localStorage whenever it changes
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem("quizStatus", JSON.stringify(status));
    }
  }, [status, questions.length]);
  function pendingQuestions() {
    return questions.filter((q) => status[q.index] !== "correct");
  }

  // Reset quiz state
  function resetQuiz() {
    const newStatus = questions.reduce((acc, q, i) => {
      acc[i] = "pending";
      return acc;
    }, {});
    setStatus(newStatus);
    localStorage.setItem("quizStatus", JSON.stringify(newStatus));
    setCurrent(null);
    setShowStatus(true);
    setShowResult(null);
  }

  function handleAnswer(ans) {
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
    const newStatus = { ...status, [current]: correct ? "correct" : "fail" };
    setStatus(newStatus);
    localStorage.setItem("quizStatus", JSON.stringify(newStatus));
    setShowResult({ correct, explanation: q.explanation });
  }

  function nextQuestion() {
    const pending = pendingQuestions();
    if (pending.length === 0) {
      setShowStatus(true);
      setCurrent(null);
      setShowResult(null);
      return;
    }
    const q = pending[Math.floor(Math.random() * pending.length)];
    setCurrent(q.index);
    setShowStatus(false);
    setShowResult(null);
  }

  function handleContinue(action) {
    if (action === "E") {
      setShowStatus(true);
      setShowResult(null);
      setCurrent(null);
    } else {
      nextQuestion();
    }
  }

  // Status grid rendering
  function renderStatusGrid() {
    const grouped = groupBySection(questions);
    return (
      <div className="space-y-8">
        {[...grouped.entries()].map(([section, qs]) => (
          <div key={section}>
            <div className="font-bold text-lg mb-2">{EMOJI_SECTION} {section}</div>
            <div className="grid grid-cols-5 gap-2">
              {qs.map((q) => {
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
        <div className="mt-2 text-sm">
          {EMOJI_PROGRESS} Total: {questions.length} | Correctas: {Object.values(status).filter((s) => s === "correct").length} | Falladas: {Object.values(status).filter((s) => s === "fail").length} | Pendientes: {Object.values(status).filter((s) => s !== "correct").length}
        </div>
        <div className="flex gap-4 mt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={nextQuestion} disabled={pendingQuestions().length === 0}>
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
    return (
      <div className="space-y-6">
        <div className="font-bold text-lg">{EMOJI_SECTION} {q.section}</div>
        <div className="text-xl font-semibold">{q.number}. {q.question}</div>
        <div className="flex gap-4 mt-4">
          <button className="px-6 py-2 bg-green-600 text-white rounded text-lg" onClick={() => handleAnswer("V")}>V</button>
          <button className="px-6 py-2 bg-red-600 text-white rounded text-lg" onClick={() => handleAnswer("F")}>F</button>
        </div>
      </div>
    );
  }

  // Result rendering
  function renderResult() {
    if (!showResult) return null;
    return (
      <div className="space-y-4 mt-8">
        <div className="text-2xl">
          {showResult.correct ? EMOJI_SUCCESS + " ¡Correcto!" : EMOJI_FAIL + " Incorrecto."}
        </div>
        <div className="text-base font-semibold mt-2"><span className={showResult.correct ? "text-green-600" : "text-red-600"}>{questions[current]?.answer}</span></div>
        <div className="text-base">{showResult.explanation}</div>
        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleContinue("C")}>Continuar</button>
          <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => handleContinue("E")}>Ver estado</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        {showStatus ? renderStatusGrid() : renderQuestion()}
        {renderResult()}
      </div>
    </div>
  );
}
