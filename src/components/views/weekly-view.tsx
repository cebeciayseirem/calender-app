'use client';

import { getMonday, isSameDay, formatTime } from '@/lib/date-utils';
import { calculateOverlapLayout } from '@/lib/overlap';
import { startOfDay } from 'date-fns';
import type { CalendarView, ExpandedEvent } from '@/types/event';

interface WeeklyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function WeeklyView({
  events,
  currentDate,
  onEventClick,
  onEmptyClick,
  onNavigate,
}: WeeklyViewProps) {
  const monday = getMonday(currentDate);
  const today = new Date();

  return (
    <div className="flex">
      {Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);
        const isToday = isSameDay(day, today);
        const dayEvents = events.filter((e) =>
          isSameDay(new Date(e.start), day)
        );
        const layout = calculateOverlapLayout(dayEvents);
        const dayStart = startOfDay(day).getTime();

        return (
          <div key={i} className="flex-1 relative border-r border-border last:border-r-0">
            <div
              className={`text-center p-2 font-bold cursor-pointer ${
                isToday ? 'bg-accent text-white' : 'bg-surface'
              }`}
              onClick={() => onNavigate('daily', day)}
            >
              {day.toLocaleDateString('default', {
                weekday: 'short',
                day: 'numeric',
              })}
            </div>

            <div
              className="relative h-[calc(100vh-130px)]"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const hour = Math.floor(
                    (e.nativeEvent.offsetY / e.currentTarget.clientHeight) * 24
                  );
                  onEmptyClick(day, hour);
                }
              }}
            >
              {layout.map(({ event, column, totalColumns }, idx) => {
                const eStart = new Date(event.start).getTime();
                const eEnd = new Date(event.end).getTime();
                const topPercent = ((eStart - dayStart) / MS_PER_DAY) * 100;
                const heightPercent = ((eEnd - eStart) / MS_PER_DAY) * 100;
                const widthPercent = 100 / totalColumns;
                const leftPercent = column * widthPercent;

                return (
                  <div
                    key={idx}
                    className="absolute rounded-md px-2 py-1 text-white text-[13px] overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: event.color || '#4A90D9',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <span className="font-semibold block">{event.title}</span>
                    <span className="text-[11px] opacity-80">
                      {formatTime(new Date(event.start))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
