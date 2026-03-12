'use client';

import { useState } from 'react';
import { useHabits, useCreateHabit, useToggleHabit, useDeleteHabit } from '@/hooks/use-habits';

export function HabitTracker() {
  const { data: habits = [], isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabit();
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
          className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-text-muted hover:text-text flex items-center justify-center transition-colors text-lg"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="mb-4 flex flex-col gap-2">
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
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewSubtitle(''); }}
              className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-text-muted text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
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
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: habit.color + '22' }}
            >
              {habit.icon}
            </div>
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
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                habit.completedToday
                  ? 'bg-accent border-accent text-white'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              {habit.completedToday && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
