'use client';

import { useRef, useEffect, useState } from 'react';
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

  // Current time indicator — updates every 5 minutes
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const todayIndex = days.findIndex((d) => isSameDay(d, today));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * 60; // 60px per hour

  // Auto-scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      const row7am = scrollRef.current.querySelector('[data-hour="7"]') as HTMLElement | null;
      if (row7am) {
        scrollRef.current.scrollTop = row7am.offsetTop;
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
    <div className="h-full flex flex-col">
      {/* Sticky day headers */}
      <div
        className="grid shrink-0 border-b border-white/[0.06] pb-2"
        style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
      >
        <div /> {/* Empty corner cell */}
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className="text-center py-2 cursor-pointer"
              onClick={() => onNavigate('daily', day)}
            >
              <span className="block text-[11px] uppercase tracking-wider text-text-muted font-medium">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span
                className={`inline-flex items-center justify-center text-[26px] font-normal mt-0.5 ${
                  isToday
                    ? 'w-10 h-10 rounded-full bg-accent text-white'
                    : 'text-text'
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
          className="grid relative"
          style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
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

          {/* Current time indicator */}
          {todayIndex >= 0 && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                top: `${nowTop}px`,
                left: `60px`,
                right: 0,
                paddingLeft: `calc((100% - 60px) / 7 * ${todayIndex})`,
              }}
            >
              <div className="relative flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            </div>
          )}
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
      {/* Time label — positioned so text aligns with the top border line */}
      <div
        data-hour={hour}
        className="relative h-[60px]"
      >
        {hour > 0 && (
          <span className="absolute -top-[9px] right-3 text-[11px] text-text-muted">
            {formatHourLabel(hour)}
          </span>
        )}
      </div>

      {/* 7 day cells for this hour */}
      {days.map((day, dayIndex) => (
        <HourCell
          key={dayIndex}
          day={day}
          hour={hour}
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
  isToday,
  events,
  onEventClick,
  onEmptyClick,
}: {
  day: Date;
  hour: number;
  isToday: boolean;
  events: ExpandedEvent[];
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}) {
  const first = events[0];
  const extra = events.length - 1;

  return (
    <div
      className={`h-[60px] border-t border-white/[0.06] border-l border-l-white/[0.06] p-0.5 cursor-pointer transition-colors hover:bg-white/[0.02] ${
        isToday ? 'bg-accent/[0.04]' : ''
      }`}
      onClick={() => onEmptyClick(day, hour)}
    >
      {first && (
        <EventCard event={first} onEventClick={onEventClick} />
      )}
      {extra > 0 && (
        <button
          className="mt-0.5 text-[11px] text-accent hover:text-accent-hover font-medium cursor-pointer bg-transparent border-none p-0 pl-1"
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
      className="rounded px-2 py-1.5 text-[12px] cursor-pointer hover:brightness-110 transition-all leading-tight"
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
