'use client';

import { useState } from 'react';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from '@/hooks/use-habits';
import { HabitEditModal } from './habit-edit-modal';
import { CATEGORY_COLORS } from '@/types/event';
import type { Habit, HabitFormData } from '@/types/habit';

interface HabitManageModalProps {
  open: boolean;
  onClose: () => void;
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitManageModal({ open, onClose }: HabitManageModalProps) {
  const { data: habits = [] } = useHabits(undefined, open);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  if (!open) return null;

  const editingHabit = editingHabitId
    ? habits.find((h) => h.id === editingHabitId) || null
    : null;

  const handleEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingHabitId(null);
    setShowEditModal(true);
  };

  const handleSave = async (data: HabitFormData) => {
    if (editingHabitId) {
      await updateHabit.mutateAsync({ id: editingHabitId, data });
    } else {
      await createHabit.mutateAsync(data);
    }
    setShowEditModal(false);
    setEditingHabitId(null);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingHabitId(null);
  };

  const getRecurrenceLabel = (habit: Habit) => {
    if (!habit.recurrence) return 'Does not repeat';
    const rec = habit.recurrence;

    if (rec.type === 'weekly' && rec.daysOfWeek && rec.daysOfWeek.length > 0) {
      const days = rec.daysOfWeek
        .slice()
        .sort((a: number, b: number) => a - b)
        .map((d: number) => DAY_NAMES_SHORT[d])
        .join(', ');
      if (rec.interval === 1) return `Weekly · ${days}`;
      return `Every ${rec.interval} weeks · ${days}`;
    }

    if (rec.interval === 1) return RECURRENCE_LABELS[rec.type] || rec.type;
    return `Every ${rec.interval} ${rec.type.replace('ly', '')}s`;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[1000] animate-[modalFadeIn_0.2s_ease-out]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[440px] max-h-[85vh] shadow-[0_24px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04),0_0_80px_rgba(63,145,66,0.06)] animate-[modalSlideIn_0.25s_ease-out] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="text-base font-bold text-text flex-1">Manage Habits</h3>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
            >
              + Add Habit
            </button>
          </div>

          {/* Habit List */}
          <div className="p-6 pt-3 overflow-y-auto">
            {habits.length === 0 ? (
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
                        <span className="text-[10px] text-text-muted/60">{getRecurrenceLabel(habit)}</span>
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
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <HabitEditModal
          habit={editingHabit}
          onSave={handleSave}
          onClose={handleEditClose}
          isSaving={createHabit.isPending || updateHabit.isPending}
        />
      )}
    </>
  );
}
