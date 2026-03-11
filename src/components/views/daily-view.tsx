'use client';

import type { ExpandedEvent } from '@/types/event';

interface DailyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}

export function DailyView(_props: DailyViewProps) {
  return <div className="text-text-muted p-4">Daily view placeholder</div>;
}
