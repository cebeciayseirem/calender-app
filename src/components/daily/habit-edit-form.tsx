'use client';

import { useState } from 'react';
import { EmojiPicker } from './emoji-picker';
import { useCategories, useCreateCategory } from '@/hooks/use-categories';
import type { Habit, HabitFormData } from '@/types/habit';

const COLOR_OPTIONS = [
  '#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6',
  '#1ABC9C', '#E67E22', '#3498DB', '#E91E63', '#00BCD4',
];

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
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();

  const [title, setTitle] = useState(habit?.title || '');
  const [subtitle, setSubtitle] = useState(habit?.subtitle || '');
  const [icon, setIcon] = useState(habit?.icon || '✅');
  const [color, setColor] = useState(habit?.color || '#4A90D9');
  const [frequencyType, setFrequencyType] = useState(habit?.frequencyType || 'daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>(habit?.frequencyDays || []);
  const [frequencyCount, setFrequencyCount] = useState(habit?.frequencyCount || 3);
  const [categoryId, setCategoryId] = useState(habit?.category?.id || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      icon,
      color,
      frequencyType,
      frequencyDays: frequencyType === 'custom' ? frequencyDays : undefined,
      frequencyCount: frequencyType === 'x_per_week' ? frequencyCount : undefined,
      categoryId: categoryId || undefined,
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const cat = await createCategory.mutateAsync(newCategoryName.trim());
    setCategoryId(cat.id);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const toggleDay = (day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
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

      {/* Icon */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Icon</label>
        <EmojiPicker selected={icon} onSelect={setIcon} />
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${
                color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
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

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-1 block">Category</label>
        {!showNewCategory ? (
          <div className="flex flex-col gap-2">
            <select
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowNewCategory(true);
                } else {
                  setCategoryId(e.target.value);
                }
              }}
              className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
              <option value="__new__">+ Create new...</option>
            </select>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              placeholder="Category name..."
              autoFocus
              className="flex-1 bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              className="px-3 py-2 bg-accent text-white text-xs rounded-lg"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowNewCategory(false)}
              className="px-3 py-2 bg-white/[0.06] text-text-muted text-xs rounded-lg"
            >
              Cancel
            </button>
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
