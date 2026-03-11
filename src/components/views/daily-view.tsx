'use client';

import { isSameDay, formatTime } from '@/lib/date-utils';
import type { ExpandedEvent } from '@/types/event';

interface DailyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}

export function DailyView({
  events,
  currentDate,
  onEventClick,
  onEmptyClick,
}: DailyViewProps) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.start), currentDate))
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

  // Group overlapping events into rows
  const rows: ExpandedEvent[][] = [];
  for (const event of dayEvents) {
    const eStart = new Date(event.start).getTime();
    const eEnd = new Date(event.end).getTime();

    let placed = false;
    for (const row of rows) {
      const overlaps = row.some((other) => {
        const oStart = new Date(other.start).getTime();
        const oEnd = new Date(other.end).getTime();
        return eStart < oEnd && eEnd > oStart;
      });
      if (overlaps) {
        row.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([event]);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 min-h-[calc(100vh-80px)]">
      {rows.length === 0 && (
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onEmptyClick(currentDate, 9)}
        />
      )}
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex ${
            row.length > 1 ? 'flex-row gap-4 flex-wrap' : 'flex-col'
          }`}
        >
          {row.map((event) => (
            <div
              key={event.id + event.start}
              className="bg-[#1e2a4a] border-l-[5px] rounded p-4 min-w-[220px] max-w-[320px] cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ borderLeftColor: event.color || '#4A90D9' }}
              onClick={() => onEventClick(event)}
            >
              <span className="block text-xs text-text-muted mb-1.5">
                {formatTime(new Date(event.start))} -{' '}
                {formatTime(new Date(event.end))}
              </span>
              <span className="block text-base font-bold text-text mb-2">
                {event.title}
              </span>
              {event.location && (
                <span className="block text-xs text-text-muted mb-1">
                  {event.location}
                </span>
              )}
              {event.description && (
                <span className="block text-[13px] text-[#b0b8c4] whitespace-pre-wrap mb-2">
                  {event.description}
                </span>
              )}
              {event.category && (
                <span className="inline-block text-[11px] text-text-muted px-2 rounded-lg bg-white/[0.08]">
                  {event.category}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
