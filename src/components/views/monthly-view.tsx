'use client';

import { getDaysInMonth, format } from 'date-fns';
import { isSameDay } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

interface CellData {
  date: Date;
  isCurrentMonth: boolean;
}

function buildGrid(year: number, month: number): CellData[][] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: CellData[] = [];

  // Previous month fill
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysInMonth = getDaysInMonth(new Date(prevYear, prevMonth));
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({
      date: new Date(prevYear, prevMonth, prevDaysInMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Next month fill
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(nextYear, nextMonth, d),
        isCurrentMonth: false,
      });
    }
  }

  // Split into rows of 7
  const rows: CellData[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function formatDayLabel(date: Date): string {
  if (date.getDate() === 1) {
    return `1 ${format(date, 'MMM')}`;
  }
  return String(date.getDate());
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
  const rows = buildGrid(year, month);

  return (
    <div className="flex flex-col h-full">
      {/* Header row */}
      <div
        className="grid shrink-0 border-b border-white/[0.06] pb-2"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center py-2 text-[11px] uppercase tracking-wider text-text-muted font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map((week, rowIdx) => (
          <div
            key={rowIdx}
            className="grid min-h-0 border-b border-white/[0.06]"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
          >
            {week.map((cell, colIdx) => {
              const isToday = isSameDay(cell.date, today);
              const dayEvents = events.filter((e) =>
                isSameDay(new Date(e.start), cell.date)
              );
              const maxVisible = rows.length > 5 ? 2 : 3;

              return (
                <div
                  key={colIdx}
                  className={`border-r border-white/[0.06] last:border-r-0 px-1.5 py-1 cursor-pointer overflow-hidden ${
                    isToday ? 'bg-[#1e2a4a]' : ''
                  }`}
                  onClick={() => onNavigate('daily', cell.date)}
                >
                  <span
                    className={`text-[12px] font-medium inline-block ${
                      !cell.isCurrentMonth
                        ? 'text-text-muted/40'
                        : isToday
                          ? 'bg-accent text-white rounded-full w-5 h-5 leading-5 text-center text-[11px]'
                          : 'text-text'
                    }`}
                  >
                    {formatDayLabel(cell.date)}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="mt-0.5 space-y-px">
                      {dayEvents.slice(0, maxVisible).map((e, i) => {
                        const color = e.color || '#4A90D9';
                        return (
                          <div
                            key={i}
                            className="text-[10px] leading-tight px-1 py-px rounded overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer transition-all duration-150 hover:brightness-125"
                            style={{
                              background: `${color}25`,
                              borderLeft: `2px solid ${color}`,
                              color: `color-mix(in srgb, ${color} 60%, #ffffff)`,
                            }}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onEventClick(e);
                            }}
                          >
                            {e.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > maxVisible && (
                        <div className="text-[9px] text-text-muted pl-1">
                          +{dayEvents.length - maxVisible} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
