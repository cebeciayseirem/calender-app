export interface Habit {
  id: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  frequencyType: 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_per_week';
  frequencyDays: number[] | null;
  frequencyCount: number | null;
  completedToday: boolean;
}

export interface HabitFormData {
  title: string;
  subtitle?: string;
  category?: string;
  frequencyType?: string;
  frequencyDays?: number[];
  frequencyCount?: number;
}
