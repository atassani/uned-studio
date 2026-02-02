import { QuestionType, AreaType } from '../types';

interface SectionSelectionProps {
  selectedArea: AreaType | null;
  allQuestions: QuestionType[];
  selectedSections: Set<string>;
  setSelectedSections: (sections: Set<string>) => void;
  startQuizSections: () => void;
  resetQuiz: () => void;
}

export function SectionSelection({
  selectedArea,
  allQuestions,
  selectedSections,
  setSelectedSections,
  startQuizSections,
  resetQuiz,
}: SectionSelectionProps) {
  // Get unique sections
  const sections = Array.from(new Set(allQuestions.map((q) => q.section)));
  const allChecked = selectedSections.size === sections.length;
  const noneChecked = selectedSections.size === 0;
  const handleCheckAll = () => setSelectedSections(new Set(sections));
  const handleUncheckAll = () => setSelectedSections(new Set());

  return (
    <div className="space-y-8 flex flex-col items-center justify-center">
      {/* Show area name at top */}
      {selectedArea && (
        <div className="text-lg font-bold text-blue-600 mb-2">🎓 Área: {selectedArea.area}</div>
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
        {sections.map((section) => (
          <label key={section} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedSections.has(section)}
              onChange={(e) => {
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
        <button className="px-6 py-3 bg-gray-400 text-white rounded text-lg" onClick={resetQuiz}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
