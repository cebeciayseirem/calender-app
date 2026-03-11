'use client';

import { getDaysInMonth } from 'date-fns';
import { isSameDay, getWeekNumber } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

interface MonthlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function MonthlyView({
  events,
  currentDate,
  onEventClick,
  onNavigate,
}: MonthlyViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const totalCells = startOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  let dayCounter = 1;

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="flex bg-surface">
        <div className="w-10 text-center text-sm text-text-muted py-2">Wk</div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="flex-1 text-center py-2 font-semibold text-sm">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {Array.from({ length: rows }, (_, row) => {
        const cells = [];
        const firstDayOfRow = row === 0 ? 1 : dayCounter;
        const weekDate =
          firstDayOfRow <= daysInMonth
            ? new Date(year, month, firstDayOfRow)
            : null;
        const weekNum = weekDate ? getWeekNumber(weekDate) : null;

        for (let col = 0; col < 7; col++) {
          const cellIndex = row * 7 + col;
          if (cellIndex >= startOffset && dayCounter <= daysInMonth) {
            const day = dayCounter;
            const date = new Date(year, month, day);
            const isToday = isSameDay(date, today);
            const dayEvents = events.filter((e) =>
              isSameDay(new Date(e.start), date)
            );
            dayCounter++;

            cells.push(
              <div
                key={col}
                className={`flex-1 p-1 border-r border-border last:border-r-0 cursor-pointer min-h-[100px] ${
                  isToday ? 'bg-[#1e2a4a]' : ''
                }`}
                onClick={() => onNavigate('daily', date)}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-accent text-white rounded-full inline-block w-6 h-6 leading-6 text-center'
                      : ''
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-1">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className="text-[11px] px-1 rounded text-white mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ backgroundColor: e.color || '#4A90D9' }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick(e);
                        }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[11px] text-text-muted">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else {
            cells.push(
              <div key={col} className="flex-1 border-r border-border last:border-r-0 min-h-[100px]" />
            );
          }
        }

        return (
          <div key={row} className="flex min-h-[100px] border-b border-border">
            <div
              className="w-10 flex items-center justify-center text-xs text-text-muted cursor-pointer hover:bg-[#1e2a4a]"
              onClick={() => weekDate && onNavigate('weekly', weekDate)}
            >
              {weekNum != null ? `W${weekNum}` : ''}
            </div>
            {cells}
          </div>
        );
      })}
    </div>
  );
}
