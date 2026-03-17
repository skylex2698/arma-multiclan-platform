import { APP_CONFIG } from '../../config/app.config';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-military-200 bg-gradient-to-r from-white via-military-50 to-white dark:border-gray-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col items-center justify-center gap-2 text-center md:flex-row md:gap-4">
            <span className="text-lg font-black tracking-[0.28em] text-military-900 dark:text-gray-100">
              {APP_CONFIG.shortName}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-military-400 md:inline-block dark:bg-gray-500" />
            <p className="text-sm text-military-700 dark:text-gray-300">
              {APP_CONFIG.name} © {APP_CONFIG.year}
            </p>
            <span className="hidden h-1 w-1 rounded-full bg-military-400 md:inline-block dark:bg-gray-500" />
            <p className="text-sm text-military-700 dark:text-gray-300">
              Desarrollado por{' '}
              <span className="font-semibold text-military-950 dark:text-white">
                B.E.A.R
              </span>
            </p>
        </div>
      </div>
    </footer>
  );
}
