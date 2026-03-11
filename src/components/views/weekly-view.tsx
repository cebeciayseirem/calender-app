'use client';

import { useRef, useEffect } from 'react';
import { getMonday, isSameDay, formatTime } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

interface WeeklyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function WeeklyView({
  events,
  currentDate,
  onEventClick,
  onEmptyClick,
  onNavigate,
}: WeeklyViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const monday = getMonday(currentDate);
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    return day;
  });

  // Auto-scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      const row7am = scrollRef.current.querySelector('[data-hour="7"]');
      if (row7am) {
        row7am.scrollIntoView({ block: 'start' });
      }
    }
  }, [currentDate]);

  // Group events by "dayIndex-hour" key
  const eventMap = new Map<string, ExpandedEvent[]>();
  events.forEach((event) => {
    const eventDate = new Date(event.start);
    const dayIndex = days.findIndex((d) => isSameDay(d, eventDate));
    if (dayIndex === -1) return;
    const hour = eventDate.getHours();
    const key = `${dayIndex}-${hour}`;
    const list = eventMap.get(key) || [];
    list.push(event);
    eventMap.set(key, list);
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky day headers */}
      <div
        className="grid shrink-0 border-b border-border"
        style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}
      >
        <div /> {/* Empty corner cell */}
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={`relative text-center py-1.5 px-2 cursor-pointer transition-colors hover:bg-white/[0.03] border-r border-border last:border-r-0 ${
                isToday ? 'bg-white/[0.02]' : ''
              }`}
              onClick={() => onNavigate('daily', day)}
            >
              {isToday && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
              )}
              <span className="block text-[10px] uppercase tracking-wider text-text-muted font-medium">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span
                className={`block text-base font-semibold ${
                  isToday ? 'text-accent' : 'text-text'
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable hour grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}
        >
          {HOURS.map((hour) => (
            <HourRow
              key={hour}
              hour={hour}
              days={days}
              today={today}
              eventMap={eventMap}
              onEventClick={onEventClick}
              onEmptyClick={onEmptyClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
