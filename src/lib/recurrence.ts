import type { CalendarEvent, CalendarView, ExpandedEvent } from '@/types/event';
import { toLocalISO } from './date-utils';
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';

export function expandRecurrences(
  events: CalendarEvent[],
  currentDate: Date,
  view: CalendarView
): ExpandedEvent[] {
  const { start, end } = getViewRange(currentDate, view);
  const expanded: ExpandedEvent[] = [];

  for (const event of events) {
    if (!event.recurrence) {
      expanded.push(event);
      continue;
    }
    expanded.push(...generateOccurrences(event, start, end));
  }
  return expanded;
}

function getViewRange(
  date: Date,
  view: CalendarView
): { start: Date; end: Date } {
  switch (view) {
    case 'yearly':
      return { start: startOfYear(date), end: endOfYear(date) };
    case 'monthly':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'weekly':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'daily':
      return { start: startOfDay(date), end: endOfDay(date) };
  }
}

function generateOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedEvent[] {
  const occurrences: ExpandedEvent[] = [];
  const rec = event.recurrence!;
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const duration = eventEnd.getTime() - eventStart.getTime();
  const recEnd = rec.endDate ? new Date(rec.endDate) : rangeEnd;
  const limit = new Date(Math.min(rangeEnd.getTime(), recEnd.getTime()));

  let current = new Date(eventStart);

  while (current <= limit) {
    if (
      current >= rangeStart ||
      new Date(current.getTime() + duration) >= rangeStart
    ) {
      if (
        rec.type === 'weekly' &&
        rec.daysOfWeek &&
        rec.daysOfWeek.length > 0
      ) {
        if (rec.daysOfWeek.includes(current.getDay())) {
          occurrences.push(makeOccurrence(event, current, duration));
        }
      } else {
        occurrences.push(makeOccurrence(event, current, duration));
      }
    }
    current = advanceDate(current, rec);
  }
  return occurrences;
}

function advanceDate(
  date: Date,
  rec: NonNullable<CalendarEvent['recurrence']>
): Date {
  const d = new Date(date);
  switch (rec.type) {
    case 'daily':
      d.setDate(d.getDate() + rec.interval);
      break;
    case 'weekly':
      if (rec.daysOfWeek && rec.daysOfWeek.length > 0) {
        d.setDate(d.getDate() + 1);
      } else {
        d.setDate(d.getDate() + 7 * rec.interval);
      }
      break;
    case 'monthly':
      if (rec.monthlyMode === 'nthWeekday' && rec.nthWeekday) {
        d.setMonth(d.getMonth() + rec.interval, 1);
        const targetWeekday = rec.nthWeekday.weekday;
        const nth = rec.nthWeekday.nth;
        const firstOccurrence = new Date(d);
        while (firstOccurrence.getDay() !== targetWeekday) {
          firstOccurrence.setDate(firstOccurrence.getDate() + 1);
        }
        firstOccurrence.setDate(firstOccurrence.getDate() + nth * 7);
        d.setDate(firstOccurrence.getDate());
        d.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
      } else {
        d.setMonth(d.getMonth() + rec.interval);
      }
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + rec.interval);
      break;
  }
  return d;
}

function makeOccurrence(
  event: CalendarEvent,
  start: Date,
  duration: number
): ExpandedEvent {
  return {
    ...event,
    id: event.id,
    originalId: event.id,
    start: toLocalISO(start),
    end: toLocalISO(new Date(start.getTime() + duration)),
    isOccurrence: true,
  };
}
