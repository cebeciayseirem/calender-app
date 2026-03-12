'use client';

import { useState } from 'react';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from '@/hooks/use-habits';
import { HabitEditForm } from './habit-edit-form';
import { CATEGORY_COLORS } from '@/types/event';
import type { Habit, HabitFormData } from '@/types/habit';

interface HabitManageModalProps {
  open: boolean;
  onClose: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
  x_per_week: 'X/week',
};

export function HabitManageModal({ open, onClose }: HabitManageModalProps) {
  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  if (!open) return null;

  const editingHabit = editingHabitId
    ? habits.find((h) => h.id === editingHabitId) || null
    : null;

  const handleEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setView('edit');
  };

  const handleAdd = () => {
    setEditingHabitId(null);
    setView('edit');
  };

  const handleSave = async (data: HabitFormData) => {
    if (editingHabitId) {
      await updateHabit.mutateAsync({ id: editingHabitId, data });
    } else {
      await createHabit.mutateAsync(data);
    }
    setView('list');
    setEditingHabitId(null);
  };

  const handleBack = () => {
    setView('list');
    setEditingHabitId(null);
  };

  const handleClose = () => {
    setView('list');
    setEditingHabitId(null);
    onClose();
  };

  const getFrequencyLabel = (habit: Habit) => {
    if (habit.frequencyType === 'x_per_week' && habit.frequencyCount) {
      return `${habit.frequencyCount}x/week`;
    }
    return FREQUENCY_LABELS[habit.frequencyType] || 'Daily';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-surface border border-border rounded-2xl w-[420px] max-h-[80vh] shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-border">
          {view === 'edit' && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors mr-2"
            >
              <svg className="w-4 h-4 text-text" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <h3 className="text-base font-bold text-text flex-1">
            {view === 'list' ? 'Manage Habits' : editingHabitId ? 'Edit Habit' : 'New Habit'}
          </h3>
          {view === 'list' && (
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
            >
              + Add Habit
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {view === 'list' ? (
            habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted mb-3">No habits yet</p>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
                >
                  + Add Your First Habit
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl px-3 py-3 cursor-pointer group transition-colors"
                    onClick={() => handleEdit(habit)}
                  >
                    <div
                      className="w-2 h-9 rounded-full shrink-0"
                      style={{ backgroundColor: habit.category ? CATEGORY_COLORS[habit.category] || '#4A90D9' : '#4A90D9' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{habit.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {habit.subtitle && (
                          <p className="text-xs text-text-muted truncate">{habit.subtitle}</p>
                        )}
                        <span className="text-[10px] text-text-muted/60">{getFrequencyLabel(habit)}</span>
                        {habit.category && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${CATEGORY_COLORS[habit.category]}30`, color: CATEGORY_COLORS[habit.category] }}
                          >
                            {habit.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHabit.mutate(habit.id);
                      }}
                      className="w-6 h-6 rounded-full text-text-muted/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs shrink-0"
                      title="Delete habit"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <HabitEditForm
              habit={editingHabit}
              onSave={handleSave}
              onCancel={handleBack}
              isSaving={createHabit.isPending || updateHabit.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
