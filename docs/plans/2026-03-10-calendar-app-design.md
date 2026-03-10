# Calendar Web App — Design Specification

**Date:** 2026-03-10
**Type:** Local-only, single-user calendar application

---

## Stack

- **Backend:** Python (Flask) — REST API + static file serving
- **Frontend:** Vanilla HTML/CSS/JS — no build tools
- **Storage:** Local JSON file (`data/events.json`)

---

## Data Model

Each event stored in `data/events.json`:

```json
{
  "id": "uuid",
  "title": "Meeting",
  "start": "2026-03-10T14:00:00",
  "end": "2026-03-10T15:30:00",
  "description": "Optional notes",
  "location": "Optional location",
  "color": "#4A90D9",
  "category": "Work",
  "recurrence": {
    "type": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3],
    "endDate": "2026-06-10"
  }
}
```

- `recurrence` is null for one-off events
- `type`: `daily`, `weekly`, `monthly`, `yearly`
- `interval`: every N periods (e.g. every 2 weeks)
- `daysOfWeek`: for weekly recurrence (0=Sun, 6=Sat)
- `endDate`: null means repeats forever

---

## API

Flask REST API at `http://localhost:5000/api/`:

| Method   | Endpoint              | Description                                      |
|----------|-----------------------|--------------------------------------------------|
| `GET`    | `/api/events`         | List all events (optional `?start=&end=` filter) |
| `GET`    | `/api/events/:id`     | Get single event                                 |
| `POST`   | `/api/events`         | Create event                                     |
| `PUT`    | `/api/events/:id`     | Update event                                     |
| `DELETE` | `/api/events/:id`     | Delete event                                     |
| `GET`    | `/api/events/search?q=` | Search events by text                          |

- All responses return JSON
- Recurring events stored once, expanded client-side

---

## Views

### Design Principle

Blank canvas. No grid lines, no time labels unless an event exists. Events appear as positioned time blocks on empty space. Days with no events are blank.

### Overlapping Events (Waterfall Layout)

When events overlap in time, they split horizontal space equally side-by-side:
- 2 overlapping → 50% width each
- 3 overlapping → 33% each
- Connected overlap groups calculated together (A overlaps B, B overlaps C → all three share space)

### Yearly View
- 12 mini month grids in a 4x3 layout
- Days with events show colored dots with heat intensity
- Click a month → drills into monthly view

### Monthly View
- Month grid with day numbers
- Left column shows week number of the year (W1–W53)
- Events shown as small colored blocks within day cells
- Click a week number → drills into weekly view
- Click a day → drills into daily view

### Weekly View
- 7 columns (Mon–Sun), blank canvas
- Event blocks positioned vertically by time
- Overlapping events use waterfall layout
- Click a day header → drills into daily view

### Daily View
- Single column, blank canvas
- Event blocks positioned vertically by start/end time
- Overlapping events use waterfall layout
- Block shows title, time, and color

---

## Features

### Drag-and-Drop
- Drag event block to move to a new time/day (weekly and daily views)
- Drag bottom edge to resize (change duration)

### Search/Filter
- Search bar filters events by title, description, location, or category
- Results highlighted across all views

### Dark Mode
- Toggle in top navigation
- Preference saved in localStorage
- Dark background with light text and event blocks

### Recurrence
- Stored once in JSON, expanded client-side for rendering
- Edit a recurring event → prompt: "This event only" or "All future events"
- Delete follows the same pattern

### Navigation
- View switcher: Year / Month / Week / Day
- Arrow buttons to move between time periods
- "Today" button to jump to current date
- Drill-down flow: Year → Month (click month) → Week (click week number) → Day (click day)

---

## File Structure

```
calendar-app/
├── server/
│   ├── app.py              # Flask app, API routes
│   ├── requirements.txt    # Flask dependency
│   └── data/
│       └── events.json     # Event storage
├── frontend/
│   ├── index.html          # Single page
│   ├── css/
│   │   ├── style.css       # Main styles
│   │   └── dark.css        # Dark mode overrides
│   └── js/
│       ├── app.js           # Main app, routing, state
│       ├── api.js           # API client
│       ├── views/
│       │   ├── yearly.js    # Yearly view renderer
│       │   ├── monthly.js   # Monthly view renderer
│       │   ├── weekly.js    # Weekly view renderer
│       │   └── daily.js     # Daily view renderer
│       ├── components/
│       │   ├── eventForm.js # Create/edit event popup
│       │   ├── dragDrop.js  # Drag-and-drop logic
│       │   └── search.js    # Search/filter
│       └── utils/
│           ├── recurrence.js # Recurrence expansion
│           ├── overlap.js    # Waterfall overlap calculation
│           └── dateUtils.js  # Date helpers, week numbers
```
