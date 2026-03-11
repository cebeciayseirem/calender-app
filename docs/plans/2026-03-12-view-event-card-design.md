# View Event Card — Design Document

## Overview

Add a lightweight "view event" popover that appears when a user clicks an event in the calendar. This replaces the current behavior of immediately opening the full edit modal, matching the Google Calendar pattern of peek-then-edit.

## Decisions

### Component: `EventViewCard`

A new portal-based popover component rendered at `document.body` level.

### Positioning & Layout

- Centered on screen (fixed position, horizontally and vertically centered)
- Subtle semi-transparent backdrop overlay
- Fixed width ~320px, height determined by content
- Dark card background (#1a1f3a) matching existing surface color
- Rounded corners, drop shadow

### Visual Design

- **Left border** colored with the event's color (same pattern as daily view cards)
- **Toolbar** at top-right: edit (pencil icon), delete (trash icon), close (X icon)
- **Content rows** (empty fields hidden):
  - Title (bold)
  - Date & time range
  - Location (with pin icon)
  - Description (with text icon)

### Interaction Flow

1. User clicks an event → `EventViewCard` popover appears centered on screen
2. **Edit button** → closes popover, opens existing `EventModal` in edit mode
3. **Delete button** → deletes the event (with confirmation for recurring events)
4. **Close (X)**, click backdrop, or press Escape → closes popover
5. Clicking another event → closes current popover, opens new one

### View Integration

- **Monthly, Weekly, Daily views**: clicking an event opens the view card (instead of edit modal)
- **Yearly view**: unchanged (keeps current navigation behavior)

### State Management

- New state in `CalendarShell`: `viewEvent: ExpandedEvent | null`
- `onEventClick` sets `viewEvent` instead of opening the edit modal directly
- Edit button: clears `viewEvent`, then opens edit modal with the event
- Delete button: calls existing delete mutation, closes popover

## Out of Scope

- Inline editing within the popover
- Email or share actions
- Yearly view integration
