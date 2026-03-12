'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { ExpandedEvent } from '@/types/event';

interface DailyTimelineProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onAddEvent: (date?: Date, hour?: number) => void;
}

export function DailyTimeline({ events, currentDate, onEventClick, onAddEvent }: DailyTimelineProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const isToday =
    now.getFullYear() === currentDate.getFullYear() &&
    now.getMonth() === currentDate.getMonth() &&
    now.getDate() === currentDate.getDate();

  const remaining = events.filter((e) => new Date(e.end) > now).length;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex-1 bg-surface rounded-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-xl font-bold text-text">
            {format(currentDate, "EEEE, d MMMM")}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {isToday ? `${remaining} tasks remaining` : `${events.length} events`}
          </p>
        </div>
        <button
          onClick={() => onAddEvent(currentDate)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span> Add Event
        </button>
      </div>

      {/* Timeline */}
      <div className="px-6 pb-6">
        {events.length === 0 ? (
          <div
            className="flex items-center justify-center h-48 text-text-muted text-sm cursor-pointer rounded-xl hover:bg-white/[0.03] transition-colors"
            onClick={() => onAddEvent(currentDate, 9)}
          >
            No events today. Click to add one.
          </div>
        ) : (
          <div className="relative">
            {events.map((event, idx) => {
              const startTime = new Date(event.start);
              const endTime = new Date(event.end);
              const eventStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
              let eventEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();
              // If end resolves to midnight but start is on the same day, treat as end-of-day
              if (eventEndMinutes <= eventStartMinutes) eventEndMinutes = 24 * 60;
              const isDayInPast = currentDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const isCurrent = isToday && nowMinutes >= eventStartMinutes && nowMinutes < eventEndMinutes;
              const isPast = isDayInPast || (isToday && nowMinutes >= eventEndMinutes);

              return (
                <div key={event.id + event.start} className="flex gap-4">
                  {/* Time label */}
                  <div className="w-[72px] shrink-0 pt-4 text-right">
                    <span className={`text-xs font-medium ${isCurrent ? 'text-accent' : 'text-text-muted'}`}>
                      {format(startTime, 'hh:mm a')}
                    </span>
                  </div>

                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center w-4 shrink-0">
                    <div
                      className={`w-3 h-3 rounded-full mt-5 shrink-0 ${
                        isCurrent ? 'bg-accent shadow-[0_0_8px_rgba(74,144,217,0.5)]' : isPast ? 'bg-text-muted/30' : 'bg-border'
                      }`}
                    />
                    {idx < events.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border min-h-[16px]" />
                    )}
                  </div>

                  {/* Event card */}
                  <div
                    onClick={() => onEventClick(event)}
                    className={`flex-1 border-l-4 rounded-lg px-4 py-3 mb-3 cursor-pointer transition-all hover:bg-white/[0.06] ${
                      isPast ? 'opacity-50' : ''
                    } ${isCurrent ? 'bg-white/[0.06]' : 'bg-white/[0.03]'}`}
                    style={{ borderLeftColor: event.color || '#4A90D9' }}
                  >
                    <p className={`text-sm font-semibold ${isPast ? 'text-text-muted' : 'text-text'}`}>
                      {event.title}
                    </p>
                    {(event.description || event.location) && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {event.location || event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Current time line */}
            {isToday && events.length > 0 && (
              <CurrentTimeLine now={now} events={events} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentTimeLine({ now, events }: { now: Date; events: ExpandedEvent[] }) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const firstStart = new Date(events[0].start);
  const lastEnd = new Date(events[events.length - 1].end);
  const firstMinutes = firstStart.getHours() * 60 + firstStart.getMinutes();
  const lastMinutes = lastEnd.getHours() * 60 + lastEnd.getMinutes();

  if (nowMinutes < firstMinutes || nowMinutes > lastMinutes) return null;

  const pct = ((nowMinutes - firstMinutes) / (lastMinutes - firstMinutes)) * 100;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top: `${pct}%` }}
    >
      <div className="w-full h-0.5 bg-accent/60" />
    </div>
  );
}
