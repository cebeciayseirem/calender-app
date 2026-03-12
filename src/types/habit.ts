export interface Habit {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  color: string;
  completedToday: boolean;
}

export interface HabitFormData {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
}
