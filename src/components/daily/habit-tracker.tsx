'use client';

import { useState } from 'react';
import { useHabits, useCreateHabit, useToggleHabit, useDeleteHabit } from '@/hooks/use-habits';

interface HabitTrackerProps {
  date: string; // 'yyyy-MM-dd'
}

export function HabitTracker({ date }: HabitTrackerProps) {
  const { data: habits = [], isLoading } = useHabits(date);
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabit(date);
  const deleteHabit = useDeleteHabit();

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createHabit.mutate({ title: newTitle.trim(), subtitle: newSubtitle.trim() || undefined });
    setNewTitle('');
    setNewSubtitle('');
    setAdding(false);
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text">Habit Tracker</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="w-8 h-8 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent hover:text-accent-hover flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(74,144,217,0.3)] hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setAdding(false); setNewTitle(''); setNewSubtitle(''); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-surface border border-border rounded-2xl p-5 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-text mb-3">New Habit</h4>
            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="Habit name..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
                className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Subtitle (optional)..."
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
              />
              <div className="flex gap-2 justify-end mt-1">
                <button
                  onClick={() => { setAdding(false); setNewTitle(''); setNewSubtitle(''); }}
                  className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-text-muted text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}

      <div className="flex flex-col gap-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-3 py-3 group"
          >
            <div
              className="w-2 h-9 rounded-full shrink-0"
              style={{ backgroundColor: habit.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{habit.title}</p>
              {habit.subtitle && (
                <p className="text-xs text-text-muted truncate">{habit.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => deleteHabit.mutate(habit.id)}
              className="w-6 h-6 rounded-full text-text-muted/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs"
              title="Delete habit"
            >
              ✕
            </button>
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
    </div>
  );
}
