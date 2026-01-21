import Link from 'next/link';

const VERSION_HISTORY = [
  // This will be replaced with real git log output
  {
    version: '1.4.2',
    date: '2026-01-20',
    description: 'Detalle de las preguntas fallidas mostrado encima de la rejilla de estado.',
  },
  {
    version: '1.4.1',
    date: '2026-01-17',
    description:
      'Corregido error de preguntas duplicadas o faltantes en secciones de exámenes IPC, problemas de ordenación y atajos de teclado.',
  },
  {
    version: '1.4.0',
    date: '2026-01-16',
    description:
      'Si una pregunta ha aparecido en secciones o exámenes anteriores, en la respuesta aparece como una lista.',
  },
  {
    version: '1.3.2',
    date: '2026-01-15',
    description: 'Mejoras en la robustez del reinicio de localStorage en iOS Safari.',
  },
  {
    version: '1.3.1',
    date: '2026-01-14',
    description: 'Añadido contenido de Filosofía del Lenguaje.',
  },
  {
    version: '1.3.0',
    date: '2026-01-12',
    description:
      'Permite preguntas en múltiples áreas, y tipo de test de múltiple opción, además del verdadero-falso. Añadido tests de Introducción a Pensamiento Científico.',
  },
  {
    version: '1.2.1',
    date: '2026-01-03',
    description:
      'Muestra la versión, el histórico de versiones, y las respuestas funcionan con el teclado.',
  },
  {
    version: '1.2.0',
    date: '2026-01-02',
    description: 'Tres opciones de menú para selccionar secciones y preguntas, y preguntas nuevas.',
  },
  {
    version: '1.1.0',
    date: '2025-12-26',
    description: 'Posibilidad de continuar quiz y mejorada presentación del estado.',
  },
  {
    version: '1.0.1',
    date: '2025-12-25',
    description: 'Resultados mostrados en rejilla al final del quiz.',
  },
  { version: '1.0.0', date: '2025-12-22', description: 'Primera versión.' },
];

const AUTHOR = 'Toni Tassani';
const REPO_URL = 'https://github.com/atassani/uned-studio';

export default function VersionHistory() {
  // Only show the current version as plain text
  const current = VERSION_HISTORY[0];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Versión actual</h1>
        <div className="mb-8">
          <span className="font-mono font-bold">v{current.version}</span>{' '}
          <span className="text-xs text-gray-500">({current.date})</span>
          <div className="ml-4 text-sm">{current.description}</div>
        </div>
        <div className="mb-6 text-sm">
          <span className="font-semibold">Autor:</span> {AUTHOR}
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
          onClick={() => (window.location.href = '/')}
        >
          Volver al menú
        </button>
      </div>
    </div>
  );
}
