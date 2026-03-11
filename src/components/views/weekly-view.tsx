'use client';

import type { CalendarView, ExpandedEvent } from '@/types/event';

interface WeeklyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function WeeklyView(_props: WeeklyViewProps) {
  return <div className="text-text-muted p-4">Weekly view placeholder</div>;
}
