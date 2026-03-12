# Habit Management Popup Design

## Summary

Replace the current inline add/delete habit controls in the daily sidebar with a centralized "Manage Habits" popup. The popup lists all habits, supports adding and deleting, and clicking a habit opens an edit view within the same modal. New fields: icon picker, frequency/goal, and category/tags.

## UI Structure

### Trigger

- Replace the "+" button in the Habit Tracker header with a gear/settings icon
- Same position and hover styling (glow, scale effects)

### Manage Habits Modal — List View

- Centered overlay with backdrop blur (matches existing modal style)
- Header: "Manage Habits" title + "Add Habit" button (top-right)
- Each habit row shows: color bar, icon, title, subtitle, category badge, frequency summary
- Click a row to open edit view
- Trash/x icon per row for deletion (hover reveal)
- Empty state: "No habits yet" with "Add Habit" button

### Edit/Add Habit View (replaces list within same modal)

- Back arrow to return to list
- Header: "Edit Habit" or "New Habit"
- Fields:
  - Title (text, required)
  - Subtitle (text, optional)
  - Icon (emoji picker grid)
  - Color (swatch picker)
  - Frequency: preset buttons (Daily, Weekdays, Weekends, Custom day picker) + "X times per week"
  - Category: dropdown with defaults (Health, Fitness, Learning, Mindfulness, Productivity) + "Create new..." option
- Save / Cancel buttons

## Data Model Changes

### Database

**habits table** — new columns:
- `frequency_type` TEXT DEFAULT 'daily' — values: daily, weekdays, weekends, custom, x_per_week
- `frequency_days` TEXT nullable — JSON array of day numbers for custom (e.g., [1,3,5])
- `frequency_count` INTEGER nullable — for "X times per week"
- `category_id` TEXT nullable — FK to categories.id

**categories table** — new:
- `id` TEXT PRIMARY KEY (UUID)
- `name` TEXT NOT NULL UNIQUE
- `is_default` INTEGER DEFAULT 0
- `created_at` DATETIME

Seed defaults on DB init: Health, Fitness, Learning, Mindfulness, Productivity.

### TypeScript Types

- `Habit` — add: frequencyType, frequencyDays, frequencyCount, category (object or null)
- `Category` — new: { id, name, isDefault }
- `HabitFormData` — add: icon, color, frequencyType, frequencyDays, frequencyCount, categoryId

### API Changes

- PUT `/api/habits/[id]` — accept new fields
- POST `/api/habits` — accept new fields
- GET/POST `/api/categories` — new endpoints

## Component Architecture

### New/Modified Components

1. `habit-tracker.tsx` (modify) — gear icon trigger, remove inline add modal and hover-delete
2. `habit-manage-modal.tsx` (new) — main modal with list/edit view switching
3. `habit-edit-form.tsx` (new) — edit/add form with all fields
4. `emoji-picker.tsx` (new) — emoji grid for icon selection
5. `category-badge.tsx` (new) — pill component for daily view

### Hooks

- `use-habits.ts` (modify) — update mutations, add useUpdateHabit
- `use-categories.ts` (new) — useCategories query + useCreateCategory mutation

### View State

useState inside modal:
- `view: 'list' | 'edit'`
- `editingHabitId: string | null` (null = creating new)

## Daily View Changes

- Add category badge (small pill) on habit cards
- Remove hover-delete "x" button (deletion moves to manage modal)
- Remove inline add-habit modal (replaced by manage modal)
- Completion toggle and date-aware behavior unchanged

## Approach

Single stacked modal — one popup with two views (list and edit) that transitions between them. No nested modals or side drawers.
