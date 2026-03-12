'use client';

import { useState } from 'react';
import { CATEGORY_COLORS } from '@/types/event';
import type { Habit, HabitFormData } from '@/types/habit';

const FREQUENCY_PRESETS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
  { value: 'x_per_week', label: 'X per week' },
] as const;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface HabitEditFormProps {
  habit?: Habit | null;
  onSave: (data: HabitFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function HabitEditForm({ habit, onSave, onCancel, isSaving }: HabitEditFormProps) {
  const [title, setTitle] = useState(habit?.title || '');
  const [subtitle, setSubtitle] = useState(habit?.subtitle || '');
  const [category, setCategory] = useState(habit?.category || '');
  const [frequencyType, setFrequencyType] = useState(habit?.frequencyType || 'daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>(habit?.frequencyDays || []);
  const [frequencyCount, setFrequencyCount] = useState(habit?.frequencyCount || 3);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      category: category || undefined,
      frequencyType,
      frequencyDays: frequencyType === 'custom' ? frequencyDays : undefined,
      frequencyCount: frequencyType === 'x_per_week' ? frequencyCount : undefined,
    });
  };

  const toggleDay = (day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleTagClick = (tag: string) => {
    setCategory(category === tag ? '' : tag);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Habit name..."
          autoFocus
          className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Subtitle</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Optional description..."
          className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
        />
      </div>

      {/* Tag */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Tag</label>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(CATEGORY_COLORS).map(([tag, tagColor]) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all border ${
                category === tag
                  ? 'text-white border-transparent'
                  : 'bg-white/[0.06] text-text-muted border-transparent hover:bg-white/[0.12]'
              }`}
              style={category === tag ? { backgroundColor: tagColor } : undefined}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Frequency</label>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {FREQUENCY_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setFrequencyType(preset.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                frequencyType === preset.value
                  ? 'bg-accent text-white'
                  : 'bg-white/[0.06] text-text-muted hover:bg-white/[0.12]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {frequencyType === 'custom' && (
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i + 1)}
                className={`w-9 h-9 text-xs rounded-lg transition-all ${
                  frequencyDays.includes(i + 1)
                    ? 'bg-accent text-white'
                    : 'bg-white/[0.06] text-text-muted hover:bg-white/[0.12]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {frequencyType === 'x_per_week' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={7}
              value={frequencyCount}
              onChange={(e) => setFrequencyCount(Number(e.target.value))}
              className="w-16 bg-white/[0.06] border border-border rounded-lg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
            />
            <span className="text-xs text-text-muted">times per week</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-text-muted text-xs rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || isSaving}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : habit ? 'Save Changes' : 'Create Habit'}
        </button>
      </div>
    </div>
  );
}
