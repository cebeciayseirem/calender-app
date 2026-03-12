'use client';

import { useState } from 'react';
import { useHabits, useToggleHabit } from '@/hooks/use-habits';
import { HabitManageModal } from './habit-manage-modal';
import { CategoryBadge } from './category-badge';

interface HabitTrackerProps {
  date: string;
}

export function HabitTracker({ date }: HabitTrackerProps) {
  const { data: habits = [], isLoading } = useHabits(date);
  const toggleHabit = useToggleHabit(date);
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text">Habit Tracker</h3>
        <button
          onClick={() => setManageOpen(true)}
          className="w-8 h-8 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent hover:text-accent-hover flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(74,144,217,0.3)] hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}

      <div className="flex flex-col gap-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-3 py-3"
          >
            <div
              className="w-2 h-9 rounded-full shrink-0"
              style={{ backgroundColor: habit.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{habit.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {habit.subtitle && (
                  <p className="text-xs text-text-muted truncate">{habit.subtitle}</p>
                )}
                {habit.category && <CategoryBadge name={habit.category.name} />}
              </div>
            </div>
            <button
              onClick={() => toggleHabit.mutate(habit.id)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                habit.completedToday
                  ? 'bg-accent text-white shadow-[0_0_10px_rgba(74,144,217,0.4)] scale-105'
                  : 'bg-white/[0.08] hover:bg-white/[0.15] text-transparent hover:text-text-muted/30'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <HabitManageModal open={manageOpen} onClose={() => setManageOpen(false)} />
    </div>
  );
}
