'use client';

import { useAuth } from '../hooks/useAuth';
import { trackAuth } from '../lib/analytics';
import packageJson from '../../../package.json';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login, loginAnonymously } = useAuth();

  // Bypass auth guard if auth is disabled (for testing)
  const isAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
  if (isAuthDisabled) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center relative">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🎓 UNED Studio
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Herramientas de estudio para asignaturas de la UNED
            </p>
          </div>
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-200 mb-4">
              Accede a tests de práctica, materiales de estudio y herramientas interactivas para tus
              asignaturas.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Inicia sesión para guardar tu progreso, o úsalo de forma anónima.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                trackAuth('login', 'google');
                login();
              }}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Iniciar sesión con Google
            </button>

            <button
              onClick={() => {
                trackAuth('login', 'anonymous');
                loginAnonymously();
              }}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
            >
              Continuar como Anónimo
            </button>
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Con Google:</strong> Progreso guardado entre dispositivos
            </p>
            <p>
              <strong>Anónimo:</strong> Progreso solo en este navegador
            </p>
          </div>

          {/* Version display in bottom right corner */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
            v{packageJson.version}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
