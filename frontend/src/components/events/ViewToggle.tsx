import { List, CalendarDays } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-military-300 dark:border-gray-600 overflow-hidden">
      <button
        onClick={() => onViewChange('list')}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors
          ${view === 'list'
            ? 'bg-primary-600 text-white dark:bg-primary-700'
            : 'bg-white text-military-600 hover:bg-military-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }
        `}
        title="Vista de lista"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </button>
      <button
        onClick={() => onViewChange('calendar')}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-l border-military-300 dark:border-gray-600
          ${view === 'calendar'
            ? 'bg-primary-600 text-white dark:bg-primary-700'
            : 'bg-white text-military-600 hover:bg-military-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }
        `}
        title="Vista de calendario"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Calendario</span>
      </button>
    </div>
  );
}
