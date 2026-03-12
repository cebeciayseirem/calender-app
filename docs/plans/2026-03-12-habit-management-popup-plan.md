# Habit Management Popup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace inline habit add/delete with a centralized management popup supporting editing, icons, frequency, and categories.

**Architecture:** Single stacked modal with list/edit view transitions. New categories table and habit columns for frequency/category. Category badge shown on daily view habit cards.

**Tech Stack:** Next.js 14, React, TanStack React Query, Drizzle ORM, better-sqlite3, Tailwind CSS

---

### Task 1: Add categories table and seed defaults

**Files:**
- Modify: `src/lib/schema.ts`
- Modify: `src/lib/db.ts`

**Step 1: Add categories schema to `src/lib/schema.ts`**

After the `habitCompletions` table definition, add:

```typescript
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  isDefault: integer('is_default').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

**Step 2: Add new columns to habits schema in `src/lib/schema.ts`**

Add to the `habits` table definition (before `createdAt`):

```typescript
frequencyType: text('frequency_type').notNull().default('daily'),
frequencyDays: text('frequency_days'),  // JSON array e.g. "[1,3,5]"
frequencyCount: integer('frequency_count'),
categoryId: text('category_id').references(() => categories.id),
```

**Step 3: Update raw SQL in `src/lib/db.ts`**

Add categories table creation and seed data, and ALTER habits table. Replace the `sqlite.exec` block with:

```typescript
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    icon TEXT NOT NULL DEFAULT '✅',
    color TEXT NOT NULL DEFAULT '#4A90D9',
    frequency_type TEXT NOT NULL DEFAULT 'daily',
    frequency_days TEXT,
    frequency_count INTEGER,
    category_id TEXT REFERENCES categories(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS habit_completions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(habit_id, date)
  );
`);

// Seed default categories
const defaultCategories = ['Health', 'Fitness', 'Learning', 'Mindfulness', 'Productivity'];
for (const name of defaultCategories) {
  sqlite.exec(`INSERT OR IGNORE INTO categories (id, name, is_default) VALUES ('${name.toLowerCase()}', '${name}', 1)`);
}

// Migration: add new columns to existing habits table if missing
try { sqlite.exec('ALTER TABLE habits ADD COLUMN frequency_type TEXT NOT NULL DEFAULT \'daily\''); } catch {}
try { sqlite.exec('ALTER TABLE habits ADD COLUMN frequency_days TEXT'); } catch {}
try { sqlite.exec('ALTER TABLE habits ADD COLUMN frequency_count INTEGER'); } catch {}
try { sqlite.exec('ALTER TABLE habits ADD COLUMN category_id TEXT REFERENCES categories(id)'); } catch {}
```

**Step 4: Delete existing database to start fresh, then run dev server to verify**

```bash
rm -f data/calendar.db
npm run dev
```

Open app, verify no errors. Check database has categories table with 5 defaults.

**Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/db.ts
git commit -m "feat: add categories table and frequency columns to habits"
```

---

### Task 2: Update TypeScript types and API client

**Files:**
- Modify: `src/types/habit.ts`
- Create: `src/types/category.ts`
- Modify: `src/lib/api-client.ts`

**Step 1: Create `src/types/category.ts`**

```typescript
export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}
```

**Step 2: Update `src/types/habit.ts`**

```typescript
import type { Category } from './category';

export interface Habit {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  color: string;
  frequencyType: 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_per_week';
  frequencyDays: number[] | null;
  frequencyCount: number | null;
  category: Category | null;
  completedToday: boolean;
}

export interface HabitFormData {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  frequencyType?: string;
  frequencyDays?: number[];
  frequencyCount?: number;
  categoryId?: string;
}
```

**Step 3: Add category API functions to `src/lib/api-client.ts`**

After the habit functions, add:

```typescript
import type { Category } from '@/types/category';

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}
```

Also update the `Habit` import to use from `@/types/habit` (already is — just verify the type import includes the new fields).

**Step 4: Commit**

```bash
git add src/types/habit.ts src/types/category.ts src/lib/api-client.ts
git commit -m "feat: add category types and update habit types with frequency fields"
```

---

### Task 3: Create categories API route

**Files:**
- Create: `src/app/api/categories/route.ts`

**Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const allCategories = db.select().from(categories).all();
  return NextResponse.json(
    allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      isDefault: !!c.isDefault,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  db.insert(categories)
    .values({ id, name: body.name, isDefault: 0 })
    .run();

  const created = db.select().from(categories).where(
    require('drizzle-orm').eq(categories.id, id)
  ).get();

  return NextResponse.json(
    { id: created!.id, name: created!.name, isDefault: false },
    { status: 201 }
  );
}
```

Note: Use proper `eq` import — `import { eq } from 'drizzle-orm';` at the top, not inline require.

**Step 2: Verify by running dev server and hitting `GET /api/categories`**

```bash
curl http://localhost:3000/api/categories
```

Should return 5 default categories.

**Step 3: Commit**

```bash
git add src/app/api/categories/route.ts
git commit -m "feat: add categories API endpoint"
```

---

### Task 4: Update habits API routes for new fields

**Files:**
- Modify: `src/app/api/habits/route.ts`
- Modify: `src/app/api/habits/[id]/route.ts`

**Step 1: Update GET in `src/app/api/habits/route.ts`**

Join with categories table to include category data in response. Update the result mapping:

```typescript
import { habits, habitCompletions, categories } from '@/lib/schema';
// ... in GET handler:
const allHabits = db.select().from(habits).all();

const result = allHabits.map((habit) => {
  const completion = db
    .select()
    .from(habitCompletions)
    .where(and(eq(habitCompletions.habitId, habit.id), eq(habitCompletions.date, today)))
    .get();

  let category = null;
  if (habit.categoryId) {
    const cat = db.select().from(categories).where(eq(categories.id, habit.categoryId)).get();
    if (cat) category = { id: cat.id, name: cat.name, isDefault: !!cat.isDefault };
  }

  return {
    id: habit.id,
    title: habit.title,
    subtitle: habit.subtitle,
    icon: habit.icon,
    color: habit.color,
    frequencyType: habit.frequencyType,
    frequencyDays: habit.frequencyDays ? JSON.parse(habit.frequencyDays) : null,
    frequencyCount: habit.frequencyCount,
    category,
    completedToday: !!completion,
  };
});
```

**Step 2: Update POST in `src/app/api/habits/route.ts`**

Add new fields to the insert:

```typescript
db.insert(habits)
  .values({
    id,
    title: body.title,
    subtitle: body.subtitle || null,
    icon: body.icon || '✅',
    color: body.color || '#4A90D9',
    frequencyType: body.frequencyType || 'daily',
    frequencyDays: body.frequencyDays ? JSON.stringify(body.frequencyDays) : null,
    frequencyCount: body.frequencyCount || null,
    categoryId: body.categoryId || null,
    createdAt: now,
    updatedAt: now,
  })
  .run();
```

Return the full shape including category lookup (same pattern as GET).

**Step 3: Update PUT in `src/app/api/habits/[id]/route.ts`**

Add new fields to the update set:

```typescript
db.update(habits)
  .set({
    title: body.title ?? existing.title,
    subtitle: body.subtitle ?? existing.subtitle,
    icon: body.icon ?? existing.icon,
    color: body.color ?? existing.color,
    frequencyType: body.frequencyType ?? existing.frequencyType,
    frequencyDays: body.frequencyDays !== undefined
      ? (body.frequencyDays ? JSON.stringify(body.frequencyDays) : null)
      : existing.frequencyDays,
    frequencyCount: body.frequencyCount !== undefined ? body.frequencyCount : existing.frequencyCount,
    categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
    updatedAt: now,
  })
  .where(eq(habits.id, id))
  .run();
```

Return full habit shape with category (same pattern as GET).

**Step 4: Verify dev server starts without errors**

**Step 5: Commit**

```bash
git add src/app/api/habits/route.ts src/app/api/habits/[id]/route.ts
git commit -m "feat: update habits API to support frequency and category fields"
```

---

### Task 5: Create useUpdateHabit hook and useCategories hooks

**Files:**
- Modify: `src/hooks/use-habits.ts`
- Create: `src/hooks/use-categories.ts`

**Step 1: Add `useUpdateHabit` to `src/hooks/use-habits.ts`**

```typescript
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HabitFormData }) => api.updateHabit(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
}
```

**Step 2: Create `src/hooks/use-categories.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.fetchCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createCategory(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
```

**Step 3: Commit**

```bash
git add src/hooks/use-habits.ts src/hooks/use-categories.ts
git commit -m "feat: add useUpdateHabit and category hooks"
```

---

### Task 6: Create CategoryBadge component

**Files:**
- Create: `src/components/daily/category-badge.tsx`

**Step 1: Create the component**

```tsx
'use client';

interface CategoryBadgeProps {
  name: string;
}

const categoryColors: Record<string, string> = {
  Health: 'bg-emerald-500/20 text-emerald-400',
  Fitness: 'bg-orange-500/20 text-orange-400',
  Learning: 'bg-blue-500/20 text-blue-400',
  Mindfulness: 'bg-purple-500/20 text-purple-400',
  Productivity: 'bg-yellow-500/20 text-yellow-400',
};

const defaultColor = 'bg-white/10 text-text-muted';

export function CategoryBadge({ name }: CategoryBadgeProps) {
  const colorClass = categoryColors[name] || defaultColor;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
      {name}
    </span>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/category-badge.tsx
git commit -m "feat: add CategoryBadge pill component"
```

---

### Task 7: Create EmojiPicker component

**Files:**
- Create: `src/components/daily/emoji-picker.tsx`

**Step 1: Create the component**

```tsx
'use client';

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

const EMOJI_OPTIONS = [
  '✅', '💪', '📚', '🧘', '🏃', '💧', '🎯', '✍️',
  '🌅', '💤', '🥗', '🧠', '🎵', '🏋️', '📝', '🌿',
  '❤️', '⭐', '🔥', '🎨', '💻', '🧹', '📖', '🏊',
];

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
            selected === emoji
              ? 'bg-accent/25 ring-1 ring-accent scale-110'
              : 'bg-white/[0.06] hover:bg-white/[0.12]'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/emoji-picker.tsx
git commit -m "feat: add EmojiPicker component"
```

---

### Task 8: Create HabitEditForm component

**Files:**
- Create: `src/components/daily/habit-edit-form.tsx`

**Step 1: Create the form component**

This is the edit/add form with all fields: title, subtitle, icon, color, frequency, category.

```tsx
'use client';

import { useState, useEffect } from 'react';
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
```

**Step 2: Commit**

```bash
git add src/components/daily/habit-edit-form.tsx
git commit -m "feat: add HabitEditForm component with all fields"
```

---

### Task 9: Create HabitManageModal component

**Files:**
- Create: `src/components/daily/habit-manage-modal.tsx`

**Step 1: Create the modal with list/edit view switching**

```tsx
'use client';

import { useState } from 'react';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from '@/hooks/use-habits';
import { HabitEditForm } from './habit-edit-form';
import { CategoryBadge } from './category-badge';
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
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="text-base shrink-0">{habit.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{habit.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {habit.subtitle && (
                          <p className="text-xs text-text-muted truncate">{habit.subtitle}</p>
                        )}
                        <span className="text-[10px] text-text-muted/60">{getFrequencyLabel(habit)}</span>
                        {habit.category && <CategoryBadge name={habit.category.name} />}
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
```

**Step 2: Commit**

```bash
git add src/components/daily/habit-manage-modal.tsx
git commit -m "feat: add HabitManageModal with list/edit view switching"
```

---

### Task 10: Update HabitTracker to use manage modal and show category badges

**Files:**
- Modify: `src/components/daily/habit-tracker.tsx`

**Step 1: Rewrite `habit-tracker.tsx`**

Remove: inline add modal, add state, delete button on cards.
Add: gear icon trigger, manage modal, category badge on cards.

```tsx
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
```

**Step 2: Verify the app runs and the manage modal opens**

```bash
npm run dev
```

Open daily view, click gear icon, verify:
- Modal opens with habit list
- Clicking a habit shows edit form
- "Add Habit" button shows blank form
- Saving creates/updates habit
- Delete works from list view
- Category badge shows on daily view cards

**Step 3: Commit**

```bash
git add src/components/daily/habit-tracker.tsx
git commit -m "feat: replace inline add/delete with manage modal and category badges"
```

---

### Task 11: Final verification and cleanup

**Step 1: Full manual test**

1. Delete database: `rm -f data/calendar.db`
2. Start dev server: `npm run dev`
3. Verify categories seeded (5 defaults)
4. Create a habit with all fields filled (title, subtitle, icon, color, frequency=custom with Mon/Wed/Fri, category=Health)
5. Verify habit shows in daily view with category badge
6. Click gear → click the habit → verify fields populated
7. Edit the title and category → save → verify changes reflected
8. Create a second habit → verify list shows both
9. Delete a habit from manage modal → verify removed
10. Toggle habit completion in daily view → verify still works
11. Change viewed date → verify completions are date-aware

**Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during verification"
```
