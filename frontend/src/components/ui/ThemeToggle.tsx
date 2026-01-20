import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-military-100 dark:hover:bg-military-700 transition-colors"
      title={theme === 'light' ? 'Modo Nocturno' : 'Modo Diurno'}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-military-700 dark:text-gray-300" />
      ) : (
        <Sun className="h-5 w-5 text-tactical-400" />
      )}
    </button>
  );
}