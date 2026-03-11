# Weekly Hourly Grid Design

## Overview

Add hour lines to the weekly view so events are displayed within a 24-hour time grid instead of a simple vertical stack.

## Layout

- CSS Grid: `grid-template-columns: 48px repeat(7, 1fr)`
- 48px left gutter for time labels (0–23), 7 equal day columns
- 24 rows, each ~60px min-height
- Day headers row is sticky at the top of the scroll container
- Entire grid scrolls vertically within the main area (`calc(100vh - 56px - 64px)`)
- Auto-scrolls to ~7-8 AM on mount

## Components

### WeeklyView
- Renders the CSS grid with sticky header row + 24 hour rows
- Groups events by day and hour
- Uses `useRef` + `useEffect` to auto-scroll to morning on mount
- No drag-and-drop

### HourCell
- Represents a single (day, hour) intersection in the grid
- Shows the first event card if one exists at that hour
- Displays a "+N more" badge when multiple events share the same hour
- Clicking empty space calls `onEmptyClick(day, hour)`

### EventCard
- Same visual styling as current DraggableEvent (color, shadow, text layout)
- Click-only interaction (calls `onEventClick`)
- No drag logic

## Today Highlight
- Accent bar at top of today's header cell
- Gradient overlay on all cells in today's column
- Same visual treatment as current design

## Event Placement
- Events are snapped to the hour row matching their start time
- If multiple events start in the same hour: show first event + "+N more" badge
- No absolute/duration-based positioning

## Decisions
- No drag-and-drop in this view
- Full 24-hour range (midnight to midnight)
- Scrollable (not fit-to-viewport)
- Time labels in shared left gutter (not per-column)
