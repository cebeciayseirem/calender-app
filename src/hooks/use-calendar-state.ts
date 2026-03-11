import { useQueryState, parseAsStringLiteral, parseAsString } from 'nuqs';
import { useMemo } from 'react';
import type { CalendarView } from '@/types/event';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  format,
  addMonths,
  addWeeks,
  addDays,
  addYears,
} from 'date-fns';

const views = ['yearly', 'monthly', 'weekly', 'daily'] as const;

export function useCalendarState() {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(views).withDefault('monthly')
  );

  const [dateStr, setDateStr] = useQueryState(
    'date',
    parseAsString.withDefault(format(new Date(), 'yyyy-MM-dd'))
  );

  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  );

  const currentDate = useMemo(() => {
    const parsed = new Date(dateStr + 'T00:00:00');
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dateStr]);

  const setDate = (date: Date) => {
    setDateStr(format(date, 'yyyy-MM-dd'));
  };

  const { start, end } = useMemo(() => {
    switch (view) {
      case 'yearly':
        return {
          start: format(startOfYear(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfYear(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      case 'monthly':
        return {
          start: format(startOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      case 'weekly':
        return {
          start: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      case 'daily':
        return {
          start: format(startOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
        };
    }
  }, [view, currentDate]);

  const stepDate = (direction: 1 | -1) => {
    let next: Date;
    switch (view) {
      case 'yearly':
        next = addYears(currentDate, direction);
        break;
      case 'monthly':
        next = addMonths(currentDate, direction);
        break;
      case 'weekly':
        next = addWeeks(currentDate, direction);
        break;
      case 'daily':
        next = addDays(currentDate, direction);
        break;
    }
    setDate(next);
  };

  const goToToday = () => setDate(new Date());

  return {
    view: view as CalendarView,
    setView: (v: CalendarView) => setView(v),
    currentDate,
    setDate,
    start,
    end,
    stepDate,
    goToToday,
    searchQuery: searchQuery ?? '',
    setSearchQuery,
  };
}
