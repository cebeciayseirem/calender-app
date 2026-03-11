'use client';

import { getDaysInMonth } from 'date-fns';
import { isSameDay } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

interface YearlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function YearlyView({ events, currentDate, onNavigate }: YearlyViewProps) {
  const year = currentDate.getFullYear();
  const today = new Date();

  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, month) => (
        <MiniMonth
          key={month}
          year={year}
          month={month}
          today={today}
          events={events}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function MiniMonth({
  year,
  month,
  today,
  events,
  onNavigate,
}: {
  year: number;
  month: number;
  today: Date;
  events: ExpandedEvent[];
  onNavigate: (view: CalendarView, date: Date) => void;
}) {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = new Date(year, month).toLocaleString('default', {
    month: 'long',
  });

  return (
    <div className="p-2">
      <div
        className="font-bold text-center mb-2 cursor-pointer hover:text-accent"
        onClick={() => onNavigate('monthly', new Date(year, month, 1))}
      >
        {monthName}
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-text-muted">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center">
        {Array.from({ length: startOffset }, (_, i) => (
          <span key={`empty-${i}`} className="invisible text-xs p-1">
            0
          </span>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const isToday = isSameDay(date, today);
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.start), date)
          );
          const hasEvents = dayEvents.length > 0;

          return (
            <span
              key={day}
              className={`relative text-xs p-1 ${
                isToday
                  ? 'bg-accent text-white rounded-full font-bold'
                  : ''
              }`}
            >
              {day}
              {hasEvents && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: dayEvents[0].color || '#4A90D9',
                    opacity: 0.3 + Math.min(dayEvents.length / 5, 1) * 0.7,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
