'use client';

import type { CalendarView, ExpandedEvent } from '@/types/event';

interface MonthlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function MonthlyView(_props: MonthlyViewProps) {
  return <div className="text-text-muted p-4">Monthly view placeholder</div>;
}
