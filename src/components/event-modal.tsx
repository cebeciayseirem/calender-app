'use client';

import type { ExpandedEvent } from '@/types/event';

interface EventModalProps {
  event?: ExpandedEvent;
  defaultDate?: Date;
  defaultHour?: number;
  onClose: () => void;
}

export function EventModal(_props: EventModalProps) {
  return <div>Event modal placeholder</div>;
}
