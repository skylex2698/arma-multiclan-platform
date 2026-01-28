import { useState } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import type { Event } from '../../../types';

interface EventCalendarProps {
  events: Event[];
  isLoading: boolean;
}

export function EventCalendar({ events, isLoading }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="card flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="card">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      <CalendarGrid currentDate={currentDate} events={events} />
    </div>
  );
}
