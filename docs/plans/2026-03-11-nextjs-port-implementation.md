# Next.js Port Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the calendar app from vanilla HTML/CSS/JS + Flask to Next.js 15 + SQLite + Drizzle + Tailwind + React Query + nuqs.

**Architecture:** Client-side rendered calendar views with Next.js API routes backed by SQLite via Drizzle ORM. React Query for data fetching/mutations, nuqs for URL-based state (view, date, search). @dnd-kit for drag-and-drop, react-day-picker for date selection.

**Tech Stack:** Next.js 15 (App Router), TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS v4, TanStack React Query v5, nuqs, @dnd-kit, react-day-picker, date-fns

**Design doc:** `docs/plans/2026-03-11-nextjs-port-design.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `drizzle.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Initialize Next.js project**

Run from `calendar-app/` directory. Delete old `frontend/` and `server/` directories after confirming the new project works (not in this task — keep them for reference).

```bash
cd calendar-app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

If it complains about existing files, create in a temp directory and move files. The key is to end up with a working Next.js project in `calendar-app/`.

**Step 2: Install dependencies**

```bash
npm install better-sqlite3 drizzle-orm @tanstack/react-query nuqs @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-day-picker date-fns uuid
npm install -D drizzle-kit @types/better-sqlite3 @types/uuid
```

**Step 3: Configure Drizzle**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/calendar.db',
  },
});
```

**Step 4: Set up globals.css with theme tokens**

Replace the generated `src/app/globals.css` with Tailwind imports and custom CSS properties for the dark theme:

```css
@import "tailwindcss";

@theme {
  --color-bg: #1a1a2e;
  --color-surface: #16213e;
  --color-surface-alt: #0f3460;
  --color-border: #2a2a4a;
  --color-text: #e0e0e0;
  --color-text-muted: #8899aa;
  --color-accent: #4A90D9;
  --color-accent-hover: #357ABD;
  --color-cat-work: #74d5ff;
  --color-cat-health: #f16c76;
  --color-cat-errand: #b8d4e3;
  --color-cat-social: #d4a5ff;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
* { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

**Step 5: Set up root layout with providers**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Calendar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Create `src/app/providers.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
```

**Step 6: Create placeholder page**

Create `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="mt-[60px] p-4 min-h-[calc(100vh-60px)]">
      <p className="text-text-muted">Calendar loading...</p>
    </main>
  );
}
```

**Step 7: Verify it runs**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see dark background with "Calendar loading..." text.

**Step 8: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with dependencies and theme"
```

---

### Task 2: Database Schema & Drizzle Setup

**Files:**
- Create: `src/lib/schema.ts`
- Create: `src/lib/db.ts`

**Step 1: Define Drizzle schema**

Create `src/lib/schema.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  description: text('description'),
  location: text('location'),
  color: text('color').notNull().default('#74d5ff'),
  category: text('category'),
  recType: text('rec_type'),
  recInterval: integer('rec_interval'),
  recDays: text('rec_days'),
  recEndDate: text('rec_end_date'),
  recCount: integer('rec_count'),
  recMonthlyMode: text('rec_monthly_mode'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
```

**Step 2: Create database connection**

Create `src/lib/db.ts`:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'calendar.db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
```

**Step 3: Generate and run migration**

```bash
mkdir -p data
npx drizzle-kit generate
npx drizzle-kit push
```

**Step 4: Verify database was created**

```bash
ls data/calendar.db
```

**Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/db.ts drizzle/ data/
git commit -m "feat: add Drizzle schema and SQLite database setup"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `src/types/event.ts`

**Step 1: Define shared types**

Create `src/types/event.ts`. These types are used on both client and server — they represent the API shape (not the DB shape). Recurrence is nested in the API response but flattened in the DB.

```typescript
export type CalendarView = 'yearly' | 'monthly' | 'weekly' | 'daily';
export type Category = 'Work' | 'Health' | 'Errand' | 'Social';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type MonthlyMode = 'dayOfMonth' | 'nthWeekday';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number;
  daysOfWeek?: number[];
  endDate?: string | null;
  endType: 'never' | 'on' | 'after';
  occurrenceCount?: number | null;
  monthlyMode?: MonthlyMode;
  nthWeekday?: { weekday: number; nth: number };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string | null;
  location?: string | null;
  color: string;
  category?: Category | null;
  recurrence?: RecurrenceConfig | null;
}

export interface ExpandedEvent extends CalendarEvent {
  originalId?: string;
  isOccurrence?: boolean;
}

export interface EventFormData {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  color: string;
  category?: string;
  recurrence?: RecurrenceConfig | null;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Work: '#74d5ff',
  Health: '#f16c76',
  Errand: '#b8d4e3',
  Social: '#d4a5ff',
};
```

**Step 2: Commit**

```bash
git add src/types/event.ts
git commit -m "feat: add TypeScript types for events, recurrence, and categories"
```

---

### Task 4: API Routes

**Files:**
- Create: `src/app/api/events/route.ts`
- Create: `src/app/api/events/[id]/route.ts`
- Create: `src/app/api/events/search/route.ts`

**Step 1: Create GET (list) and POST (create) route**

Create `src/app/api/events/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { and, gte, lte, or, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  let rows;
  if (start && end) {
    rows = db
      .select()
      .from(events)
      .where(
        or(
          isNotNull(events.recType),
          and(gte(events.end, start), lte(events.start, end))
        )
      )
      .all();
  } else {
    rows = db.select().from(events).all();
  }

  return NextResponse.json(rows.map(toApiEvent));
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.start && body.end && body.end <= body.start) {
    return NextResponse.json(
      { error: 'End date/time must be after start date/time' },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const rec = body.recurrence;

  db.insert(events)
    .values({
      id,
      title: body.title,
      start: body.start,
      end: body.end,
      description: body.description || null,
      location: body.location || null,
      color: body.color || '#74d5ff',
      category: body.category || null,
      recType: rec?.type || null,
      recInterval: rec?.interval || null,
      recDays: rec?.daysOfWeek ? JSON.stringify(rec.daysOfWeek) : null,
      recEndDate: rec?.endDate || null,
      recCount: rec?.occurrenceCount || null,
      recMonthlyMode: rec?.monthlyMode || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(events).where(lte(events.id, id)).get();
  return NextResponse.json(toApiEvent(created!), { status: 201 });
}

function toApiEvent(row: typeof events.$inferSelect) {
  const event: Record<string, unknown> = {
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end,
    description: row.description,
    location: row.location,
    color: row.color,
    category: row.category,
  };

  if (row.recType) {
    event.recurrence = {
      type: row.recType,
      interval: row.recInterval ?? 1,
      daysOfWeek: row.recDays ? JSON.parse(row.recDays) : undefined,
      endDate: row.recEndDate,
      occurrenceCount: row.recCount,
      monthlyMode: row.recMonthlyMode,
    };
  } else {
    event.recurrence = null;
  }

  return event;
}
```

**Step 2: Create single event routes (GET, PUT, DELETE)**

Create `src/app/api/events/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = db.select().from(events).where(eq(events.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(toApiEvent(row));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.start && body.end && body.end <= body.start) {
    return NextResponse.json(
      { error: 'End date/time must be after start date/time' },
      { status: 400 }
    );
  }

  const existing = db.select().from(events).where(eq(events.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rec = body.recurrence;
  const now = new Date().toISOString();

  db.update(events)
    .set({
      title: body.title,
      start: body.start,
      end: body.end,
      description: body.description || null,
      location: body.location || null,
      color: body.color || '#74d5ff',
      category: body.category || null,
      recType: rec?.type || null,
      recInterval: rec?.interval || null,
      recDays: rec?.daysOfWeek ? JSON.stringify(rec.daysOfWeek) : null,
      recEndDate: rec?.endDate || null,
      recCount: rec?.occurrenceCount || null,
      recMonthlyMode: rec?.monthlyMode || null,
      updatedAt: now,
    })
    .where(eq(events.id, id))
    .run();

  const updated = db.select().from(events).where(eq(events.id, id)).get();
  return NextResponse.json(toApiEvent(updated!));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(events).where(eq(events.id, id)).run();
  return NextResponse.json({ success: true });
}

function toApiEvent(row: typeof events.$inferSelect) {
  const event: Record<string, unknown> = {
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end,
    description: row.description,
    location: row.location,
    color: row.color,
    category: row.category,
  };

  if (row.recType) {
    event.recurrence = {
      type: row.recType,
      interval: row.recInterval ?? 1,
      daysOfWeek: row.recDays ? JSON.parse(row.recDays) : undefined,
      endDate: row.recEndDate,
      occurrenceCount: row.recCount,
      monthlyMode: row.recMonthlyMode,
    };
  } else {
    event.recurrence = null;
  }

  return event;
}
```

**Step 3: Create search route**

Create `src/app/api/events/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { or, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';

  if (!q) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;
  const rows = db
    .select()
    .from(events)
    .where(
      or(
        like(events.title, pattern),
        like(events.description, pattern),
        like(events.location, pattern),
        like(events.category, pattern)
      )
    )
    .all();

  return NextResponse.json(rows.map(toApiEvent));
}

function toApiEvent(row: typeof events.$inferSelect) {
  const event: Record<string, unknown> = {
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end,
    description: row.description,
    location: row.location,
    color: row.color,
    category: row.category,
  };

  if (row.recType) {
    event.recurrence = {
      type: row.recType,
      interval: row.recInterval ?? 1,
      daysOfWeek: row.recDays ? JSON.parse(row.recDays) : undefined,
      endDate: row.recEndDate,
      occurrenceCount: row.recCount,
      monthlyMode: row.recMonthlyMode,
    };
  } else {
    event.recurrence = null;
  }

  return event;
}
```

**Step 4: Test API manually**

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/events -H "Content-Type: application/json" -d '{"title":"Test Event","start":"2026-03-11T10:00:00","end":"2026-03-11T11:00:00","color":"#74d5ff"}'
curl http://localhost:3000/api/events
curl http://localhost:3000/api/events/search?q=test
```

**Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for event CRUD and search"
```

---

### Task 5: API Client & React Query Hooks

**Files:**
- Create: `src/lib/api-client.ts`
- Create: `src/hooks/use-events.ts`

**Step 1: Create typed API client**

Create `src/lib/api-client.ts`:

```typescript
import type { CalendarEvent, EventFormData } from '@/types/event';

const API_BASE = '/api';

export async function fetchEvents(start: string, end: string): Promise<CalendarEvent[]> {
  const params = start && end ? `?start=${start}&end=${end}` : '';
  const res = await fetch(`${API_BASE}/events${params}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchEvent(id: string): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events/${id}`);
  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json();
}

export async function createEvent(data: EventFormData): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function updateEvent(id: string, data: EventFormData): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update event');
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete event');
}

export async function searchEvents(query: string): Promise<CalendarEvent[]> {
  const res = await fetch(`${API_BASE}/events/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}
```

**Step 2: Create React Query hooks**

Create `src/hooks/use-events.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import type { EventFormData, CalendarEvent } from '@/types/event';

export function useEvents(start: string, end: string) {
  return useQuery({
    queryKey: ['events', start, end],
    queryFn: () => api.fetchEvents(start, end),
    enabled: !!start && !!end,
  });
}

export function useSearchEvents(query: string) {
  return useQuery({
    queryKey: ['events', 'search', query],
    queryFn: () => api.searchEvents(query),
    enabled: !!query,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventFormData) => api.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventFormData }) =>
      api.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
```

**Step 3: Commit**

```bash
git add src/lib/api-client.ts src/hooks/use-events.ts
git commit -m "feat: add API client and React Query hooks for events"
```

---

### Task 6: Calendar State Hook (nuqs)

**Files:**
- Create: `src/hooks/use-calendar-state.ts`

**Step 1: Create nuqs-based state hook**

Create `src/hooks/use-calendar-state.ts`:

```typescript
import { useQueryState, parseAsStringLiteral, parseAsString } from 'nuqs';
import { useMemo } from 'react';
import type { CalendarView } from '@/types/event';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  format,
  addMonths,
  addWeeks,
  addDays,
  addYears,
} from 'date-fns';

const views = ['yearly', 'monthly', 'weekly', 'daily'] as const;

export function useCalendarState() {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(views).withDefault('monthly')
  );

  const [dateStr, setDateStr] = useQueryState(
    'date',
    parseAsString.withDefault(format(new Date(), 'yyyy-MM-dd'))
  );

  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  );

  const currentDate = useMemo(() => {
    const parsed = new Date(dateStr + 'T00:00:00');
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dateStr]);

  const setDate = (date: Date) => {
    setDateStr(format(date, 'yyyy-MM-dd'));
  };

  const { start, end } = useMemo(() => {
    switch (view) {
      case 'yearly':
        return {
          start: format(startOfYear(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfYear(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      case 'monthly':
        return {
          start: format(startOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfMonth(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      case 'weekly':
        return {
          start: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss"),
        };
      case 'daily':
        return {
          start: format(startOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(endOfDay(currentDate), "yyyy-MM-dd'T'HH:mm:ss"),
        };
    }
  }, [view, currentDate]);

  const stepDate = (direction: 1 | -1) => {
    let next: Date;
    switch (view) {
      case 'yearly':
        next = addYears(currentDate, direction);
        break;
      case 'monthly':
        next = addMonths(currentDate, direction);
        break;
      case 'weekly':
        next = addWeeks(currentDate, direction);
        break;
      case 'daily':
        next = addDays(currentDate, direction);
        break;
    }
    setDate(next);
  };

  const goToToday = () => setDate(new Date());

  return {
    view: view as CalendarView,
    setView: (v: CalendarView) => setView(v),
    currentDate,
    setDate,
    start,
    end,
    stepDate,
    goToToday,
    searchQuery: searchQuery ?? '',
    setSearchQuery,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-calendar-state.ts
git commit -m "feat: add nuqs-based calendar state hook"
```

---

### Task 7: Utility Modules (Port from Vanilla JS)

**Files:**
- Create: `src/lib/date-utils.ts`
- Create: `src/lib/overlap.ts`
- Create: `src/lib/recurrence.ts`

**Step 1: Port date-utils.ts**

Create `src/lib/date-utils.ts`. Port from `frontend/js/utils/dateUtils.js`, but most date logic will use date-fns directly. Keep helpers that aren't covered by date-fns:

```typescript
import { format, getISOWeek, startOfWeek, isSameDay as dfnsSameDay } from 'date-fns';

export { dfnsSameDay as isSameDay };

export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

export function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function toLocalISO(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}
```

**Step 2: Port overlap.ts**

Create `src/lib/overlap.ts`. Direct TypeScript port of `frontend/js/utils/overlap.js`:

```typescript
import type { ExpandedEvent } from '@/types/event';

export interface OverlapLayout {
  event: ExpandedEvent;
  column: number;
  totalColumns: number;
}

export function calculateOverlapLayout(events: ExpandedEvent[]): OverlapLayout[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime() ||
      new Date(b.end).getTime() - new Date(a.end).getTime()
  );

  const groups: ExpandedEvent[][] = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const groupEnd = Math.max(
      ...currentGroup.map((e) => new Date(e.end).getTime())
    );
    if (new Date(sorted[i].start).getTime() < groupEnd) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);

  const layout: OverlapLayout[] = [];
  for (const group of groups) {
    const columns: ExpandedEvent[][] = [];
    for (const event of group) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (
          new Date(event.start).getTime() >=
          new Date(lastInCol.end).getTime()
        ) {
          columns[col].push(event);
          layout.push({ event, column: col, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
        layout.push({ event, column: columns.length - 1, totalColumns: 0 });
      }
    }
    for (const item of layout) {
      if (group.includes(item.event)) {
        item.totalColumns = columns.length;
      }
    }
  }
  return layout;
}
```

**Step 3: Port recurrence.ts**

Create `src/lib/recurrence.ts`. TypeScript port of `frontend/js/utils/recurrence.js`:

```typescript
import type { CalendarEvent, CalendarView, ExpandedEvent } from '@/types/event';
import { toLocalISO } from './date-utils';
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';

export function expandRecurrences(
  events: CalendarEvent[],
  currentDate: Date,
  view: CalendarView
): ExpandedEvent[] {
  const { start, end } = getViewRange(currentDate, view);
  const expanded: ExpandedEvent[] = [];

  for (const event of events) {
    if (!event.recurrence) {
      expanded.push(event);
      continue;
    }
    expanded.push(...generateOccurrences(event, start, end));
  }
  return expanded;
}

function getViewRange(
  date: Date,
  view: CalendarView
): { start: Date; end: Date } {
  switch (view) {
    case 'yearly':
      return { start: startOfYear(date), end: endOfYear(date) };
    case 'monthly':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'weekly':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'daily':
      return { start: startOfDay(date), end: endOfDay(date) };
  }
}

function generateOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedEvent[] {
  const occurrences: ExpandedEvent[] = [];
  const rec = event.recurrence!;
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const duration = eventEnd.getTime() - eventStart.getTime();
  const recEnd = rec.endDate ? new Date(rec.endDate) : rangeEnd;
  const limit = new Date(Math.min(rangeEnd.getTime(), recEnd.getTime()));

  let current = new Date(eventStart);

  while (current <= limit) {
    if (
      current >= rangeStart ||
      new Date(current.getTime() + duration) >= rangeStart
    ) {
      if (
        rec.type === 'weekly' &&
        rec.daysOfWeek &&
        rec.daysOfWeek.length > 0
      ) {
        if (rec.daysOfWeek.includes(current.getDay())) {
          occurrences.push(makeOccurrence(event, current, duration));
        }
      } else {
        occurrences.push(makeOccurrence(event, current, duration));
      }
    }
    current = advanceDate(current, rec);
  }
  return occurrences;
}

function advanceDate(
  date: Date,
  rec: NonNullable<CalendarEvent['recurrence']>
): Date {
  const d = new Date(date);
  switch (rec.type) {
    case 'daily':
      d.setDate(d.getDate() + rec.interval);
      break;
    case 'weekly':
      if (rec.daysOfWeek && rec.daysOfWeek.length > 0) {
        d.setDate(d.getDate() + 1);
      } else {
        d.setDate(d.getDate() + 7 * rec.interval);
      }
      break;
    case 'monthly':
      if (rec.monthlyMode === 'nthWeekday' && rec.nthWeekday) {
        d.setMonth(d.getMonth() + rec.interval, 1);
        const targetWeekday = rec.nthWeekday.weekday;
        const nth = rec.nthWeekday.nth;
        const firstOccurrence = new Date(d);
        while (firstOccurrence.getDay() !== targetWeekday) {
          firstOccurrence.setDate(firstOccurrence.getDate() + 1);
        }
        firstOccurrence.setDate(firstOccurrence.getDate() + nth * 7);
        d.setDate(firstOccurrence.getDate());
        d.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
      } else {
        d.setMonth(d.getMonth() + rec.interval);
      }
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + rec.interval);
      break;
  }
  return d;
}

function makeOccurrence(
  event: CalendarEvent,
  start: Date,
  duration: number
): ExpandedEvent {
  return {
    ...event,
    id: event.id,
    originalId: event.id,
    start: toLocalISO(start),
    end: toLocalISO(new Date(start.getTime() + duration)),
    isOccurrence: true,
  };
}
```

**Step 4: Commit**

```bash
git add src/lib/date-utils.ts src/lib/overlap.ts src/lib/recurrence.ts
git commit -m "feat: port date utils, overlap calculation, and recurrence expansion to TypeScript"
```

---

### Task 8: NavBar Component

**Files:**
- Create: `src/components/nav-bar.tsx`

**Step 1: Build the NavBar**

Create `src/components/nav-bar.tsx`. Port from the `#navbar` in `index.html` and navigation logic in `app.js`:

```tsx
'use client';

import { CalendarView } from '@/types/event';

interface NavBarProps {
  view: CalendarView;
  currentDate: Date;
  searchQuery: string;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSearchChange: (query: string) => void;
}

const VIEW_LABELS: Record<CalendarView, string> = {
  yearly: 'Year',
  monthly: 'Month',
  weekly: 'Week',
  daily: 'Day',
};

function getNavTitle(view: CalendarView, date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  switch (view) {
    case 'yearly':
      return String(date.getFullYear());
    case 'monthly':
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    case 'weekly':
    case 'daily':
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

export function NavBar({
  view,
  currentDate,
  searchQuery,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onSearchChange,
}: NavBarProps) {
  return (
    <nav className="fixed top-0 left-0 w-full h-[50px] bg-surface border-b border-border flex justify-between items-center px-4 z-[500]">
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 border border-border rounded bg-[#2a2a4a] text-text text-sm hover:bg-[#3a3a5a] cursor-pointer"
        >
          Today
        </button>
        <button
          onClick={onPrev}
          className="px-3 py-1.5 border border-border rounded bg-[#2a2a4a] text-text text-sm hover:bg-[#3a3a5a] cursor-pointer"
        >
          &larr;
        </button>
        <button
          onClick={onNext}
          className="px-3 py-1.5 border border-border rounded bg-[#2a2a4a] text-text text-sm hover:bg-[#3a3a5a] cursor-pointer"
        >
          &rarr;
        </button>
        <span className="font-bold ml-3">{getNavTitle(view, currentDate)}</span>
      </div>

      <div className="flex items-center gap-2">
        {(['yearly', 'monthly', 'weekly', 'daily'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1.5 border rounded text-sm cursor-pointer transition-colors ${
              view === v
                ? 'bg-accent text-white border-accent'
                : 'border-border bg-[#2a2a4a] text-text hover:bg-[#3a3a5a]'
            }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="px-2 py-1.5 rounded border border-border bg-surface text-text text-sm focus:outline-none focus:border-accent"
        />
      </div>
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/nav-bar.tsx
git commit -m "feat: add NavBar component with view switching and search"
```

---

### Task 9: Calendar Shell & Main Page

**Files:**
- Create: `src/components/calendar-shell.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Build CalendarShell**

Create `src/components/calendar-shell.tsx`. This is the main orchestrator — reads nuqs state, fetches events via React Query, renders NavBar + active view:

```tsx
'use client';

import { useCalendarState } from '@/hooks/use-calendar-state';
import { useEvents, useSearchEvents } from '@/hooks/use-events';
import { expandRecurrences } from '@/lib/recurrence';
import { NavBar } from './nav-bar';
import { YearlyView } from './views/yearly-view';
import { MonthlyView } from './views/monthly-view';
import { WeeklyView } from './views/weekly-view';
import { DailyView } from './views/daily-view';
import { EventModal } from './event-modal';
import { useMemo, useState, useCallback } from 'react';
import type { CalendarEvent, ExpandedEvent } from '@/types/event';

export function CalendarShell() {
  const {
    view,
    setView,
    currentDate,
    setDate,
    start,
    end,
    stepDate,
    goToToday,
    searchQuery,
    setSearchQuery,
  } = useCalendarState();

  const { data: rawEvents = [] } = useEvents(start, end);
  const { data: searchResults } = useSearchEvents(searchQuery);

  const events: ExpandedEvent[] = useMemo(() => {
    const source = searchQuery ? (searchResults ?? []) : rawEvents;
    return expandRecurrences(source, currentDate, view);
  }, [rawEvents, searchResults, searchQuery, currentDate, view]);

  // Event modal state
  const [modalState, setModalState] = useState<{
    open: boolean;
    event?: ExpandedEvent;
    date?: Date;
    hour?: number;
  }>({ open: false });

  const openCreateModal = useCallback((date?: Date, hour?: number) => {
    setModalState({ open: true, date, hour });
  }, []);

  const openEditModal = useCallback((event: ExpandedEvent) => {
    setModalState({ open: true, event });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ open: false });
  }, []);

  const navigate = useCallback(
    (newView: typeof view, date: Date) => {
      setView(newView);
      setDate(date);
    },
    [setView, setDate]
  );

  const viewProps = {
    events,
    currentDate,
    onEventClick: openEditModal,
    onEmptyClick: openCreateModal,
    onNavigate: navigate,
  };

  return (
    <>
      <NavBar
        view={view}
        currentDate={currentDate}
        searchQuery={searchQuery}
        onViewChange={setView}
        onPrev={() => stepDate(-1)}
        onNext={() => stepDate(1)}
        onToday={goToToday}
        onSearchChange={setSearchQuery}
      />

      <main className="mt-[60px] p-4 relative min-h-[calc(100vh-60px)]">
        {view === 'yearly' && <YearlyView {...viewProps} />}
        {view === 'monthly' && <MonthlyView {...viewProps} />}
        {view === 'weekly' && <WeeklyView {...viewProps} />}
        {view === 'daily' && <DailyView {...viewProps} />}

        <button
          onClick={() => openCreateModal(currentDate)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-accent text-white text-[28px] border-none cursor-pointer shadow-[0_4px_12px_rgba(74,144,217,0.4)] flex items-center justify-center transition-all hover:bg-accent-hover hover:scale-110 z-[100] leading-none"
        >
          +
        </button>
      </main>

      {modalState.open && (
        <EventModal
          event={modalState.event}
          defaultDate={modalState.date}
          defaultHour={modalState.hour}
          onClose={closeModal}
        />
      )}
    </>
  );
}
```

**Step 2: Update page.tsx**

Update `src/app/page.tsx`:

```tsx
import { CalendarShell } from '@/components/calendar-shell';

export default function Home() {
  return <CalendarShell />;
}
```

**Step 3: Commit**

```bash
git add src/components/calendar-shell.tsx src/app/page.tsx
git commit -m "feat: add CalendarShell orchestrator and wire up main page"
```

---

### Task 10: Yearly View

**Files:**
- Create: `src/components/views/yearly-view.tsx`

**Step 1: Build YearlyView**

Create `src/components/views/yearly-view.tsx`. Port from `frontend/js/views/yearly.js`:

```tsx
'use client';

import { getDaysInMonth } from 'date-fns';
import { isSameDay } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

interface YearlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function YearlyView({ events, currentDate, onNavigate }: YearlyViewProps) {
  const year = currentDate.getFullYear();
  const today = new Date();

  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, month) => (
        <MiniMonth
          key={month}
          year={year}
          month={month}
          today={today}
          events={events}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function MiniMonth({
  year,
  month,
  today,
  events,
  onNavigate,
}: {
  year: number;
  month: number;
  today: Date;
  events: ExpandedEvent[];
  onNavigate: (view: CalendarView, date: Date) => void;
}) {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = new Date(year, month).toLocaleString('default', {
    month: 'long',
  });

  return (
    <div className="p-2">
      <div
        className="font-bold text-center mb-2 cursor-pointer hover:text-accent"
        onClick={() => onNavigate('monthly', new Date(year, month, 1))}
      >
        {monthName}
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-text-muted">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center">
        {Array.from({ length: startOffset }, (_, i) => (
          <span key={`empty-${i}`} className="invisible text-xs p-1">
            0
          </span>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const isToday = isSameDay(date, today);
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.start), date)
          );
          const hasEvents = dayEvents.length > 0;

          return (
            <span
              key={day}
              className={`relative text-xs p-1 ${
                isToday
                  ? 'bg-accent text-white rounded-full font-bold'
                  : ''
              }`}
            >
              {day}
              {hasEvents && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: dayEvents[0].color || '#4A90D9',
                    opacity: 0.3 + Math.min(dayEvents.length / 5, 1) * 0.7,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/views/yearly-view.tsx
git commit -m "feat: add YearlyView component with mini month grids"
```

---

### Task 11: Monthly View

**Files:**
- Create: `src/components/views/monthly-view.tsx`

**Step 1: Build MonthlyView**

Create `src/components/views/monthly-view.tsx`. Port from `frontend/js/views/monthly.js`:

```tsx
'use client';

import { getDaysInMonth } from 'date-fns';
import { isSameDay, getWeekNumber } from '@/lib/date-utils';
import type { CalendarView, ExpandedEvent } from '@/types/event';

interface MonthlyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

export function MonthlyView({
  events,
  currentDate,
  onEventClick,
  onNavigate,
}: MonthlyViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const totalCells = startOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  let dayCounter = 1;

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="flex bg-surface">
        <div className="w-10 text-center text-sm text-text-muted py-2">Wk</div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="flex-1 text-center py-2 font-semibold text-sm">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {Array.from({ length: rows }, (_, row) => {
        const cells = [];
        const firstDayOfRow = row === 0 ? 1 : dayCounter;
        const weekDate =
          firstDayOfRow <= daysInMonth
            ? new Date(year, month, firstDayOfRow)
            : null;
        const weekNum = weekDate ? getWeekNumber(weekDate) : null;

        for (let col = 0; col < 7; col++) {
          const cellIndex = row * 7 + col;
          if (cellIndex >= startOffset && dayCounter <= daysInMonth) {
            const day = dayCounter;
            const date = new Date(year, month, day);
            const isToday = isSameDay(date, today);
            const dayEvents = events.filter((e) =>
              isSameDay(new Date(e.start), date)
            );
            dayCounter++;

            cells.push(
              <div
                key={col}
                className={`flex-1 p-1 border-r border-border last:border-r-0 cursor-pointer min-h-[100px] ${
                  isToday ? 'bg-[#1e2a4a]' : ''
                }`}
                onClick={() => onNavigate('daily', date)}
              >
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-accent text-white rounded-full inline-block w-6 h-6 leading-6 text-center'
                      : ''
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-1">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className="text-[11px] px-1 rounded text-white mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ backgroundColor: e.color || '#4A90D9' }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick(e);
                        }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[11px] text-text-muted">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else {
            cells.push(
              <div key={col} className="flex-1 border-r border-border last:border-r-0 min-h-[100px]" />
            );
          }
        }

        return (
          <div key={row} className="flex min-h-[100px] border-b border-border">
            <div
              className="w-10 flex items-center justify-center text-xs text-text-muted cursor-pointer hover:bg-[#1e2a4a]"
              onClick={() => weekDate && onNavigate('weekly', weekDate)}
            >
              {weekNum != null ? `W${weekNum}` : ''}
            </div>
            {cells}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/views/monthly-view.tsx
git commit -m "feat: add MonthlyView component with week numbers and event indicators"
```

---

### Task 12: Weekly View

**Files:**
- Create: `src/components/views/weekly-view.tsx`

**Step 1: Build WeeklyView**

Create `src/components/views/weekly-view.tsx`. Port from `frontend/js/views/weekly.js`:

```tsx
'use client';

import { getMonday, isSameDay, formatTime } from '@/lib/date-utils';
import { calculateOverlapLayout } from '@/lib/overlap';
import { startOfDay } from 'date-fns';
import type { CalendarView, ExpandedEvent } from '@/types/event';

interface WeeklyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
  onNavigate: (view: CalendarView, date: Date) => void;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function WeeklyView({
  events,
  currentDate,
  onEventClick,
  onEmptyClick,
  onNavigate,
}: WeeklyViewProps) {
  const monday = getMonday(currentDate);
  const today = new Date();

  return (
    <div className="flex">
      {Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);
        const isToday = isSameDay(day, today);
        const dayEvents = events.filter((e) =>
          isSameDay(new Date(e.start), day)
        );
        const layout = calculateOverlapLayout(dayEvents);
        const dayStart = startOfDay(day).getTime();

        return (
          <div key={i} className="flex-1 relative border-r border-border last:border-r-0">
            <div
              className={`text-center p-2 font-bold cursor-pointer ${
                isToday ? 'bg-accent text-white' : 'bg-surface'
              }`}
              onClick={() => onNavigate('daily', day)}
            >
              {day.toLocaleDateString('default', {
                weekday: 'short',
                day: 'numeric',
              })}
            </div>

            <div
              className="relative h-[calc(100vh-130px)]"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const hour = Math.floor(
                    (e.nativeEvent.offsetY / e.currentTarget.clientHeight) * 24
                  );
                  onEmptyClick(day, hour);
                }
              }}
            >
              {layout.map(({ event, column, totalColumns }, idx) => {
                const eStart = new Date(event.start).getTime();
                const eEnd = new Date(event.end).getTime();
                const topPercent = ((eStart - dayStart) / MS_PER_DAY) * 100;
                const heightPercent = ((eEnd - eStart) / MS_PER_DAY) * 100;
                const widthPercent = 100 / totalColumns;
                const leftPercent = column * widthPercent;

                return (
                  <div
                    key={idx}
                    className="absolute rounded-md px-2 py-1 text-white text-[13px] overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: event.color || '#4A90D9',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <span className="font-semibold block">{event.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/views/weekly-view.tsx
git commit -m "feat: add WeeklyView component with overlap layout"
```

---

### Task 13: Daily View

**Files:**
- Create: `src/components/views/daily-view.tsx`

**Step 1: Build DailyView**

Create `src/components/views/daily-view.tsx`. Port from `frontend/js/views/daily.js`:

```tsx
'use client';

import { isSameDay, formatTime } from '@/lib/date-utils';
import type { ExpandedEvent } from '@/types/event';

interface DailyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}

export function DailyView({
  events,
  currentDate,
  onEventClick,
  onEmptyClick,
}: DailyViewProps) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.start), currentDate))
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

  // Group overlapping events into rows
  const rows: ExpandedEvent[][] = [];
  for (const event of dayEvents) {
    const eStart = new Date(event.start).getTime();
    const eEnd = new Date(event.end).getTime();

    let placed = false;
    for (const row of rows) {
      const overlaps = row.some((other) => {
        const oStart = new Date(other.start).getTime();
        const oEnd = new Date(other.end).getTime();
        return eStart < oEnd && eEnd > oStart;
      });
      if (overlaps) {
        row.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([event]);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 min-h-[calc(100vh-80px)]">
      {rows.length === 0 && (
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onEmptyClick(currentDate, 9)}
        />
      )}
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex ${
            row.length > 1 ? 'flex-row gap-4 flex-wrap' : 'flex-col'
          }`}
        >
          {row.map((event) => (
            <div
              key={event.id + event.start}
              className="bg-[#1e2a4a] border-l-[5px] rounded p-4 min-w-[220px] max-w-[320px] cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ borderLeftColor: event.color || '#4A90D9' }}
              onClick={() => onEventClick(event)}
            >
              <span className="block text-xs text-text-muted mb-1.5">
                {formatTime(new Date(event.start))} -{' '}
                {formatTime(new Date(event.end))}
              </span>
              <span className="block text-base font-bold text-text mb-2">
                {event.title}
              </span>
              {event.location && (
                <span className="block text-xs text-text-muted mb-1">
                  {event.location}
                </span>
              )}
              {event.description && (
                <span className="block text-[13px] text-[#b0b8c4] whitespace-pre-wrap mb-2">
                  {event.description}
                </span>
              )}
              {event.category && (
                <span className="inline-block text-[11px] text-text-muted px-2 rounded-lg bg-white/[0.08]">
                  {event.category}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/views/daily-view.tsx
git commit -m "feat: add DailyView component with post-it card layout"
```

---

### Task 14: Event Modal (Create/Edit/Delete)

**Files:**
- Create: `src/components/event-modal.tsx`

**Step 1: Build EventModal**

Create `src/components/event-modal.tsx`. Port from `frontend/js/components/eventForm.js`. This is the largest component — handles create, edit, and delete:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import type { ExpandedEvent, EventFormData, RecurrenceConfig } from '@/types/event';
import { CATEGORY_COLORS } from '@/types/event';
import { DateTimePicker } from './date-time-picker';
import { RecurrencePicker } from './recurrence-picker';

interface EventModalProps {
  event?: ExpandedEvent;
  defaultDate?: Date;
  defaultHour?: number;
  onClose: () => void;
}

export function EventModal({
  event,
  defaultDate,
  defaultHour,
  onClose,
}: EventModalProps) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const isEditing = !!event;
  const titleRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [category, setCategory] = useState(event?.category ?? '');
  const [color, setColor] = useState(event?.color ?? '#74d5ff');
  const [startDateTime, setStartDateTime] = useState(() => {
    if (event) return event.start;
    if (defaultDate) {
      const d = new Date(defaultDate);
      if (defaultHour != null) d.setHours(defaultHour, 0, 0);
      return toLocalDatetime(d);
    }
    return '';
  });
  const [endDateTime, setEndDateTime] = useState(() => {
    if (event) return event.end;
    if (defaultDate) {
      const d = new Date(defaultDate);
      if (defaultHour != null) d.setHours(defaultHour + 1, 0, 0);
      else d.setHours(d.getHours() + 1, 0, 0);
      return toLocalDatetime(d);
    }
    return '';
  });
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(
    event?.recurrence ?? null
  );

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  const setTag = (tag: string) => {
    if (category === tag) {
      setCategory('');
      setColor('#74d5ff');
    } else {
      setCategory(tag);
      setColor(CATEGORY_COLORS[tag] || '#74d5ff');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDateTime || !endDateTime) {
      alert('Please select both start and end date/time.');
      return;
    }
    if (endDateTime <= startDateTime) {
      alert('End date/time must be after start date/time.');
      return;
    }

    const data: EventFormData = {
      title,
      start: startDateTime,
      end: endDateTime,
      description: description || undefined,
      location: location || undefined,
      color,
      category: category || undefined,
      recurrence,
    };

    if (isEditing && event) {
      if (event.isOccurrence) {
        const applyAll = confirm(
          'Apply to all future events? OK = All, Cancel = This only'
        );
        if (!applyAll) {
          data.recurrence = null;
          await createMutation.mutateAsync(data);
        } else {
          await updateMutation.mutateAsync({ id: event.id, data });
        }
      } else {
        await updateMutation.mutateAsync({ id: event.id, data });
      }
    } else {
      await createMutation.mutateAsync(data);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (event && confirm('Delete this event?')) {
      await deleteMutation.mutateAsync(event.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-[modalFadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[420px] max-h-[85vh] overflow-y-auto shadow-[0_24px_48px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] animate-[modalSlideIn_0.25s_ease-out]">
        <form onSubmit={handleSubmit} className="p-5">
          {/* Title */}
          <div className="flex items-stretch mb-2.5">
            <div className="w-[30px] shrink-0" />
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              className="flex-1 text-xl font-medium py-3 bg-transparent border-none border-b border-white/[0.08] rounded-none focus:outline-none focus:border-accent placeholder:text-[#445]"
            />
          </div>

          {/* Category tags */}
          <div className="flex gap-2 mb-2.5 ml-[30px]">
            {Object.entries(CATEGORY_COLORS).map(([tag, tagColor]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTag(tag)}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-all ${
                  category === tag
                    ? 'text-white'
                    : 'border-white/10 bg-transparent text-text-muted hover:border-white/25 hover:text-text'
                }`}
                style={
                  category === tag
                    ? { backgroundColor: tagColor, borderColor: tagColor }
                    : undefined
                }
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Date/Time picker */}
          <DateTimePicker
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            onStartChange={setStartDateTime}
            onEndChange={setEndDateTime}
          />

          {/* Description */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <svg
              className="w-5 h-5 text-text-muted shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="15" y2="18" />
            </svg>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              className="flex-1 border-none bg-transparent py-2.5 border-b border-white/[0.08] rounded-none text-[0.95rem] focus:outline-none focus:border-accent placeholder:text-[#556]"
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <svg
              className="w-5 h-5 text-text-muted shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="flex-1 border-none bg-transparent py-2.5 border-b border-white/[0.08] rounded-none text-[0.95rem] focus:outline-none focus:border-accent placeholder:text-[#556]"
            />
          </div>

          {/* Recurrence */}
          <RecurrencePicker
            recurrence={recurrence}
            startDateTime={startDateTime}
            onChange={setRecurrence}
          />

          {/* Actions */}
          <div className="flex gap-2.5 mt-3.5 justify-end">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="mr-auto bg-transparent text-[#e05555] border border-[rgba(224,85,85,0.3)] px-5 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-[rgba(224,85,85,0.1)] hover:border-[#e05555] transition-all"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent text-text-muted border border-white/[0.08] px-5 py-2.5 rounded-lg cursor-pointer text-sm hover:border-white/20 hover:text-text transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-br from-accent to-accent-hover text-white border-none px-7 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(74,144,217,0.3)] transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toLocalDatetime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}
```

**Step 2: Commit**

```bash
git add src/components/event-modal.tsx
git commit -m "feat: add EventModal component for create/edit/delete"
```

---

### Task 15: DateTimePicker Component

**Files:**
- Create: `src/components/date-time-picker.tsx`

**Step 1: Build DateTimePicker**

Create `src/components/date-time-picker.tsx`. Uses react-day-picker for date selection and select dropdowns for time:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import 'react-day-picker/style.css';

interface DateTimePickerProps {
  startDateTime: string;
  endDateTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateTimePicker({
  startDateTime,
  endDateTime,
  onStartChange,
  onEndChange,
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const startDate = startDateTime ? new Date(startDateTime) : null;
  const endDate = endDateTime ? new Date(endDateTime) : null;

  const dateDisplay = startDate
    ? format(startDate, 'EEE, d MMMM yyyy')
    : 'Select date';

  const startHour = startDate ? startDate.getHours() : null;
  const startMin = startDate ? startDate.getMinutes() : null;
  const endHour = endDate ? endDate.getHours() : null;
  const endMin = endDate ? endDate.getMinutes() : null;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const buildDatetime = (date: Date | null, h: number, m: number): string => {
    if (!date) return '';
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`;
  };

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    const h = startHour ?? 9;
    const m = startMin ?? 0;
    onStartChange(buildDatetime(day, h, m));
    const eh = endHour ?? h + 1;
    const em = endMin ?? m;
    onEndChange(buildDatetime(day, eh, em));
    setShowDatePicker(false);
  };

  const handleStartTimeChange = (h: number, m: number) => {
    const base = startDate || new Date();
    onStartChange(buildDatetime(base, h, m));
    // Auto-adjust end if needed
    if (endDate) {
      const endTotal = (endHour ?? 0) * 60 + (endMin ?? 0);
      if (endTotal <= h * 60 + m) {
        onEndChange(buildDatetime(endDate, (h + 1) % 24, m));
      }
    }
  };

  const handleEndTimeChange = (h: number, m: number) => {
    const base = endDate || startDate || new Date();
    onEndChange(buildDatetime(base, h, m));
  };

  return (
    <div className="relative flex items-center gap-0 mb-2.5" ref={pickerRef}>
      <svg
        className="w-5 h-5 text-text-muted shrink-0 mr-2.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      <div
        className={`cursor-pointer text-[0.95rem] whitespace-nowrap transition-colors hover:text-text ${
          startDate ? 'text-text' : 'text-text-muted'
        }`}
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        {dateDisplay}
      </div>

      <span className="w-4 shrink-0" />

      <TimeSelect
        hour={startHour}
        minute={startMin}
        placeholder="Start"
        onChange={handleStartTimeChange}
      />

      <span className="text-text-muted text-[0.95rem] shrink-0 mx-1">
        &ndash;
      </span>

      <TimeSelect
        hour={endHour}
        minute={endMin}
        placeholder="End"
        onChange={handleEndTimeChange}
      />

      {showDatePicker && (
        <div className="absolute top-full left-0 z-[1200] bg-surface border border-border rounded-lg p-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <DayPicker
            mode="single"
            selected={startDate ?? undefined}
            onSelect={handleDateSelect}
            weekStartsOn={1}
            classNames={{
              root: 'text-text text-sm',
              day: 'rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#2a2a4a]',
              selected: 'bg-accent text-white font-bold',
              today: 'border border-accent',
              chevron: 'text-text fill-text',
            }}
          />
        </div>
      )}
    </div>
  );
}

function TimeSelect({
  hour,
  minute,
  placeholder,
  onChange,
}: {
  hour: number | null;
  minute: number | null;
  placeholder: string;
  onChange: (h: number, m: number) => void;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const display = hour != null && minute != null ? `${pad(hour)}:${pad(minute)}` : placeholder;

  return (
    <div className="relative group">
      <select
        value={hour != null && minute != null ? `${hour}:${minute}` : ''}
        onChange={(e) => {
          const [h, m] = e.target.value.split(':').map(Number);
          onChange(h, m);
        }}
        className={`appearance-none bg-transparent border-none cursor-pointer text-[0.95rem] pr-1 focus:outline-none ${
          hour != null ? 'text-text' : 'text-text-muted'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {Array.from({ length: 24 * 12 }, (_, i) => {
          const h = Math.floor(i / 12);
          const m = (i % 12) * 5;
          return (
            <option key={i} value={`${h}:${m}`}>
              {pad(h)}:{pad(m)}
            </option>
          );
        })}
      </select>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/date-time-picker.tsx
git commit -m "feat: add DateTimePicker component with react-day-picker and time selects"
```

---

### Task 16: RecurrencePicker Component

**Files:**
- Create: `src/components/recurrence-picker.tsx`

**Step 1: Build RecurrencePicker**

Create `src/components/recurrence-picker.tsx`. Port from the recurrence modal logic in `eventForm.js`:

```tsx
'use client';

import { useState } from 'react';
import type { RecurrenceConfig, RecurrenceType } from '@/types/event';

interface RecurrencePickerProps {
  recurrence: RecurrenceConfig | null;
  startDateTime: string;
  onChange: (rec: RecurrenceConfig | null) => void;
}

const PRESET_LABELS: Record<string, string> = {
  '': 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurrencePicker({
  recurrence,
  startDateTime,
  onChange,
}: RecurrencePickerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // Local state for custom modal
  const [recType, setRecType] = useState<RecurrenceType>(
    recurrence?.type ?? 'weekly'
  );
  const [interval, setInterval] = useState(recurrence?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    recurrence?.daysOfWeek ?? []
  );
  const [endType, setEndType] = useState<'never' | 'on' | 'after'>(
    recurrence?.endType ?? 'never'
  );
  const [endDate, setEndDate] = useState(recurrence?.endDate ?? '');
  const [occurrenceCount, setOccurrenceCount] = useState(
    recurrence?.occurrenceCount ?? 1
  );
  const [monthlyMode, setMonthlyMode] = useState(
    recurrence?.monthlyMode ?? 'dayOfMonth'
  );

  const getLabel = (): string => {
    if (!recurrence) return 'Does not repeat';
    if (recurrence.interval === 1 && PRESET_LABELS[recurrence.type]) {
      return PRESET_LABELS[recurrence.type];
    }
    return `Custom: ${recurrence.type}${
      recurrence.interval > 1 ? ` (every ${recurrence.interval})` : ''
    }`;
  };

  const handlePresetSelect = (type: string) => {
    if (!type) {
      onChange(null);
    } else {
      onChange({
        type: type as RecurrenceType,
        interval: 1,
        endType: 'never',
      });
    }
    setShowPresets(false);
  };

  const handleCustomSave = () => {
    const rec: RecurrenceConfig = {
      type: recType,
      interval,
      endType,
      endDate: endType === 'on' ? endDate || null : null,
      occurrenceCount: endType === 'after' ? occurrenceCount : null,
    };

    if (recType === 'weekly' && daysOfWeek.length > 0) {
      rec.daysOfWeek = daysOfWeek;
    }

    if (recType === 'monthly') {
      rec.monthlyMode = monthlyMode;
      if (monthlyMode === 'nthWeekday' && startDateTime) {
        const d = new Date(startDateTime);
        rec.nthWeekday = {
          weekday: d.getDay(),
          nth: Math.floor((d.getDate() - 1) / 7),
        };
      }
    }

    onChange(rec);
    setShowCustom(false);
  };

  const getMonthlyLabel = (): string => {
    if (!startDateTime) return 'Monthly on day 1';
    const d = new Date(startDateTime);
    if (monthlyMode === 'nthWeekday') {
      const nth = Math.floor((d.getDate() - 1) / 7);
      return `Monthly on the ${ORDINALS[nth]} ${DAY_NAMES[d.getDay()]}`;
    }
    return `Monthly on day ${d.getDate()}`;
  };

  return (
    <>
      {/* Trigger row */}
      <div
        className="flex items-center gap-2.5 mb-2.5 cursor-pointer group"
        onClick={() => setShowPresets(true)}
      >
        <svg
          className="w-5 h-5 text-text-muted shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M23 4v6h-6" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span className="text-text-muted text-[0.95rem] group-hover:text-text transition-colors">
          {getLabel()}
        </span>
      </div>

      {/* Preset modal */}
      {showPresets && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={(e) =>
            e.target === e.currentTarget && setShowPresets(false)
          }
        >
          <div className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[340px] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
            {['', 'daily', 'weekly', 'monthly', 'yearly'].map((type) => (
              <div
                key={type}
                className="py-3.5 px-4 cursor-pointer text-[0.95rem] text-text border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.06] transition-colors"
                onClick={() => handlePresetSelect(type)}
              >
                {PRESET_LABELS[type]}
              </div>
            ))}
            <div
              className="py-3.5 px-4 cursor-pointer text-[0.95rem] text-accent hover:bg-white/[0.06] transition-colors"
              onClick={() => {
                setShowPresets(false);
                if (!recType) setRecType('weekly');
                setShowCustom(true);
              }}
            >
              Custom...
            </div>
          </div>
        </div>
      )}

      {/* Custom modal */}
      {showCustom && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={(e) =>
            e.target === e.currentTarget && setShowCustom(false)
          }
        >
          <div className="bg-gradient-to-br from-surface to-bg border border-white/[0.06] rounded-2xl w-[340px] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
            {/* Repeats every */}
            <div className="pb-3.5 border-b border-white/[0.06]">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
                Repeats every
              </label>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-[60px] text-center px-2.5 py-2.5 border border-white/[0.08] rounded-lg bg-white/[0.04] text-text text-sm"
                />
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value as RecurrenceType)}
                  className="w-[120px] px-3 py-2.5 border border-white/[0.08] rounded-lg bg-white/[0.04] text-text text-sm"
                >
                  <option value="daily">day</option>
                  <option value="weekly">week</option>
                  <option value="monthly">month</option>
                  <option value="yearly">year</option>
                </select>
              </div>
            </div>

            {/* Monthly mode */}
            {recType === 'monthly' && (
              <div className="py-3.5 border-b border-white/[0.06]">
                <select
                  value={monthlyMode}
                  onChange={(e) =>
                    setMonthlyMode(e.target.value as 'dayOfMonth' | 'nthWeekday')
                  }
                  className="w-full px-3 py-2.5 border border-white/[0.08] rounded-lg bg-white/[0.04] text-text text-sm"
                >
                  <option value="dayOfMonth">
                    {startDateTime
                      ? `Monthly on day ${new Date(startDateTime).getDate()}`
                      : 'Monthly on day 1'}
                  </option>
                  <option value="nthWeekday">{getMonthlyLabel()}</option>
                </select>
              </div>
            )}

            {/* Weekly days */}
            {recType === 'weekly' && (
              <div className="py-3.5 border-b border-white/[0.06]">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
                  Repeats on
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <label
                      key={day}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer text-xs font-medium transition-all ${
                        daysOfWeek.includes(day)
                          ? 'bg-accent/30 border-accent text-white'
                          : 'border-white/15 text-text-muted hover:border-accent/50 hover:text-text'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={daysOfWeek.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDaysOfWeek([...daysOfWeek, day]);
                          } else {
                            setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
                          }
                        }}
                      />
                      {DAY_LABELS[day]}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ends */}
            <div className="py-3.5">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2.5">
                Ends
              </label>

              <label className="flex items-center gap-3.5 py-3 cursor-pointer text-[0.95rem] text-text border-b border-white/[0.04]">
                <input
                  type="radio"
                  name="rec-end"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="hidden"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 relative ${
                    endType === 'never' ? 'border-accent' : 'border-white/20'
                  }`}
                >
                  {endType === 'never' && (
                    <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </span>
                Never
              </label>

              <label className="flex items-center gap-3.5 py-3 cursor-pointer text-[0.95rem] text-text border-b border-white/[0.04] flex-wrap">
                <input
                  type="radio"
                  name="rec-end"
                  checked={endType === 'on'}
                  onChange={() => setEndType('on')}
                  className="hidden"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 relative ${
                    endType === 'on' ? 'border-accent' : 'border-white/20'
                  }`}
                >
                  {endType === 'on' && (
                    <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </span>
                On
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onFocus={() => setEndType('on')}
                  className="ml-auto px-2.5 py-1.5 text-[0.85rem] border border-white/[0.08] rounded-lg bg-white/[0.04] text-text"
                />
              </label>

              <label className="flex items-center gap-3.5 py-3 cursor-pointer text-[0.95rem] text-text flex-wrap">
                <input
                  type="radio"
                  name="rec-end"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="hidden"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 relative ${
                    endType === 'after' ? 'border-accent' : 'border-white/20'
                  }`}
                >
                  {endType === 'after' && (
                    <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </span>
                After
                <input
                  type="number"
                  min="1"
                  value={occurrenceCount}
                  onChange={(e) =>
                    setOccurrenceCount(parseInt(e.target.value) || 1)
                  }
                  onFocus={() => setEndType('after')}
                  className="w-[60px] text-center px-2.5 py-1.5 text-[0.85rem] border border-white/[0.08] rounded-lg bg-white/[0.04] text-text"
                />
                <span>occurrence</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 justify-end mt-3.5">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="bg-transparent text-text-muted border border-white/[0.08] px-5 py-2.5 rounded-lg cursor-pointer text-sm hover:border-white/20 hover:text-text transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSave}
                className="bg-gradient-to-br from-accent to-accent-hover text-white border-none px-6 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(74,144,217,0.3)] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/recurrence-picker.tsx
git commit -m "feat: add RecurrencePicker component with preset and custom modes"
```

---

### Task 17: Integration Test & Polish

**Files:**
- Modify: Various files as needed for fixes

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Test all features manually**

Test each of these and fix any issues:

1. Page loads with monthly view, dark theme
2. View switching (Year/Month/Week/Day) updates URL params
3. Navigation (prev/next/today) works
4. Create event via FAB button — form opens, fill in fields, save
5. Click event to edit — form pre-fills, save updates
6. Delete event
7. Search filters events
8. Recurrence — create recurring event, verify occurrences appear
9. Monthly view — week numbers clickable, day cells clickable
10. Yearly view — month names clickable for drill-down
11. Weekly view — events positioned by time with overlap layout
12. Daily view — post-it card layout

**Step 3: Fix any TypeScript errors**

```bash
npx tsc --noEmit
```

Fix any type errors found.

**Step 4: Fix any lint errors**

```bash
npm run lint
```

Fix any lint errors found.

**Step 5: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues and TypeScript errors"
```

---

### Task 18: Drag-and-Drop (Weekly View)

**Files:**
- Modify: `src/components/views/weekly-view.tsx`

**Step 1: Add @dnd-kit to weekly view**

Update `src/components/views/weekly-view.tsx` to wrap event blocks in draggable containers. When an event is dropped on a different time slot or day column, fire an optimistic update via `useUpdateEvent`.

Key logic:
- Each event block gets `useDraggable` from @dnd-kit
- Each day column body is a `useDroppable` zone
- On `onDragEnd`, calculate the new start/end based on drop position (offsetY → hour mapping)
- Call `useUpdateEvent` with optimistic update

**Step 2: Test drag-and-drop**

Drag an event to a different time in the same day and to a different day. Verify:
- Event moves visually immediately (optimistic)
- After refetch, position persists
- Rolling back works if API fails

**Step 3: Commit**

```bash
git add src/components/views/weekly-view.tsx
git commit -m "feat: add drag-and-drop event rescheduling in weekly view"
```

---

### Task 19: Add Keyframe Animations to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add modal animations**

Append to `globals.css`:

```css
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add modal animation keyframes"
```

---

### Task 20: Clean Up & Final Verification

**Files:**
- Modify: `.gitignore`

**Step 1: Update .gitignore**

Ensure `.gitignore` includes:

```
node_modules/
.next/
data/calendar.db
data/calendar.db-wal
data/calendar.db-shm
drizzle/
```

**Step 2: Verify full build**

```bash
npm run build
```

Fix any build errors.

**Step 3: Verify production mode**

```bash
npm run start
```

Test the app at `http://localhost:3000`.

**Step 4: Commit**

```bash
git add .
git commit -m "chore: finalize build config and gitignore"
```

---

## Summary

| Task | Component | Key Files |
|------|-----------|-----------|
| 1 | Project scaffolding | `package.json`, `layout.tsx`, `globals.css` |
| 2 | Database setup | `schema.ts`, `db.ts` |
| 3 | TypeScript types | `types/event.ts` |
| 4 | API routes | `api/events/route.ts`, `[id]/route.ts`, `search/route.ts` |
| 5 | API client & hooks | `api-client.ts`, `use-events.ts` |
| 6 | Calendar state | `use-calendar-state.ts` |
| 7 | Utility modules | `date-utils.ts`, `overlap.ts`, `recurrence.ts` |
| 8 | NavBar | `nav-bar.tsx` |
| 9 | CalendarShell & page | `calendar-shell.tsx`, `page.tsx` |
| 10 | Yearly view | `yearly-view.tsx` |
| 11 | Monthly view | `monthly-view.tsx` |
| 12 | Weekly view | `weekly-view.tsx` |
| 13 | Daily view | `daily-view.tsx` |
| 14 | Event modal | `event-modal.tsx` |
| 15 | DateTimePicker | `date-time-picker.tsx` |
| 16 | RecurrencePicker | `recurrence-picker.tsx` |
| 17 | Integration test | Various |
| 18 | Drag-and-drop | `weekly-view.tsx` |
| 19 | Animations | `globals.css` |
| 20 | Clean up & build | `.gitignore` |
