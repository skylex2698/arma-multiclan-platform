import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const monthYear = format(currentDate, "MMMM 'de' yyyy", { locale: es });
  // Capitalize first letter
  const formattedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-military-900 dark:text-gray-100">
        {formattedMonthYear}
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-military-600 dark:text-gray-300 hover:bg-military-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Hoy
        </button>
        <div className="flex items-center border border-military-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={onPreviousMonth}
            className="p-2 hover:bg-military-100 dark:hover:bg-gray-700 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5 text-military-600 dark:text-gray-400" />
          </button>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-military-100 dark:hover:bg-gray-700 transition-colors border-l border-military-300 dark:border-gray-600"
            title="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5 text-military-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
