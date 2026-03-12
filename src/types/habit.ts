import type { RecurrenceConfig } from '@/types/event';

export interface Habit {
  id: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  recurrence: RecurrenceConfig | null;
  completedToday: boolean;
}

export interface HabitFormData {
  title: string;
  subtitle?: string;
  category?: string;
  recurrence?: RecurrenceConfig | null;
}
