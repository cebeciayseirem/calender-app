import type { Category } from './category';

export interface Habit {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  color: string;
  frequencyType: 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_per_week';
  frequencyDays: number[] | null;
  frequencyCount: number | null;
  category: Category | null;
  completedToday: boolean;
}

export interface HabitFormData {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  frequencyType?: string;
  frequencyDays?: number[];
  frequencyCount?: number;
  categoryId?: string;
}
