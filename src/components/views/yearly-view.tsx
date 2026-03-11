'use client';

import type { CalendarView, ExpandedEvent } from '@/types/event';

interface YearlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function YearlyView(_props: YearlyViewProps) {
  return <div className="text-text-muted p-4">Yearly view placeholder</div>;
}
