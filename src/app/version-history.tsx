import Link from "next/link";

const VERSION_HISTORY = [
  // This will be replaced with real git log output
  { version: "1.3.1", date: "2026-01-14", description: "Añadido contenido de Filosofía del Lenguaje." },
  { version: "1.3.0", date: "2026-01-12", description: "Permite preguntas en múltiples áreas, y tipo de test de múltiple opción, además del verdadero-falso. Añadido tests de Introducción a Pensamiento Científico." },
  { version: "1.2.1", date: "2026-01-03", description: "Muestra la versión, el histórico de versiones, y las respuestas funcionan con el teclado." },
  { version: "1.2.0", date: "2026-01-02", description: "Tres opciones de menú para selccionar secciones y preguntas, y preguntas nuevas." },
  { version: "1.1.0", date: "2025-12-26", description: "Posibilidad de continuar quiz y mejorada presentación del estado." },
  { version: "1.0.1", date: "2025-12-25", description: "Resultados mostrados en rejilla al final del quiz." },
  { version: "1.0.0", date: "2025-12-22", description: "Primera versión." },
];

const AUTHOR = "Toni Tassani";
const REPO_URL = "https://github.com/atassani/uned-tests";

export default function VersionHistory() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Historial de versiones</h1>
        <ul className="mb-8">
          {VERSION_HISTORY.map((v) => (
            <li key={v.version} className="mb-2">
              <span className="font-mono font-bold">v{v.version}</span> <span className="text-xs text-gray-500">({v.date})</span>
              <div className="ml-4 text-sm">{v.description}</div>
            </li>
          ))}
        </ul>
        <div className="mb-6 text-sm">
          <span className="font-semibold">Autor:</span> {AUTHOR}<br />
          <span className="font-semibold">Repositorio:</span> <a href={REPO_URL} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{REPO_URL}</a>
        </div>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Volver al menú</Link>
      </div>
    </div>
  );
}
