# Daily View Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the daily view with a two-panel layout: left sidebar (quote, habit tracker, weather) + right timeline schedule, all in dark theme.

**Architecture:** New `DailyView` orchestrates two panels — `DailySidebar` (containing `DailyQuote`, `HabitTracker`, `WeatherWidget`) and `DailyTimeline` (containing `TimelineHeader`, `TimelineEvent`, `CurrentTimeIndicator`). Habits are persisted via new DB tables + API routes. Weather proxied through a server-side API route. Quote fetched client-side from a free API.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM + better-sqlite3, React Query, date-fns

---

### Task 1: Habits Database Schema & Migration

**Files:**
- Modify: `src/lib/schema.ts`
- Modify: `src/lib/db.ts`

**Step 1: Add habits and habit_completions tables to schema**

In `src/lib/schema.ts`, add after the existing `events` table:

```typescript
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  icon: text('icon').notNull().default('✅'),
  color: text('color').notNull().default('#4A90D9'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const habitCompletions = sqliteTable('habit_completions', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
```

**Step 2: Add table creation to db.ts**

In `src/lib/db.ts`, inside `createDb()`, after `sqlite.pragma('busy_timeout = 5000');`, add:

```typescript
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    icon TEXT NOT NULL DEFAULT '✅',
    color TEXT NOT NULL DEFAULT '#4A90D9',
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
```

**Step 3: Verify the app still starts**

Run: `npm run dev` — confirm no startup errors, existing views still work.

**Step 4: Commit**

```bash
git add src/lib/schema.ts src/lib/db.ts
git commit -m "feat: add habits and habit_completions database tables"
```

---

### Task 2: Habits API Routes

**Files:**
- Create: `src/app/api/habits/route.ts`
- Create: `src/app/api/habits/[id]/route.ts`
- Create: `src/app/api/habits/[id]/toggle/route.ts`

**Step 1: Create GET/POST `/api/habits`**

Create `src/app/api/habits/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitCompletions } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function GET() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const allHabits = db.select().from(habits).all();

  const result = allHabits.map((habit) => {
    const completion = db
      .select()
      .from(habitCompletions)
      .where(and(eq(habitCompletions.habitId, habit.id), eq(habitCompletions.date, today)))
      .get();

    return {
      ...habit,
      completedToday: !!completion,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.insert(habits)
    .values({
      id,
      title: body.title,
      subtitle: body.subtitle || null,
      icon: body.icon || '✅',
      color: body.color || '#4A90D9',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json({ ...created, completedToday: false }, { status: 201 });
}
```

**Step 2: Create PUT/DELETE `/api/habits/[id]`**

Create `src/app/api/habits/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const now = new Date().toISOString();

  const existing = db.select().from(habits).where(eq(habits.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  db.update(habits)
    .set({
      title: body.title ?? existing.title,
      subtitle: body.subtitle ?? existing.subtitle,
      icon: body.icon ?? existing.icon,
      color: body.color ?? existing.color,
      updatedAt: now,
    })
    .where(eq(habits.id, id))
    .run();

  const updated = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(habits).where(eq(habits.id, id)).run();
  return NextResponse.json({ success: true });
}
```

**Step 3: Create POST `/api/habits/[id]/toggle`**

Create `src/app/api/habits/[id]/toggle/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habitCompletions } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const today = format(new Date(), 'yyyy-MM-dd');

  const existing = db
    .select()
    .from(habitCompletions)
    .where(and(eq(habitCompletions.habitId, id), eq(habitCompletions.date, today)))
    .get();

  if (existing) {
    db.delete(habitCompletions).where(eq(habitCompletions.id, existing.id)).run();
    return NextResponse.json({ completed: false });
  } else {
    db.insert(habitCompletions)
      .values({ id: uuidv4(), habitId: id, date: today, createdAt: new Date().toISOString() })
      .run();
    return NextResponse.json({ completed: true });
  }
}
```

**Step 4: Test with curl**

```bash
# Create a habit
curl -X POST http://localhost:3000/api/habits -H 'Content-Type: application/json' -d '{"title":"Drink Water","subtitle":"8 glasses"}'

# List habits
curl http://localhost:3000/api/habits

# Toggle completion
curl -X POST http://localhost:3000/api/habits/<id>/toggle
```

**Step 5: Commit**

```bash
git add src/app/api/habits/
git commit -m "feat: add habits CRUD and toggle API routes"
```

---

### Task 3: Habits React Query Hooks & API Client

**Files:**
- Modify: `src/lib/api-client.ts`
- Create: `src/hooks/use-habits.ts`
- Create: `src/types/habit.ts`

**Step 1: Create habit types**

Create `src/types/habit.ts`:

```typescript
export interface Habit {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  color: string;
  completedToday: boolean;
}

export interface HabitFormData {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
}
```

**Step 2: Add habit API functions to api-client.ts**

Append to `src/lib/api-client.ts`:

```typescript
import type { Habit, HabitFormData } from '@/types/habit';

export async function fetchHabits(): Promise<Habit[]> {
  const res = await fetch(`${API_BASE}/habits`);
  if (!res.ok) throw new Error('Failed to fetch habits');
  return res.json();
}

export async function createHabit(data: HabitFormData): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create habit');
  return res.json();
}

export async function updateHabit(id: string, data: HabitFormData): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update habit');
  return res.json();
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/habits/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete habit');
}

export async function toggleHabit(id: string): Promise<{ completed: boolean }> {
  const res = await fetch(`${API_BASE}/habits/${id}/toggle`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle habit');
  return res.json();
}
```

**Step 3: Create React Query hooks**

Create `src/hooks/use-habits.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import type { HabitFormData } from '@/types/habit';

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api.fetchHabits(),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HabitFormData) => api.createHabit(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteHabit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.toggleHabit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });
}
```

**Step 4: Commit**

```bash
git add src/types/habit.ts src/lib/api-client.ts src/hooks/use-habits.ts
git commit -m "feat: add habit types, API client functions, and React Query hooks"
```

---

### Task 4: Weather API Route

**Files:**
- Create: `src/app/api/weather/route.ts`

**Step 1: Create weather proxy route**

Create `src/app/api/weather/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Weather API key not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Weather API error' }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      high: Math.round(data.main.temp_max),
      low: Math.round(data.main.temp_min),
      condition: data.weather[0]?.main || 'Unknown',
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '01d',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}
```

**Step 2: Add OPENWEATHERMAP_API_KEY to .env.local**

Create or append to `.env.local`:

```
OPENWEATHERMAP_API_KEY=your_api_key_here
```

**Step 3: Commit**

```bash
git add src/app/api/weather/route.ts
git commit -m "feat: add weather proxy API route"
```

---

### Task 5: DailyQuote Component

**Files:**
- Create: `src/components/daily/daily-quote.tsx`

**Step 1: Create the component**

Create `src/components/daily/daily-quote.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';

const FALLBACK_QUOTES = [
  { q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
  { q: 'Your daily actions are the building blocks of your future self.', a: 'James Clear' },
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
];

interface Quote {
  q: string;
  a: string;
}

function getCachedQuote(): Quote | null {
  try {
    const cached = localStorage.getItem('daily-quote');
    if (!cached) return null;
    const { quote, date } = JSON.parse(cached);
    if (date === new Date().toISOString().slice(0, 10)) return quote;
    return null;
  } catch {
    return null;
  }
}

function cacheQuote(quote: Quote) {
  localStorage.setItem(
    'daily-quote',
    JSON.stringify({ quote, date: new Date().toISOString().slice(0, 10) })
  );
}

export function DailyQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const cached = getCachedQuote();
    if (cached) {
      setQuote(cached);
      return;
    }

    fetch('https://zenquotes.io/api/today')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data[0]?.q) {
          const q = { q: data[0].q, a: data[0].a };
          cacheQuote(q);
          setQuote(q);
        } else {
          throw new Error('bad response');
        }
      })
      .catch(() => {
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(fallback);
      });
  }, []);

  if (!quote) return null;

  return (
    <div className="px-5 py-6 text-center">
      <p className="text-sm italic text-text-muted leading-relaxed">
        &ldquo;{quote.q}&rdquo;
      </p>
      {quote.a && (
        <p className="text-xs text-text-muted/60 mt-2">— {quote.a}</p>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/daily-quote.tsx
git commit -m "feat: add DailyQuote component with API fetch and caching"
```

---

### Task 6: HabitTracker Component

**Files:**
- Create: `src/components/daily/habit-tracker.tsx`

**Step 1: Create the component**

Create `src/components/daily/habit-tracker.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useHabits, useCreateHabit, useToggleHabit, useDeleteHabit } from '@/hooks/use-habits';

export function HabitTracker() {
  const { data: habits = [], isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabit();
  const deleteHabit = useDeleteHabit();

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createHabit.mutate({ title: newTitle.trim(), subtitle: newSubtitle.trim() || undefined });
    setNewTitle('');
    setNewSubtitle('');
    setAdding(false);
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text">Habit Tracker</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-text-muted hover:text-text flex items-center justify-center transition-colors text-lg"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="mb-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Habit name..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
            className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Subtitle (optional)..."
            value={newSubtitle}
            onChange={(e) => setNewSubtitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full bg-white/[0.06] border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewSubtitle(''); }}
              className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-text-muted text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}

      <div className="flex flex-col gap-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-3 py-3 group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: habit.color + '22' }}
            >
              {habit.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{habit.title}</p>
              {habit.subtitle && (
                <p className="text-xs text-text-muted truncate">{habit.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => deleteHabit.mutate(habit.id)}
              className="w-6 h-6 rounded-full text-text-muted/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs"
              title="Delete habit"
            >
              ✕
            </button>
            <button
              onClick={() => toggleHabit.mutate(habit.id)}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                habit.completedToday
                  ? 'bg-accent border-accent text-white'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              {habit.completedToday && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/habit-tracker.tsx
git commit -m "feat: add HabitTracker component with CRUD and toggle"
```

---

### Task 7: WeatherWidget Component

**Files:**
- Create: `src/components/daily/weather-widget.tsx`

**Step 1: Create the component**

Create `src/components/daily/weather-widget.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  high: number;
  low: number;
  condition: string;
  description: string;
  icon: string;
}

const WEATHER_ICONS: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
};

function getCachedWeather(): WeatherData | null {
  try {
    const cached = localStorage.getItem('weather-data');
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 30 * 60 * 1000) return data;
    return null;
  } catch {
    return null;
  }
}

function cacheWeather(data: WeatherData) {
  localStorage.setItem('weather-data', JSON.stringify({ data, timestamp: Date.now() }));
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          cacheWeather(data);
          setWeather(data);
        } catch {
          setError('Unable to load weather');
        }
      },
      () => setError('Location access denied')
    );
  }, []);

  if (error) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Current Weather</p>
        <p className="text-xs text-text-muted">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Current Weather</p>
        <p className="text-xs text-text-muted">Loading...</p>
      </div>
    );
  }

  const icon = WEATHER_ICONS[weather.condition] || '🌤️';

  return (
    <div className="px-5 py-4">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Current Weather</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-2xl font-bold text-text">{weather.temp}°F</p>
            <p className="text-xs text-text-muted capitalize">{weather.description}</p>
          </div>
        </div>
        <div className="text-right text-xs text-text-muted">
          <p>High: {weather.high}°</p>
          <p>Low: {weather.low}°</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/weather-widget.tsx
git commit -m "feat: add WeatherWidget component with geolocation and caching"
```

---

### Task 8: DailySidebar Component

**Files:**
- Create: `src/components/daily/daily-sidebar.tsx`

**Step 1: Create the component**

Create `src/components/daily/daily-sidebar.tsx`:

```typescript
'use client';

import { DailyQuote } from './daily-quote';
import { HabitTracker } from './habit-tracker';
import { WeatherWidget } from './weather-widget';

export function DailySidebar() {
  return (
    <aside className="w-[350px] shrink-0 bg-surface rounded-2xl flex flex-col overflow-hidden max-md:w-full">
      <DailyQuote />
      <div className="w-full h-px bg-border" />
      <div className="flex-1 overflow-y-auto">
        <HabitTracker />
      </div>
      <div className="w-full h-px bg-border" />
      <div className="mt-auto">
        <WeatherWidget />
      </div>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/daily-sidebar.tsx
git commit -m "feat: add DailySidebar component composing quote, habits, and weather"
```

---

### Task 9: DailyTimeline Component

**Files:**
- Create: `src/components/daily/daily-timeline.tsx`

**Step 1: Create the component**

This is the right panel with the schedule timeline. Create `src/components/daily/daily-timeline.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/date-utils';
import { format } from 'date-fns';
import type { ExpandedEvent } from '@/types/event';

interface DailyTimelineProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onAddEvent: (date: Date, hour?: number) => void;
}

export function DailyTimeline({ events, currentDate, onEventClick, onAddEvent }: DailyTimelineProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const isToday =
    now.getFullYear() === currentDate.getFullYear() &&
    now.getMonth() === currentDate.getMonth() &&
    now.getDate() === currentDate.getDate();

  const remaining = events.filter((e) => new Date(e.end) > now).length;

  // Find where the current time falls among events for the indicator
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex-1 bg-surface rounded-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-xl font-bold text-text">
            {format(currentDate, "EEEE',' d MMMM")}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {isToday ? `${remaining} tasks remaining` : `${events.length} events`}
          </p>
        </div>
        <button
          onClick={() => onAddEvent(currentDate)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span> Add Event
        </button>
      </div>

      {/* Timeline */}
      <div className="px-6 pb-6">
        {events.length === 0 ? (
          <div
            className="flex items-center justify-center h-48 text-text-muted text-sm cursor-pointer rounded-xl hover:bg-white/[0.03] transition-colors"
            onClick={() => onAddEvent(currentDate, 9)}
          >
            No events today. Click to add one.
          </div>
        ) : (
          <div className="relative">
            {events.map((event, idx) => {
              const startTime = new Date(event.start);
              const endTime = new Date(event.end);
              const eventStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
              const eventEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();
              const isCurrent = isToday && nowMinutes >= eventStartMinutes && nowMinutes < eventEndMinutes;
              const isPast = isToday && nowMinutes >= eventEndMinutes;

              return (
                <div key={event.id + event.start} className="flex gap-4">
                  {/* Time label */}
                  <div className="w-[72px] shrink-0 pt-4 text-right">
                    <span className={`text-xs font-medium ${isCurrent ? 'text-accent' : 'text-text-muted'}`}>
                      {format(startTime, 'hh:mm a')}
                    </span>
                  </div>

                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center w-4 shrink-0">
                    {/* Dot */}
                    <div
                      className={`w-3 h-3 rounded-full mt-5 shrink-0 ${
                        isCurrent ? 'bg-accent shadow-[0_0_8px_rgba(74,144,217,0.5)]' : isPast ? 'bg-text-muted/30' : 'bg-border'
                      }`}
                    />
                    {/* Line */}
                    {idx < events.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border min-h-[16px]" />
                    )}
                  </div>

                  {/* Event card */}
                  <div
                    onClick={() => onEventClick(event)}
                    className={`flex-1 border-l-4 rounded-lg px-4 py-3 mb-3 cursor-pointer transition-all hover:bg-white/[0.06] ${
                      isPast ? 'opacity-50' : ''
                    } ${isCurrent ? 'bg-white/[0.06]' : 'bg-white/[0.03]'}`}
                    style={{ borderLeftColor: event.color || '#4A90D9' }}
                  >
                    <p className={`text-sm font-semibold ${isPast ? 'text-text-muted' : 'text-text'}`}>
                      {event.title}
                    </p>
                    {(event.description || event.location) && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {event.location || event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Current time line — spans full width */}
            {isToday && events.length > 0 && (
              <CurrentTimeLine now={now} events={events} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentTimeLine({ now, events }: { now: Date; events: ExpandedEvent[] }) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const firstStart = new Date(events[0].start);
  const lastEnd = new Date(events[events.length - 1].end);
  const firstMinutes = firstStart.getHours() * 60 + firstStart.getMinutes();
  const lastMinutes = lastEnd.getHours() * 60 + lastEnd.getMinutes();

  if (nowMinutes < firstMinutes || nowMinutes > lastMinutes) return null;

  // Approximate vertical position as percentage of timeline
  const pct = ((nowMinutes - firstMinutes) / (lastMinutes - firstMinutes)) * 100;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top: `${pct}%` }}
    >
      <div className="w-full h-0.5 bg-accent/60" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/daily/daily-timeline.tsx
git commit -m "feat: add DailyTimeline component with current-time indicator"
```

---

### Task 10: Rewrite DailyView & Update CalendarShell

**Files:**
- Modify: `src/components/views/daily-view.tsx`
- Modify: `src/components/calendar-shell.tsx`

**Step 1: Rewrite daily-view.tsx**

Replace the entire content of `src/components/views/daily-view.tsx`:

```typescript
'use client';

import { isSameDay } from '@/lib/date-utils';
import { DailySidebar } from '@/components/daily/daily-sidebar';
import { DailyTimeline } from '@/components/daily/daily-timeline';
import type { ExpandedEvent } from '@/types/event';

interface DailyViewProps {
  events: ExpandedEvent[];
  currentDate: Date;
  onEventClick: (event: ExpandedEvent) => void;
  onEmptyClick: (date?: Date, hour?: number) => void;
}

export function DailyView({ events, currentDate, onEventClick, onEmptyClick }: DailyViewProps) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.start), currentDate))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="flex gap-4 h-full max-md:flex-col max-md:overflow-y-auto">
      <DailySidebar />
      <DailyTimeline
        events={dayEvents}
        currentDate={currentDate}
        onEventClick={onEventClick}
        onAddEvent={onEmptyClick}
      />
    </div>
  );
}
```

**Step 2: No changes needed to CalendarShell**

The `DailyView` interface (`events`, `currentDate`, `onEventClick`, `onEmptyClick`) is unchanged, so `calendar-shell.tsx` needs no modification. The `viewProps` spread in line 108 already passes everything `DailyView` needs.

**Step 3: Run dev server and verify**

Run: `npm run dev`

- Navigate to daily view
- Confirm two-panel layout renders
- Confirm left sidebar shows quote, habit tracker, weather
- Confirm right panel shows timeline with events
- Confirm clicking an event opens EventViewCard
- Confirm "+ Add Event" opens EventModal
- Confirm current-time indicator shows on today

**Step 4: Commit**

```bash
git add src/components/views/daily-view.tsx
git commit -m "feat: rewrite DailyView with two-panel layout (sidebar + timeline)"
```

---

### Task 11: Visual Polish & Edge Cases

**Files:**
- Modify: `src/components/daily/daily-timeline.tsx` (if needed)
- Modify: `src/components/daily/daily-sidebar.tsx` (if needed)

**Step 1: Verify and fix visual alignment**

- Check that the timeline line and dots align vertically
- Check that past events are dimmed correctly
- Check that the current-time line position is accurate
- Check responsive layout at < 768px (sidebar stacks above)
- Ensure scrollbar styling matches the rest of the app

**Step 2: Verify habit tracker CRUD**

- Add a habit via the "+" button
- Toggle completion on/off
- Delete a habit (hover to reveal X)
- Refresh page — habits persist

**Step 3: Verify weather**

- Allow geolocation → weather loads
- Deny geolocation → error message shows
- Refresh within 30 min → uses cached data

**Step 4: Commit any fixes**

```bash
git add -u
git commit -m "style: polish daily view layout and fix edge cases"
```
