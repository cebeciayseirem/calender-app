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

function HourRow({
  hour,
  days,
  today,
  eventMap,
  onEventClick,
  onEmptyClick,
}: {
  hour: number;
  days: Date[];
  today: Date;
  eventMap: Map<string, ExpandedEvent[]>;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}) {
  return (
    <>
      {/* Time label cell */}
      <div
        data-hour={hour}
        className="pr-2 py-1 text-right text-[11px] text-text-muted font-medium border-b border-white/[0.04] flex items-start justify-end"
      >
        {formatHourLabel(hour)}
      </div>

      {/* 7 day cells for this hour */}
      {days.map((day, dayIndex) => (
        <HourCell
          key={dayIndex}
          day={day}
          hour={hour}
          dayIndex={dayIndex}
          isToday={isSameDay(day, today)}
          events={eventMap.get(`${dayIndex}-${hour}`) || []}
          onEventClick={onEventClick}
          onEmptyClick={onEmptyClick}
        />
      ))}
    </>
  );
}

function HourCell({
  day,
  hour,
  dayIndex,
  isToday,
  events,
  onEventClick,
  onEmptyClick,
}: {
  day: Date;
  hour: number;
  dayIndex: number;
  isToday: boolean;
  events: ExpandedEvent[];
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}) {
  const first = events[0];
  const extra = events.length - 1;

  return (
    <div
      className={`min-h-[60px] border-b border-white/[0.04] border-r border-r-border last:border-r-0 p-1 cursor-pointer transition-colors hover:bg-white/[0.03] ${
        isToday ? 'bg-white/[0.02]' : ''
      }`}
      onClick={() => onEmptyClick(day, hour)}
    >
      {first && (
        <EventCard event={first} onEventClick={onEventClick} />
      )}
      {extra > 0 && (
        <button
          className="mt-1 text-[11px] text-accent hover:text-accent-hover font-medium cursor-pointer bg-transparent border-none p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEventClick(events[1]);
          }}
        >
          +{extra} more
        </button>
      )}
    </div>
  );
}

function EventCard({
  event,
  onEventClick,
}: {
  event: ExpandedEvent;
  onEventClick: (event: ExpandedEvent) => void;
}) {
  return (
    <div
      className="rounded px-2.5 py-2 text-[13px] cursor-pointer shadow-[2px_2px_4px_rgba(0,0,0,0.3)] hover:shadow-[2px_3px_6px_rgba(0,0,0,0.45)] hover:brightness-110 transition-all"
      style={{ backgroundColor: event.color || '#4A90D9' }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      <span className="font-semibold block text-white leading-snug">
        {event.title}
      </span>
      <span className="text-[11px] text-white/75">
        {formatTime(new Date(event.start))} – {formatTime(new Date(event.end))}
      </span>
    </div>
  );
}
