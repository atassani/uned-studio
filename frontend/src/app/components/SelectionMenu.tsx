import { AreaType } from '../types';
import { storage } from '../storage';

interface SelectionMenuProps {
  selectedArea: AreaType | null;
  currentQuizType: 'True False' | 'Multiple Choice' | null;
  shuffleQuestions: boolean;
  setShuffleQuestions: (shuffle: boolean) => void;
  shuffleAnswers: boolean;
  setShuffleAnswers: (shuffle: boolean) => void;
  setSelectionMode: (mode: null | 'all' | 'sections' | 'questions') => void;
  startQuizAll: () => void;
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
  setSelectionMode,
  startQuizAll,
  setShowAreaSelection,
  setShowSelectionMenu,
}: SelectionMenuProps) {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center" data-testid="selection-menu">
      {/* Show area name at top */}
      {selectedArea && (
        <div className="text-lg font-bold text-blue-600 mb-2">🎓 Área: {selectedArea.area}</div>
      )}
      <div className="text-2xl font-bold mb-4">¿Cómo quieres las preguntas?</div>
      {/* Question Order Selection: Available for both True/False and Multiple Choice */}
      <div className="flex flex-col items-center space-y-2 mb-2">
        <div className="text-lg font-semibold mb-2">Orden de preguntas:</div>
        <div className="flex items-center justify-center w-64">
          <span
            className={`text-sm font-medium mr-3 cursor-pointer ${shuffleQuestions ? 'text-blue-600' : 'text-gray-500'}`}
            onClick={() => setShuffleQuestions(true)}
            tabIndex={0}
            role="button"
            aria-label="Orden aleatorio"
          >
            Aleatorio
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!shuffleQuestions}
              onChange={(e) => setShuffleQuestions(!e.target.checked)}
              className="sr-only peer"
              aria-label="Alternar orden de preguntas"
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
            aria-label="Orden secuencial"
          >
            Secuencial
          </span>
        </div>
      </div>
      {/* Answer Order Selection: Only for Multiple Choice */}
      {currentQuizType === 'Multiple Choice' && (
        <div className="flex flex-col items-center space-y-2 mb-4">
          <div className="text-lg font-semibold mb-2">Orden de respuestas:</div>
          <div className="flex items-center justify-center w-64">
            <span
              className={`text-sm font-medium mr-3 cursor-pointer ${shuffleAnswers ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => setShuffleAnswers(true)}
              tabIndex={0}
              role="button"
              aria-label="Aleatorizar respuestas"
            >
              Aleatorio
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!shuffleAnswers}
                onChange={(e) => setShuffleAnswers(!e.target.checked)}
                className="sr-only peer"
                aria-label="Alternar orden de respuestas"
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
              aria-label="Respuestas secuenciales"
            >
              Secuencial
            </span>
          </div>
        </div>
      )}
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded text-lg w-64"
        onClick={() => {
          setSelectionMode('all');
          startQuizAll();
        }}
        aria-label="Todas las preguntas"
        data-testid="quiz-all-button"
      >
        Todas las preguntas
      </button>
      <button
        className="px-6 py-3 bg-green-600 text-white rounded text-lg w-64"
        onClick={() => {
          setSelectionMode('sections');
        }}
        aria-label="Seleccionar secciones"
        data-testid="quiz-sections-button"
      >
        Seleccionar secciones
      </button>
      <button
        className="px-6 py-3 bg-purple-600 text-white rounded text-lg w-64"
        onClick={() => {
          setSelectionMode('questions');
        }}
        aria-label="Seleccionar preguntas"
        data-testid="quiz-questions-button"
      >
        Seleccionar preguntas
      </button>
      <button
        className="px-6 py-3 bg-gray-500 text-white rounded text-lg w-64 mt-6"
        data-testid="change-area-button"
        onClick={() => {
          setShowAreaSelection(true);
          setShowSelectionMenu(false);
          storage.setCurrentArea(undefined);
        }}
        aria-label="Cambiar área"
      >
        Cambiar área
      </button>
    </div>
  );
}
