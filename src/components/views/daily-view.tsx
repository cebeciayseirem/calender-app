'use client';

import { isSameDay } from '@/lib/date-utils';
import { DailySidebar } from '@/components/daily/daily-sidebar';
import { DailyTimeline } from '@/components/daily/daily-timeline';
import type { ExpandedEvent } from '@/types/event';

interface DailyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}

export function DailyView({ events, currentDate, onEventClick, onEmptyClick }: DailyViewProps) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.start), currentDate))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="flex gap-4 h-full max-md:flex-col max-md:overflow-y-auto">
      <DailySidebar />
      <DailyTimeline
        events={dayEvents}
        currentDate={currentDate}
        onEventClick={onEventClick}
        onAddEvent={onEmptyClick}
      />
    </div>
  );
}
