# View Event Card — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a centered popover that shows event details (title, time, location, description) when clicking an event, with edit/delete/close actions.

**Architecture:** New `EventViewCard` component rendered via React portal to `document.body`. `CalendarShell` gains `viewEvent` state that replaces the current direct-to-edit-modal flow. The view card acts as an intermediary — users peek at details, then choose to edit or delete.

**Tech Stack:** React 19, Tailwind CSS, React portal, existing `useDeleteEvent` hook

---

### Task 1: Create `EventViewCard` Component

**Files:**
- Create: `src/components/event-view-card.tsx`

**Step 1: Create the component file with basic structure**

```tsx
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatTime } from '@/lib/date-utils';
import { format } from 'date-fns';
import { useDeleteEvent } from '@/hooks/use-events';
import type { ExpandedEvent } from '@/types/event';

interface EventViewCardProps {
  event: ExpandedEvent;
  onClose: () => void;
  onEdit: (event: ExpandedEvent) => void;
}

export function EventViewCard({ event, onClose, onEdit }: EventViewCardProps) {
  const deleteMutation = useDeleteEvent();
  const start = new Date(event.start);
  const end = new Date(event.end);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDelete = async () => {
    if (confirm('Delete this event?')) {
      await deleteMutation.mutateAsync(event.id);
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit(event);
  };

  // Format date line: "Monday, 9 March · 6:00 – 7:00pm"
  const dateLine = `${format(start, 'EEEE, d MMMM')}  ·  ${formatTime(start)} – ${formatTime(end)}`;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] animate-[modalFadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-surface border border-white/[0.06] rounded-2xl w-[340px] shadow-[0_24px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] animate-[modalSlideIn_0.25s_ease-out] border-l-[5px]"
        style={{ borderLeftColor: event.color || '#4A90D9' }}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-1 px-3 pt-3 pb-1">
          {/* Edit button */}
          <button
            onClick={handleEdit}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-text transition-colors cursor-pointer"
            title="Edit"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-[#e05555] transition-colors cursor-pointer"
            title="Delete"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-white/[0.08] hover:text-text transition-colors cursor-pointer"
            title="Close"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {/* Title */}
          <h3 className="text-lg font-bold text-text mb-3">{event.title}</h3>

          {/* Date & time */}
          <div className="flex items-center gap-2.5 mb-3 text-sm text-text-muted">
            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{dateLine}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2.5 mb-3 text-sm text-text-muted">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-2.5 mb-1 text-sm text-[#b0b8c4]">
              <svg className="w-[18px] h-[18px] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="15" y2="18" />
              </svg>
              <span className="whitespace-pre-wrap">{event.description}</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Step 2: Verify the file was created**

Run: `ls src/components/event-view-card.tsx`
Expected: file exists

**Step 3: Commit**

```bash
git add src/components/event-view-card.tsx
git commit -m "feat: add EventViewCard component"
```

---

### Task 2: Wire `EventViewCard` into `CalendarShell`

**Files:**
- Modify: `src/components/calendar-shell.tsx`

**Step 1: Add viewEvent state and update onEventClick**

Add import at the top of `calendar-shell.tsx`:

```tsx
import { EventViewCard } from './event-view-card';
```

Add new state after the existing `modalState`:

```tsx
const [viewEvent, setViewEvent] = useState<ExpandedEvent | null>(null);
```

Add handler for transitioning from view card to edit modal:

```tsx
const openViewCard = useCallback((event: ExpandedEvent) => {
  setViewEvent(event);
}, []);

const handleViewCardEdit = useCallback((event: ExpandedEvent) => {
  setViewEvent(null);
  openEditModal(event);
}, [openEditModal]);

const closeViewCard = useCallback(() => {
  setViewEvent(null);
}, []);
```

**Step 2: Update viewProps to use view card instead of edit modal**

Change `onEventClick` in `viewProps`:

```tsx
const viewProps = {
  events,
  currentDate,
  onEventClick: openViewCard,   // was: openEditModal
  onEmptyClick: openCreateModal,
  onNavigate: navigate,
};
```

**Step 3: Render EventViewCard in the JSX**

Add after the `EventModal` block (before closing `</>`):

```tsx
{viewEvent && (
  <EventViewCard
    event={viewEvent}
    onClose={closeViewCard}
    onEdit={handleViewCardEdit}
  />
)}
```

**Step 4: Verify the app compiles**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add src/components/calendar-shell.tsx
git commit -m "feat: wire EventViewCard into CalendarShell"
```

---

### Task 3: Close View Card When Clicking Another Event

**Files:**
- Modify: `src/components/calendar-shell.tsx`

**Step 1: Verify behavior is already handled**

The `openViewCard` callback already sets `setViewEvent(event)` — clicking a new event while one is open will replace the current `viewEvent` with the new one, effectively closing the old card and opening the new one. No additional code needed.

**Step 2: Manual test**

Run: `npm run dev`

Test these scenarios:
1. Click an event in weekly view → view card appears centered with colored left border
2. View card shows title, date/time, location (if present), description (if present)
3. Click X → card closes
4. Click backdrop → card closes
5. Press Escape → card closes
6. Click another event while card is open → card updates to new event
7. Click Edit → card closes, edit modal opens with the event
8. Click Delete → confirmation dialog, then deletes event
9. Repeat tests in monthly view and daily view
10. Verify yearly view still navigates to daily view (no view card)

**Step 3: Commit (if any fixes needed)**

```bash
git add -u
git commit -m "fix: view event card interaction refinements"
```

---

### Task 4: Ensure Yearly View Bypasses View Card

**Files:**
- Modify: `src/components/calendar-shell.tsx` (only if needed)

**Step 1: Check yearly view behavior**

Look at `src/components/views/yearly-view.tsx`. The yearly view does NOT call `onEventClick` — it only uses `onNavigate` to go to daily/monthly views on click. So it already bypasses the view card naturally.

No code change needed. This task is verification only.

**Step 2: Manual test**

Run the dev server and click on days/months in yearly view. Confirm it navigates to daily/monthly view as before, no view card appears.

---

### Task 5: Visual Polish & Edge Cases

**Files:**
- Modify: `src/components/event-view-card.tsx` (if needed)

**Step 1: Test edge cases**

1. Event with no location and no description → only title and date/time shown, no empty space
2. Event with very long title → wraps properly within 340px card
3. Event with very long description → card doesn't exceed viewport (add `max-h-[80vh] overflow-y-auto` to card content if needed)
4. Delete a recurring event occurrence → confirm dialog works correctly

**Step 2: Fix any issues found during testing**

Apply fixes as needed based on test results.

**Step 3: Commit**

```bash
git add -u
git commit -m "style: polish EventViewCard edge cases"
```
