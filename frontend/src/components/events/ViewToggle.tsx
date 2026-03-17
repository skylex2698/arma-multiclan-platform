import { List, CalendarDays } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-military-300 dark:border-gray-600">
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`inline-flex min-h-[38px] items-center gap-2 px-3 text-sm font-medium transition-colors ${
          view === 'list'
            ? 'bg-primary-600 text-white dark:bg-tactical-600'
            : 'bg-white text-military-700 hover:bg-military-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        title="Vista de lista"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </button>
      <button
        type="button"
        onClick={() => onViewChange('calendar')}
        className={`inline-flex min-h-[38px] items-center gap-2 border-l border-military-300 px-3 text-sm font-medium transition-colors dark:border-gray-600 ${
          view === 'calendar'
            ? 'bg-primary-600 text-white dark:bg-tactical-600'
            : 'bg-white text-military-700 hover:bg-military-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        title="Vista de calendario"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Calendario</span>
      </button>
    </div>
  );
}
