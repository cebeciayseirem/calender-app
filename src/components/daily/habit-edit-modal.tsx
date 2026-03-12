'use client';

import { HabitEditForm } from './habit-edit-form';
import type { Habit, HabitFormData } from '@/types/habit';

interface HabitEditModalProps {
  habit?: Habit | null;
  onSave: (data: HabitFormData) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function HabitEditModal({ habit, onSave, onClose, isSaving }: HabitEditModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[1001] animate-[modalFadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[440px] max-h-[85vh] overflow-y-auto shadow-[0_24px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04),0_0_80px_rgba(74,144,217,0.06)] animate-[modalSlideIn_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <HabitEditForm
            habit={habit}
            onSave={onSave}
            onCancel={onClose}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
