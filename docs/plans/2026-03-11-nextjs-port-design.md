# Calendar App — Next.js Port Design

**Date:** 2026-03-11
**Type:** Full rewrite from vanilla HTML/CSS/JS + Flask to Next.js + SQLite

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM + `drizzle-kit` for migrations |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack React Query v5 |
| URL state | nuqs |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Date picker | react-day-picker |
| Date utilities | date-fns |

---

## Architecture

**Approach: API Routes + Client-Side Rendering**

All calendar views are client components. Next.js API routes handle CRUD. React Query manages server state. nuqs manages view/date/search state in the URL.

Rationale: The app is inherently interactive (drag-drop, click handlers, real-time state). Client components + API routes + React Query is the cleanest fit for a single-user local app.

---

## Database Schema

Single `events` table in SQLite:

```
events
├── id              TEXT PRIMARY KEY (uuid)
├── title           TEXT NOT NULL
├── start           TEXT NOT NULL (ISO 8601 datetime)
├── end             TEXT NOT NULL (ISO 8601 datetime)
├── description     TEXT (nullable)
├── location        TEXT (nullable)
├── color           TEXT NOT NULL DEFAULT '#74d5ff'
├── category        TEXT (nullable) — 'Work' | 'Health' | 'Errand' | 'Social'
├── rec_type        TEXT (nullable) — 'daily' | 'weekly' | 'monthly' | 'yearly'
├── rec_interval    INTEGER (nullable)
├── rec_days        TEXT (nullable) — JSON array e.g. '[1,3]'
├── rec_end_date    TEXT (nullable) — ISO date
├── rec_count       INTEGER (nullable)
├── rec_monthly_mode TEXT (nullable) — 'dayOfMonth' | 'dayOfWeek'
├── created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
├── updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Recurrence fields are flattened columns. Recurring events stored once, expanded client-side.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/events?start=&end=` | List events in date range |
| `GET` | `/api/events/[id]` | Get single event |
| `POST` | `/api/events` | Create event |
| `PUT` | `/api/events/[id]` | Update event |
| `DELETE` | `/api/events/[id]` | Delete event |
| `GET` | `/api/events/search?q=` | Search by text |

Route handlers use Drizzle inline — no service layer.

---

## Project Structure

```
calendar-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, providers (QueryClient, nuqs)
│   │   ├── page.tsx              # Main page, renders CalendarShell
│   │   ├── globals.css           # Tailwind imports + custom theme tokens
│   │   └── api/
│   │       └── events/
│   │           ├── route.ts      # GET (list), POST (create)
│   │           ├── search/
│   │           │   └── route.ts  # GET search
│   │           └── [id]/
│   │               └── route.ts  # GET, PUT, DELETE single event
│   ├── components/
│   │   ├── calendar-shell.tsx    # Nav bar + view container
│   │   ├── nav-bar.tsx           # Today/prev/next, view switcher, search
│   │   ├── event-modal.tsx       # Create/edit/delete form modal
│   │   ├── date-time-picker.tsx  # react-day-picker + time selects
│   │   ├── recurrence-picker.tsx # Recurrence preset + custom modal
│   │   └── views/
│   │       ├── yearly-view.tsx
│   │       ├── monthly-view.tsx
│   │       ├── weekly-view.tsx
│   │       └── daily-view.tsx
│   ├── hooks/
│   │   ├── use-events.ts        # React Query hooks
│   │   └── use-calendar-state.ts # nuqs parsers for view, date, search
│   ├── lib/
│   │   ├── db.ts                # Drizzle client + SQLite connection
│   │   ├── schema.ts            # Drizzle table definition
│   │   ├── api-client.ts        # Typed fetch wrappers
│   │   ├── recurrence.ts        # Recurrence expansion (ported)
│   │   ├── overlap.ts           # Waterfall overlap calc (ported)
│   │   └── date-utils.ts        # Date helpers (ported)
│   └── types/
│       └── event.ts             # Event type, RecurrenceConfig type
├── drizzle.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## State Management (nuqs)

| Param | Parser | Default | Example |
|-------|--------|---------|---------|
| `view` | `parseAsStringLiteral(['yearly','monthly','weekly','daily'])` | `'monthly'` | `?view=weekly` |
| `date` | `parseAsIsoDate` | today | `?date=2026-03-11` |
| `q` | `parseAsString` | `''` | `?q=meeting` |

Replaces the in-memory state object. URL is the source of truth for navigation.

---

## Data Flow (React Query)

**Queries:**
- `useEvents(start, end)` — query key: `['events', start, end]`
- `useSearchEvents(query)` — query key: `['events', 'search', query]`

**Mutations (all invalidate `['events']`):**
- `useCreateEvent()` — POST
- `useUpdateEvent()` — PUT, with optimistic updates for drag-drop
- `useDeleteEvent()` — DELETE

**Flow:**
```
nuqs (view/date) → useEvents derives date range → React Query fetches → views render
nuqs (q)         → useSearchEvents fetches      → views render filtered results
user action      → mutation                      → invalidate → refetch
drag-drop        → optimistic update + mutation  → confirm or rollback
```

---

## Visual Design

Port existing dark theme to Tailwind:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#1a1a2e` | Body/page |
| Surface | `#16213e` / `#0f3460` | Cards, navbar, modals |
| Text primary | `#e0e0e0` | Body text |
| Text muted | `#888` | Secondary labels |
| Work | `#74d5ff` | Category color |
| Health | `#f16c76` | Category color |
| Errand | `#b8d4e3` | Category color |
| Social | `#d4a5ff` | Category color |

**Preserved behaviors:**
- Blank canvas — no grid lines/time labels unless events exist
- Waterfall overlap layout for concurrent events
- Drill-down: Year → Month → Week → Day
- Modal event form with tags, icons, recurrence picker
- Fixed top navbar with view switcher
- Custom scrollbar styling
