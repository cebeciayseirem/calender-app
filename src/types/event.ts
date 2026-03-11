export type CalendarView = 'yearly' | 'monthly' | 'weekly' | 'daily';
export type Category = 'Work' | 'Health' | 'Errand' | 'Social';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type MonthlyMode = 'dayOfMonth' | 'nthWeekday';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number;
  daysOfWeek?: number[];
  endDate?: string | null;
  endType: 'never' | 'on' | 'after';
  occurrenceCount?: number | null;
  monthlyMode?: MonthlyMode;
  nthWeekday?: { weekday: number; nth: number };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string | null;
  location?: string | null;
  color: string;
  category?: Category | null;
  recurrence?: RecurrenceConfig | null;
}

export interface ExpandedEvent extends CalendarEvent {
  originalId?: string;
  isOccurrence?: boolean;
}

export interface EventFormData {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  color: string;
  category?: string;
  recurrence?: RecurrenceConfig | null;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Work: '#74d5ff',
  Health: '#f16c76',
  Errand: '#b8d4e3',
  Social: '#d4a5ff',
};
