'use client';

import { useRef, useEffect, useState } from 'react';
import { getMonday, isSameDay, formatTime } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT; // 1440px

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function getMinutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
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
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  // Auto-scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, [currentDate]);

  // Group events by day index
  const dayEvents = new Map<number, ExpandedEvent[]>();
  events.forEach((event) => {
    const eventDate = new Date(event.start);
    const dayIndex = days.findIndex((d) => isSameDay(d, eventDate));
    if (dayIndex === -1) return;
    const list = dayEvents.get(dayIndex) || [];
    list.push(event);
    dayEvents.set(dayIndex, list);
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
        <div className="flex" style={{ height: `${TOTAL_HEIGHT}px` }}>
          {/* Time gutter */}
          <div className="w-[60px] shrink-0 relative">
            {HOURS.map((hour) => (
              <div key={hour} className="absolute w-full" style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                {hour > 0 && (
                  <span className="absolute -top-[9px] right-3 text-[11px] text-text-muted">
                    {formatHourLabel(hour)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            const evts = dayEvents.get(dayIndex) || [];

            return (
              <div
                key={dayIndex}
                className={`flex-1 relative border-l border-l-white/[0.06] ${
                  isToday ? 'bg-accent/[0.04]' : ''
                }`}
                onClick={(e) => {
                  if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.hourBg) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top + scrollRef.current!.scrollTop;
                    const hour = Math.floor(y / HOUR_HEIGHT);
                    onEmptyClick(day, hour);
                  }
                }}
              >
                {/* Hour line backgrounds */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    data-hour-bg=""
                    className="absolute w-full border-t border-white/[0.06] cursor-pointer"
                    style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Events */}
                {evts.map((event, idx) => (
                  <EventCard
                    key={idx}
                    event={event}
                    onEventClick={onEventClick}
                  />
                ))}

                {/* Current time indicator */}
                {isToday && todayIndex >= 0 && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
                    style={{ top: `${nowTop}px` }}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
  const start = new Date(event.start);
  const end = new Date(event.end);
  const startMin = getMinutesFromMidnight(start);
  const endMin = getMinutesFromMidnight(end);
  const duration = Math.max(endMin - startMin, 30);

  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = (duration / 60) * HOUR_HEIGHT;
  const color = event.color || '#4A90D9';
  const isCompact = height < 40;

  return (
    <div
      className="absolute left-1 right-1.5 rounded-[6px] cursor-pointer transition-all duration-200 overflow-hidden z-10 group border border-white/[0.06] hover:border-white/[0.12] hover:translate-y-[-0.5px] hover:shadow-lg"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        background: `linear-gradient(135deg, ${color}22 0%, ${color}18 100%)`,
        boxShadow: `inset 3px 0 0 ${color}, 0 1px 3px rgba(0,0,0,0.2)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      {/* Subtle top shimmer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, transparent 60%)`,
        }}
      />
      <div className={`relative px-2 ${isCompact ? 'py-0.5 flex items-center gap-2' : 'py-1.5'}`}>
        <span
          className="font-semibold block text-[11.5px] leading-snug break-words tracking-[-0.01em]"
          style={{ color: `color-mix(in srgb, ${color} 60%, #ffffff)` }}
        >
          {event.title}
        </span>
        {!isCompact && (
          <span className="text-[10.5px] text-white/45 block mt-0.5 font-medium tracking-wide">
            {formatTime(start)} – {formatTime(end)}
          </span>
        )}
      </div>
    </div>
  );
}
