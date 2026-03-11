import { format, getISOWeek, startOfWeek, isSameDay as dfnsSameDay } from 'date-fns';

export { dfnsSameDay as isSameDay };

export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

export function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function toLocalISO(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}
