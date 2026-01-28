import { Outlet } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-military-900 via-military-800 to-military-900 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" withGlow />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Arma Events Platform
          </h1>
          <p className="text-military-300 dark:text-gray-400 text-sm">
            Gestión de eventos multiclan
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-military-200 dark:border-gray-700">
          <Outlet />
        </div>

        <p className="text-center text-military-400 dark:text-gray-500 text-xs mt-4">
          &copy; 2026 Arma Events Platform. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}