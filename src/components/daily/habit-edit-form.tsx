'use client';

import { useState, useRef, useEffect } from 'react';
import { CATEGORY_COLORS } from '@/types/event';
import type { RecurrenceConfig } from '@/types/event';
import type { Habit, HabitFormData } from '@/types/habit';
import { RecurrencePicker } from '../recurrence-picker';

interface HabitEditFormProps {
  habit?: Habit | null;
  onSave: (data: HabitFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function HabitEditForm({ habit, onSave, onCancel, isSaving }: HabitEditFormProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(habit?.title || '');
  const [category, setCategory] = useState(habit?.category || '');
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(
    habit?.recurrence ?? null
  );
  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      category: category || undefined,
      recurrence,
    });
  };

  const handleTagClick = (tag: string) => {
    setCategory(category === tag ? '' : tag);
  };

  const tagColor = category ? CATEGORY_COLORS[category] || '#4A90D9' : '#4A90D9';

  return (
    <div>
      {/* Color accent bar */}
      <div
        className="h-1.5 rounded-t-2xl transition-colors duration-300 -mx-6 -mt-6 mb-5"
        style={{ backgroundColor: tagColor }}
      />

      {/* Title */}
      <div className="flex items-stretch mb-1">
        <div className="w-[30px] shrink-0" />
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Habit title"
          className="flex-1 text-[1.35rem] font-semibold py-3 bg-transparent border-b-2 border-white/[0.08] rounded-none focus:outline-none focus:border-accent transition-colors duration-200 placeholder:text-[#556677]"
        />
      </div>

      {/* Category tags */}
      <div className="flex gap-2 mb-5 ml-[30px] mt-3">
        {Object.entries(CATEGORY_COLORS).map(([tag, tc]) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className={`flex-1 py-1.5 rounded-lg border-[1.5px] text-sm font-medium cursor-pointer transition-all duration-200 ${
              category === tag
                ? 'text-white shadow-[0_0_12px_rgba(74,144,217,0.25)] scale-[1.02]'
                : 'border-white/10 bg-transparent text-text-muted hover:border-white/25 hover:text-text hover:scale-[1.02]'
            }`}
            style={
              category === tag
                ? { backgroundColor: tc, borderColor: tc, boxShadow: `0 0 14px ${tc}33` }
                : undefined
            }
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Recurrence */}
      <RecurrencePicker
        recurrence={recurrence}
        startDateTime=""
        onChange={setRecurrence}
      />

      {/* Actions */}
      <div className="flex gap-3 mt-5 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="bg-transparent text-text-muted border-[1.5px] border-white/[0.08] px-5 py-2.5 rounded-xl cursor-pointer text-sm font-medium hover:border-white/20 hover:text-text transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || isSaving}
          className="bg-gradient-to-br from-accent to-accent-hover text-white border-none px-8 py-2.5 rounded-xl cursor-pointer text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(74,144,217,0.35)] active:translate-y-0 transition-all duration-200 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
