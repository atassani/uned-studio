import { AreaType } from '../types';

interface AreaSelectionProps {
  areas: AreaType[];
  loadAreaAndQuestions: (area: AreaType) => Promise<void>;
}

export function AreaSelection({ areas, loadAreaAndQuestions }: AreaSelectionProps) {
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
            <span className="text-3xl font-extrabold tracking-widest leading-none">
              {area.shortName.toUpperCase()}
            </span>
            <span className="text-base font-normal text-blue-100 mt-1" style={{ lineHeight: 1 }}>
              {area.area}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
