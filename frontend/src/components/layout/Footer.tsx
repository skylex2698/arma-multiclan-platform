import { APP_CONFIG } from '../../config/app.config';
import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-military-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo y nombre */}
          <div className="flex items-center gap-2">
            <Logo size="lg" withGlow />
            <span className="font-bold text-military-900 dark:text-gray-100">
              {APP_CONFIG.shortName}
            </span>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-military-600 dark:text-gray-400">
            <p>
              {APP_CONFIG.name} © {APP_CONFIG.year}
            </p>
            <p>
              Desarrollado por <span className="font-semibold text-primary-600 dark:text-tactical-400">{APP_CONFIG.author}</span>
            </p>
          </div>

          {/* Info */}
          <div className="text-center md:text-right text-xs text-military-500 dark:text-gray-500">
            <p>Para la comunidad española de</p>
            <p className="font-medium">{APP_CONFIG.games.join(' / ')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}