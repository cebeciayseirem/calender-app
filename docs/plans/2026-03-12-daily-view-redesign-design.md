# Daily View Redesign — Design Document

## Overview

Redesign the daily view from a simple vertical card stack into a two-panel layout: a left sidebar with widgets (motivational quote, habit tracker, weather) and a right panel with a vertical timeline schedule. Dark theme using existing design tokens.

Reference: the provided mockup image, adapted to the app's dark color palette.

## Layout

Two-panel horizontal layout below the NavBar:

- **Left sidebar**: fixed 350px width, `surface` background, rounded corners, vertical flex with gaps between widgets
- **Right panel**: flex-1, scrollable, `surface` background, rounded corners
- **Responsive**: on screens < 768px, sidebar stacks above the timeline

## Right Panel — Daily Timeline

### Header
- "Today's Schedule" title (bold, large)
- Subtitle: remaining tasks count (e.g., "4 tasks remaining")
- "+ Add Event" button (accent color, top-right) — opens existing EventModal with current day pre-filled

### Timeline Structure
- Vertical list of events sorted by start time
- Each event row: time label | vertical line + dot | event card
- Time labels: left-aligned, `text-muted` color (e.g., "08:00 AM")
- Vertical connecting line: 2px, `border` color, runs between events
- Event card: colored left border (4px, matches event color), title (bold), description/location (muted, smaller)

### Current-Time Indicator
- Filled accent-colored dot on the timeline at the current time position
- Horizontal accent line extending across the event area
- Updates every minute
- Only visible when current time falls within the day's event range
- No text badge

### Interactions
- Click event card → opens EventViewCard (existing)
- Click "+ Add Event" → opens EventModal
- Click empty area below events → opens EventModal at end of day

## Left Sidebar Widgets

### Motivational Quote (top)
- Italic text, centered, `text-muted` color
- Fetched daily from a free quotes API (e.g., ZenQuotes)
- Cached in localStorage with a date key (one fetch per day)
- Fallback to a hardcoded quote if API fails
- Client-side fetch, no new API route

### Habit Tracker (middle)
- Section header: "Habit Tracker" (bold) + "+" button to add habits
- Each habit row: colored icon (rounded square), title, subtitle (e.g., "6/8 glasses"), circular checkbox
- Checking a habit toggles completion for today
- Persisted in database (new tables)

### Weather Widget (bottom)
- Pinned to bottom of sidebar
- "CURRENT WEATHER" label (muted, small, uppercase)
- Large temperature display, weather icon, condition text
- High/Low temperatures on the right
- Fetched from OpenWeatherMap free tier using browser geolocation
- Cached in localStorage for 30 minutes
- Fallback: "Unable to load weather" if geolocation denied or API fails

## Data Model

### New Tables (Drizzle ORM)

**habits**
| Column     | Type   | Notes                        |
|------------|--------|------------------------------|
| id         | text   | Primary key                  |
| title      | text   | Required                     |
| subtitle   | text   | Nullable                     |
| icon       | text   | Default "✅"                  |
| color      | text   | Default "#4A90D9"            |
| created_at | text   | ISO timestamp                |
| updated_at | text   | ISO timestamp                |

**habit_completions**
| Column     | Type   | Notes                              |
|------------|--------|------------------------------------|
| id         | text   | Primary key                        |
| habit_id   | text   | Foreign key → habits.id            |
| date       | text   | "YYYY-MM-DD" format                |
| created_at | text   | ISO timestamp                      |

Unique constraint on (habit_id, date).

## API Routes

- `GET /api/habits` — all habits with today's completion status
- `POST /api/habits` — create new habit
- `PUT /api/habits/[id]` — update habit
- `DELETE /api/habits/[id]` — delete habit
- `POST /api/habits/[id]/toggle` — toggle today's completion (insert or delete)
- `GET /api/weather?lat=X&lon=Y` — proxy to OpenWeatherMap (API key server-side)

## Environment Variables

- `OPENWEATHERMAP_API_KEY` — required for weather widget, stored in `.env.local`

## Component Tree

```
DailyView
├── DailySidebar
│   ├── DailyQuote
│   ├── HabitTracker
│   │   └── HabitItem (per habit)
│   └── WeatherWidget
└── DailyTimeline
    ├── TimelineHeader (title + add button)
    ├── TimelineEvent (per event)
    └── CurrentTimeIndicator
```

## Styling

All components use existing Tailwind theme tokens (`bg-surface`, `text`, `text-muted`, `border`, `accent`). No new CSS variables needed. Dark theme is the default and only mode.

## Out of Scope

- Habit statistics/history views
- Weather forecast (multi-day)
- Drag-and-drop reordering of habits
- Light mode toggle
- Habit categories or grouping
