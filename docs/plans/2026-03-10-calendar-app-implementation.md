# Calendar App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-only calendar web app with yearly, monthly, weekly, and daily views, waterfall overlap layout, drag-and-drop, search, and dark mode.

**Architecture:** Flask backend serves a REST API for CRUD operations on events stored in a local JSON file. Vanilla JS frontend renders four calendar views with event blocks on a blank canvas. Recurring events are stored once and expanded client-side.

**Tech Stack:** Python/Flask, Vanilla HTML/CSS/JS, JSON file storage

---

## Task 1: Project Scaffold & Flask Server

**Files:**
- Create: `server/app.py`
- Create: `server/requirements.txt`
- Create: `server/data/events.json`

**Step 1: Create requirements.txt**

```
flask==3.1.*
flask-cors==5.0.*
```

**Step 2: Create empty events JSON**

```json
[]
```

**Step 3: Write Flask app with CRUD API**

```python
import json
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

DATA_FILE = Path(__file__).parent / 'data' / 'events.json'


def read_events():
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)


def write_events(events):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(events, f, indent=2)


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/events', methods=['GET'])
def get_events():
    events = read_events()
    start = request.args.get('start')
    end = request.args.get('end')
    if start and end:
        events = [e for e in events if e['end'] >= start and e['start'] <= end]
    return jsonify(events)


@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id):
    events = read_events()
    event = next((e for e in events if e['id'] == event_id), None)
    if not event:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(event)


@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.get_json()
    data['id'] = str(uuid.uuid4())
    events = read_events()
    events.append(data)
    write_events(events)
    return jsonify(data), 201


@app.route('/api/events/<event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.get_json()
    events = read_events()
    for i, e in enumerate(events):
        if e['id'] == event_id:
            data['id'] = event_id
            events[i] = data
            write_events(events)
            return jsonify(data)
    return jsonify({'error': 'Not found'}), 404


@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    events = read_events()
    events = [e for e in events if e['id'] != event_id]
    write_events(events)
    return jsonify({'success': True})


@app.route('/api/events/search', methods=['GET'])
def search_events():
    q = request.args.get('q', '').lower()
    events = read_events()
    results = [e for e in events if
               q in e.get('title', '').lower() or
               q in e.get('description', '').lower() or
               q in e.get('location', '').lower() or
               q in e.get('category', '').lower()]
    return jsonify(results)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

**Step 4: Install dependencies and verify server starts**

Run:
```bash
cd calendar-app/server
pip install -r requirements.txt
python app.py
```
Expected: Server running on http://localhost:5000

**Step 5: Test API with curl**

Run:
```bash
curl -X POST http://localhost:5000/api/events -H "Content-Type: application/json" -d '{"title":"Test","start":"2026-03-10T10:00:00","end":"2026-03-10T11:00:00","color":"#4A90D9","category":"Work","description":"","location":"","recurrence":null}'
curl http://localhost:5000/api/events
```
Expected: Event created and listed

**Step 6: Commit**

```bash
git add server/
git commit -m "feat: add Flask server with CRUD API and JSON storage"
```

---z

## Task 2: Frontend Shell — HTML, Navigation & App State

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/css/style.css`
- Create: `frontend/css/dark.css`
- Create: `frontend/js/app.js`
- Create: `frontend/js/api.js`

**Step 1: Create index.html**

Single page with:
- Top nav bar: view switcher buttons (Year / Month / Week / Day), date nav arrows, "Today" button, search input, dark mode toggle
- Main content area (`<div id="calendar">`) where views render
- Script tags for all JS modules (loaded as ES modules)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/dark.css" id="dark-theme" disabled>
</head>
<body>
    <nav id="navbar">
        <div class="nav-left">
            <button id="btn-today">Today</button>
            <button id="btn-prev">&larr;</button>
            <button id="btn-next">&rarr;</button>
            <span id="nav-title"></span>
        </div>
        <div class="nav-center">
            <button class="view-btn" data-view="yearly">Year</button>
            <button class="view-btn" data-view="monthly">Month</button>
            <button class="view-btn" data-view="weekly">Week</button>
            <button class="view-btn" data-view="daily">Day</button>
        </div>
        <div class="nav-right">
            <input type="text" id="search-input" placeholder="Search...">
            <button id="btn-dark-mode">&#9789;</button>
        </div>
    </nav>
    <main id="calendar"></main>

    <div id="event-modal" class="modal hidden">
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <form id="event-form">
                <input type="hidden" id="form-id">
                <input type="hidden" id="form-recurrence-parent">
                <label>Title<input type="text" id="form-title" required></label>
                <label>Start<input type="datetime-local" id="form-start" required></label>
                <label>End<input type="datetime-local" id="form-end" required></label>
                <label>Description<textarea id="form-description"></textarea></label>
                <label>Location<input type="text" id="form-location"></label>
                <label>Category<input type="text" id="form-category"></label>
                <label>Color<input type="color" id="form-color" value="#4A90D9"></label>
                <fieldset id="recurrence-fieldset">
                    <legend>Recurrence</legend>
                    <label>Type
                        <select id="form-rec-type">
                            <option value="">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </label>
                    <label>Interval<input type="number" id="form-rec-interval" min="1" value="1"></label>
                    <label>End Date<input type="date" id="form-rec-end"></label>
                    <div id="days-of-week" class="hidden">
                        <label><input type="checkbox" value="0">Sun</label>
                        <label><input type="checkbox" value="1">Mon</label>
                        <label><input type="checkbox" value="2">Tue</label>
                        <label><input type="checkbox" value="3">Wed</label>
                        <label><input type="checkbox" value="4">Thu</label>
                        <label><input type="checkbox" value="5">Fri</label>
                        <label><input type="checkbox" value="6">Sat</label>
                    </div>
                </fieldset>
                <div class="form-actions">
                    <button type="submit" id="btn-save">Save</button>
                    <button type="button" id="btn-delete" class="hidden">Delete</button>
                </div>
            </form>
        </div>
    </div>

    <script type="module" src="/js/app.js"></script>
</body>
</html>
```

**Step 2: Create api.js — API client**

```javascript
const API_BASE = '/api';

export async function fetchEvents(start, end) {
    const params = start && end ? `?start=${start}&end=${end}` : '';
    const res = await fetch(`${API_BASE}/events${params}`);
    return res.json();
}

export async function fetchEvent(id) {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return res.json();
}

export async function createEvent(event) {
    const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });
    return res.json();
}

export async function updateEvent(id, event) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });
    return res.json();
}

export async function deleteEvent(id) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE'
    });
    return res.json();
}

export async function searchEvents(query) {
    const res = await fetch(`${API_BASE}/events/search?q=${encodeURIComponent(query)}`);
    return res.json();
}
```

**Step 3: Create app.js — Main app state and routing**

```javascript
import { fetchEvents, createEvent, updateEvent, deleteEvent, searchEvents } from './api.js';
import { renderYearly } from './views/yearly.js';
import { renderMonthly } from './views/monthly.js';
import { renderWeekly } from './views/weekly.js';
import { renderDaily } from './views/daily.js';
import { expandRecurrences } from './utils/recurrence.js';

const state = {
    view: 'monthly',
    currentDate: new Date(),
    events: [],
    searchQuery: ''
};

const views = { yearly: renderYearly, monthly: renderMonthly, weekly: renderWeekly, daily: renderDaily };

export function getState() { return state; }

export function navigate(view, date) {
    if (view) state.view = view;
    if (date) state.currentDate = new Date(date);
    render();
}

export async function loadEvents() {
    const raw = await fetchEvents();
    state.events = expandRecurrences(raw, state.currentDate, state.view);
    render();
}

function render() {
    updateNavTitle();
    updateActiveViewButton();
    const container = document.getElementById('calendar');
    container.innerHTML = '';
    views[state.view](container, state);
}

function updateNavTitle() {
    const d = state.currentDate;
    const title = document.getElementById('nav-title');
    const opts = { yearly: d.getFullYear(), monthly: `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`, weekly: `Week of ${d.toLocaleDateString()}`, daily: d.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) };
    title.textContent = opts[state.view];
}

function updateActiveViewButton() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === state.view);
    });
}

function setupNavigation() {
    document.getElementById('btn-today').addEventListener('click', () => navigate(null, new Date()));
    document.getElementById('btn-prev').addEventListener('click', () => stepDate(-1));
    document.getElementById('btn-next').addEventListener('click', () => stepDate(1));
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => navigate(btn.dataset.view));
    });
}

function stepDate(direction) {
    const d = new Date(state.currentDate);
    switch (state.view) {
        case 'yearly': d.setFullYear(d.getFullYear() + direction); break;
        case 'monthly': d.setMonth(d.getMonth() + direction); break;
        case 'weekly': d.setDate(d.getDate() + 7 * direction); break;
        case 'daily': d.setDate(d.getDate() + direction); break;
    }
    navigate(null, d);
}

function setupDarkMode() {
    const btn = document.getElementById('btn-dark-mode');
    const link = document.getElementById('dark-theme');
    if (localStorage.getItem('darkMode') === 'true') link.disabled = false;
    btn.addEventListener('click', () => {
        link.disabled = !link.disabled;
        localStorage.setItem('darkMode', !link.disabled);
    });
}

function setupSearch() {
    const input = document.getElementById('search-input');
    let timeout;
    input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            state.searchQuery = input.value;
            if (input.value) {
                state.events = await searchEvents(input.value);
            } else {
                await loadEvents();
            }
            render();
        }, 300);
    });
}

// Event form setup handled by components/eventForm.js
export { createEvent, updateEvent, deleteEvent };

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupDarkMode();
    setupSearch();
    loadEvents();
});
```

**Step 4: Create stub CSS files**

`css/style.css` — base layout and light theme:
- Nav bar fixed top, flexbox
- Calendar main area below nav
- Modal styles (centered overlay)
- Event block base styles (position: absolute, border-radius, padding)

`css/dark.css` — dark overrides:
- Dark background, light text
- Adjusted event block colors

**Step 5: Verify the shell loads**

Run: `python server/app.py`, open http://localhost:5000
Expected: Page loads with nav bar, empty calendar area, buttons work (no views rendered yet)

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: add frontend shell with navigation, API client, and app state"
```

---

## Task 3: Utility Modules — Date Helpers, Recurrence, Overlap

**Files:**
- Create: `frontend/js/utils/dateUtils.js`
- Create: `frontend/js/utils/recurrence.js`
- Create: `frontend/js/utils/overlap.js`

**Step 1: Create dateUtils.js**

```javascript
export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

export function formatTime(date) {
    return date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
}

export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
```

**Step 2: Create recurrence.js**

Expand recurring events into individual occurrences within a date range based on the current view.

```javascript
export function expandRecurrences(events, currentDate, view) {
    const { start, end } = getViewRange(currentDate, view);
    const expanded = [];

    for (const event of events) {
        if (!event.recurrence) {
            expanded.push(event);
            continue;
        }

        const occurrences = generateOccurrences(event, start, end);
        expanded.push(...occurrences);
    }
    return expanded;
}

function getViewRange(date, view) {
    const d = new Date(date);
    let start, end;
    switch (view) {
        case 'yearly':
            start = new Date(d.getFullYear(), 0, 1);
            end = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
            break;
        case 'monthly':
            start = new Date(d.getFullYear(), d.getMonth(), 1);
            end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            break;
        case 'weekly':
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(d.getFullYear(), d.getMonth(), diff);
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59);
            break;
        case 'daily':
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            break;
    }
    return { start, end };
}

function generateOccurrences(event, rangeStart, rangeEnd) {
    const occurrences = [];
    const rec = event.recurrence;
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const duration = eventEnd - eventStart;
    const recEnd = rec.endDate ? new Date(rec.endDate) : rangeEnd;
    const limit = Math.min(rangeEnd, recEnd);

    let current = new Date(eventStart);

    while (current <= limit) {
        if (current >= rangeStart || new Date(current.getTime() + duration) >= rangeStart) {
            if (rec.type === 'weekly' && rec.daysOfWeek) {
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

function advanceDate(date, rec) {
    const d = new Date(date);
    switch (rec.type) {
        case 'daily': d.setDate(d.getDate() + rec.interval); break;
        case 'weekly':
            if (rec.daysOfWeek) {
                d.setDate(d.getDate() + 1);
                // After cycling through a week, skip by interval
            } else {
                d.setDate(d.getDate() + 7 * rec.interval);
            }
            break;
        case 'monthly': d.setMonth(d.getMonth() + rec.interval); break;
        case 'yearly': d.setFullYear(d.getFullYear() + rec.interval); break;
    }
    return d;
}

function makeOccurrence(event, start, duration) {
    return {
        ...event,
        id: event.id,
        originalId: event.id,
        start: start.toISOString().slice(0, 19),
        end: new Date(start.getTime() + duration).toISOString().slice(0, 19),
        isOccurrence: true
    };
}
```

**Step 3: Create overlap.js — Waterfall layout calculator**

```javascript
export function calculateOverlapLayout(events) {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) =>
        new Date(a.start) - new Date(b.start) || new Date(b.end) - new Date(a.end)
    );

    // Find connected overlap groups
    const groups = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const groupEnd = Math.max(...currentGroup.map(e => new Date(e.end).getTime()));
        if (new Date(sorted[i].start).getTime() < groupEnd) {
            currentGroup.push(sorted[i]);
        } else {
            groups.push(currentGroup);
            currentGroup = [sorted[i]];
        }
    }
    groups.push(currentGroup);

    // Assign columns within each group
    const layout = [];
    for (const group of groups) {
        const columns = [];
        for (const event of group) {
            let placed = false;
            for (let col = 0; col < columns.length; col++) {
                const lastInCol = columns[col][columns[col].length - 1];
                if (new Date(event.start).getTime() >= new Date(lastInCol.end).getTime()) {
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
        // Set totalColumns for all events in this group
        for (const item of layout) {
            if (group.includes(item.event)) {
                item.totalColumns = columns.length;
            }
        }
    }
    return layout;
}
```

**Step 4: Commit**

```bash
git add frontend/js/utils/
git commit -m "feat: add date utilities, recurrence expansion, and overlap layout calculator"
```

---

## Task 4: Daily View

**Files:**
- Create: `frontend/js/views/daily.js`

**Step 1: Implement daily view renderer**

Renders a blank canvas with event blocks positioned by time. Uses overlap.js for waterfall layout.

```javascript
import { isSameDay, formatTime, startOfDay } from '../utils/dateUtils.js';
import { calculateOverlapLayout } from '../utils/overlap.js';

export function renderDaily(container, state) {
    const dayEvents = state.events.filter(e =>
        isSameDay(new Date(e.start), state.currentDate)
    );

    const wrapper = document.createElement('div');
    wrapper.className = 'daily-view';

    if (dayEvents.length === 0) {
        wrapper.classList.add('empty-day');
        wrapper.addEventListener('click', (e) => {
            if (e.target === wrapper) {
                const clickY = e.offsetY;
                const hour = Math.floor((clickY / wrapper.clientHeight) * 24);
                openEventForm(state.currentDate, hour);
            }
        });
        container.appendChild(wrapper);
        return;
    }

    const layout = calculateOverlapLayout(dayEvents);
    const dayStart = startOfDay(state.currentDate).getTime();
    const msPerDay = 24 * 60 * 60 * 1000;

    for (const { event, column, totalColumns } of layout) {
        const eStart = new Date(event.start).getTime();
        const eEnd = new Date(event.end).getTime();
        const topPercent = ((eStart - dayStart) / msPerDay) * 100;
        const heightPercent = ((eEnd - eStart) / msPerDay) * 100;
        const widthPercent = 100 / totalColumns;
        const leftPercent = column * widthPercent;

        const block = document.createElement('div');
        block.className = 'event-block';
        block.style.cssText = `
            position: absolute;
            top: ${topPercent}%;
            height: ${heightPercent}%;
            left: ${leftPercent}%;
            width: ${widthPercent}%;
            background-color: ${event.color || '#4A90D9'};
        `;
        block.dataset.eventId = event.id;

        block.innerHTML = `
            <span class="event-time">${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}</span>
            <span class="event-title">${event.title}</span>
        `;

        block.addEventListener('click', () => openEventForm(null, null, event));
        wrapper.appendChild(block);
    }

    // Click empty space to create event
    wrapper.addEventListener('click', (e) => {
        if (e.target === wrapper) {
            const clickY = e.offsetY;
            const hour = Math.floor((clickY / wrapper.clientHeight) * 24);
            openEventForm(state.currentDate, hour);
        }
    });

    container.appendChild(wrapper);
}

function openEventForm(date, hour, event = null) {
    window.dispatchEvent(new CustomEvent('open-event-form', {
        detail: { date, hour, event }
    }));
}
```

**Step 2: Verify daily view renders with test event**

Run server, create a test event via API, navigate to daily view.
Expected: Event block appears positioned by time.

**Step 3: Commit**

```bash
git add frontend/js/views/daily.js
git commit -m "feat: add daily view with waterfall overlap layout"
```

---

## Task 5: Weekly View

**Files:**
- Create: `frontend/js/views/weekly.js`

**Step 1: Implement weekly view renderer**

7 columns (Mon–Sun). Event blocks positioned vertically by time within each day column. Waterfall layout per day.

```javascript
import { getMonday, isSameDay, formatTime, startOfDay } from '../utils/dateUtils.js';
import { calculateOverlapLayout } from '../utils/overlap.js';
import { navigate } from '../app.js';

export function renderWeekly(container, state) {
    const monday = getMonday(state.currentDate);
    const wrapper = document.createElement('div');
    wrapper.className = 'weekly-view';

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);

        const col = document.createElement('div');
        col.className = 'week-day-column';

        const header = document.createElement('div');
        header.className = 'week-day-header';
        header.textContent = day.toLocaleDateString('default', { weekday: 'short', day: 'numeric' });
        header.addEventListener('click', () => navigate('daily', day));
        col.appendChild(header);

        const dayBody = document.createElement('div');
        dayBody.className = 'week-day-body';

        const dayEvents = state.events.filter(e => isSameDay(new Date(e.start), day));

        if (dayEvents.length > 0) {
            const layout = calculateOverlapLayout(dayEvents);
            const dayStart = startOfDay(day).getTime();
            const msPerDay = 24 * 60 * 60 * 1000;

            for (const { event, column, totalColumns } of layout) {
                const eStart = new Date(event.start).getTime();
                const eEnd = new Date(event.end).getTime();
                const topPercent = ((eStart - dayStart) / msPerDay) * 100;
                const heightPercent = ((eEnd - eStart) / msPerDay) * 100;
                const widthPercent = 100 / totalColumns;
                const leftPercent = column * widthPercent;

                const block = document.createElement('div');
                block.className = 'event-block';
                block.style.cssText = `
                    position: absolute;
                    top: ${topPercent}%;
                    height: ${heightPercent}%;
                    left: ${leftPercent}%;
                    width: ${widthPercent}%;
                    background-color: ${event.color || '#4A90D9'};
                `;
                block.dataset.eventId = event.id;
                block.innerHTML = `<span class="event-title">${event.title}</span>`;
                block.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('open-event-form', {
                        detail: { event }
                    }));
                });
                dayBody.appendChild(block);
            }
        }

        dayBody.addEventListener('click', (e) => {
            if (e.target === dayBody) {
                const hour = Math.floor((e.offsetY / dayBody.clientHeight) * 24);
                window.dispatchEvent(new CustomEvent('open-event-form', {
                    detail: { date: day, hour }
                }));
            }
        });

        col.appendChild(dayBody);
        wrapper.appendChild(col);
    }

    container.appendChild(wrapper);
}
```

**Step 2: Verify weekly view**

Expected: 7 columns with day headers, event blocks positioned within each day.

**Step 3: Commit**

```bash
git add frontend/js/views/weekly.js
git commit -m "feat: add weekly view with day columns and waterfall layout"
```

---

## Task 6: Monthly View

**Files:**
- Create: `frontend/js/views/monthly.js`

**Step 1: Implement monthly view renderer**

Month grid with day numbers. Left column shows week numbers (W1–W53). Click week number → weekly view. Click day → daily view.

```javascript
import { getWeekNumber, getDaysInMonth, isSameDay } from '../utils/dateUtils.js';
import { navigate } from '../app.js';

export function renderMonthly(container, state) {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday start

    const wrapper = document.createElement('div');
    wrapper.className = 'monthly-view';

    // Day-of-week header row
    const headerRow = document.createElement('div');
    headerRow.className = 'month-header-row';
    headerRow.innerHTML = '<div class="week-num-header">Wk</div>';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => {
        const cell = document.createElement('div');
        cell.className = 'month-header-cell';
        cell.textContent = d;
        headerRow.appendChild(cell);
    });
    wrapper.appendChild(headerRow);

    // Build weeks
    let dayCounter = 1;
    const totalCells = startOffset + daysInMonth;
    const rows = Math.ceil(totalCells / 7);

    for (let row = 0; row < rows; row++) {
        const weekRow = document.createElement('div');
        weekRow.className = 'month-week-row';

        // Week number cell
        const firstDayOfRow = new Date(year, month, dayCounter - (row === 0 ? 0 : 0));
        if (dayCounter <= daysInMonth) {
            const actualDay = row === 0 ? 1 : dayCounter;
            const weekDate = new Date(year, month, actualDay);
            const weekNum = getWeekNumber(weekDate);
            const wnCell = document.createElement('div');
            wnCell.className = 'week-num-cell';
            wnCell.textContent = `W${weekNum}`;
            wnCell.addEventListener('click', () => navigate('weekly', weekDate));
            weekRow.appendChild(wnCell);
        } else {
            const wnCell = document.createElement('div');
            wnCell.className = 'week-num-cell';
            weekRow.appendChild(wnCell);
        }

        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'month-day-cell';

            const cellIndex = row * 7 + col;
            if (cellIndex >= startOffset && dayCounter <= daysInMonth) {
                const date = new Date(year, month, dayCounter);
                cell.innerHTML = `<span class="day-number">${dayCounter}</span>`;

                // Add event indicators
                const dayEvents = state.events.filter(e => isSameDay(new Date(e.start), date));
                if (dayEvents.length > 0) {
                    const eventsContainer = document.createElement('div');
                    eventsContainer.className = 'month-events';
                    dayEvents.slice(0, 3).forEach(e => {
                        const indicator = document.createElement('div');
                        indicator.className = 'month-event-indicator';
                        indicator.style.backgroundColor = e.color || '#4A90D9';
                        indicator.textContent = e.title;
                        eventsContainer.appendChild(indicator);
                    });
                    if (dayEvents.length > 3) {
                        const more = document.createElement('div');
                        more.className = 'month-event-more';
                        more.textContent = `+${dayEvents.length - 3} more`;
                        eventsContainer.appendChild(more);
                    }
                    cell.appendChild(eventsContainer);
                }

                const d = dayCounter;
                cell.addEventListener('click', () => navigate('daily', new Date(year, month, d)));
                dayCounter++;
            } else {
                cell.classList.add('empty');
            }

            weekRow.appendChild(cell);
        }

        wrapper.appendChild(weekRow);
    }

    container.appendChild(wrapper);
}
```

**Step 2: Verify monthly view**

Expected: Month grid with week numbers on left, day cells with event indicators.

**Step 3: Commit**

```bash
git add frontend/js/views/monthly.js
git commit -m "feat: add monthly view with week numbers and drill-down navigation"
```

---

## Task 7: Yearly View

**Files:**
- Create: `frontend/js/views/yearly.js`

**Step 1: Implement yearly view renderer**

12 mini month grids in 4x3 layout. Days with events get colored dots with heat intensity.

```javascript
import { getDaysInMonth, isSameDay } from '../utils/dateUtils.js';
import { navigate } from '../app.js';

export function renderYearly(container, state) {
    const year = state.currentDate.getFullYear();
    const wrapper = document.createElement('div');
    wrapper.className = 'yearly-view';

    for (let month = 0; month < 12; month++) {
        const miniMonth = document.createElement('div');
        miniMonth.className = 'mini-month';

        const title = document.createElement('div');
        title.className = 'mini-month-title';
        title.textContent = new Date(year, month).toLocaleString('default', { month: 'long' });
        title.addEventListener('click', () => navigate('monthly', new Date(year, month, 1)));
        miniMonth.appendChild(title);

        // Day-of-week headers
        const dayHeaders = document.createElement('div');
        dayHeaders.className = 'mini-month-headers';
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
            const h = document.createElement('span');
            h.textContent = d;
            dayHeaders.appendChild(h);
        });
        miniMonth.appendChild(dayHeaders);

        // Days grid
        const grid = document.createElement('div');
        grid.className = 'mini-month-grid';
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < startOffset; i++) {
            const empty = document.createElement('span');
            empty.className = 'mini-day empty';
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayEl = document.createElement('span');
            dayEl.className = 'mini-day';
            dayEl.textContent = day;

            const dayEvents = state.events.filter(e => isSameDay(new Date(e.start), date));
            if (dayEvents.length > 0) {
                dayEl.classList.add('has-events');
                // Heat intensity: more events = more opaque
                const intensity = Math.min(dayEvents.length / 5, 1);
                const dotColor = dayEvents[0].color || '#4A90D9';
                dayEl.style.setProperty('--dot-color', dotColor);
                dayEl.style.setProperty('--dot-opacity', 0.3 + intensity * 0.7);
            }

            grid.appendChild(dayEl);
        }

        miniMonth.appendChild(grid);
        wrapper.appendChild(miniMonth);
    }

    container.appendChild(wrapper);
}
```

**Step 2: Verify yearly view**

Expected: 4x3 grid of mini months, dots on days with events.

**Step 3: Commit**

```bash
git add frontend/js/views/yearly.js
git commit -m "feat: add yearly view with mini month grids and event heat dots"
```

---

## Task 8: Event Form Component

**Files:**
- Create: `frontend/js/components/eventForm.js`

**Step 1: Implement event form — create, edit, delete with recurrence prompts**

```javascript
import { createEvent, updateEvent, deleteEvent, loadEvents } from '../app.js';

export function setupEventForm() {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const closeBtn = modal.querySelector('.modal-close');
    const deleteBtn = document.getElementById('btn-delete');
    const recTypeSelect = document.getElementById('form-rec-type');
    const daysOfWeekDiv = document.getElementById('days-of-week');

    recTypeSelect.addEventListener('change', () => {
        daysOfWeekDiv.classList.toggle('hidden', recTypeSelect.value !== 'weekly');
    });

    window.addEventListener('open-event-form', (e) => {
        const { date, hour, event } = e.detail;
        resetForm();

        if (event) {
            // Edit mode
            document.getElementById('form-id').value = event.id;
            document.getElementById('form-title').value = event.title;
            document.getElementById('form-start').value = event.start.slice(0, 16);
            document.getElementById('form-end').value = event.end.slice(0, 16);
            document.getElementById('form-description').value = event.description || '';
            document.getElementById('form-location').value = event.location || '';
            document.getElementById('form-category').value = event.category || '';
            document.getElementById('form-color').value = event.color || '#4A90D9';

            if (event.recurrence) {
                recTypeSelect.value = event.recurrence.type;
                document.getElementById('form-rec-interval').value = event.recurrence.interval;
                document.getElementById('form-rec-end').value = event.recurrence.endDate || '';
                if (event.recurrence.daysOfWeek) {
                    daysOfWeekDiv.classList.remove('hidden');
                    daysOfWeekDiv.querySelectorAll('input').forEach(cb => {
                        cb.checked = event.recurrence.daysOfWeek.includes(parseInt(cb.value));
                    });
                }
            }
            deleteBtn.classList.remove('hidden');
        } else if (date) {
            // Create mode with pre-filled time
            const start = new Date(date);
            start.setHours(hour || 9, 0, 0);
            const end = new Date(start);
            end.setHours(start.getHours() + 1);
            document.getElementById('form-start').value = toLocalDatetime(start);
            document.getElementById('form-end').value = toLocalDatetime(end);
        }

        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventData = getFormData();
        const id = document.getElementById('form-id').value;

        if (id) {
            const original = document.getElementById('form-recurrence-parent').value;
            if (original) {
                const choice = confirm('Apply to all future events? OK = All, Cancel = This only');
                if (!choice) {
                    eventData.recurrence = null;
                    await createEvent(eventData);
                } else {
                    await updateEvent(id, eventData);
                }
            } else {
                await updateEvent(id, eventData);
            }
        } else {
            await createEvent(eventData);
        }

        modal.classList.add('hidden');
        await loadEvents();
    });

    deleteBtn.addEventListener('click', async () => {
        const id = document.getElementById('form-id').value;
        if (id && confirm('Delete this event?')) {
            await deleteEvent(id);
            modal.classList.add('hidden');
            await loadEvents();
        }
    });
}

function getFormData() {
    const recType = document.getElementById('form-rec-type').value;
    let recurrence = null;
    if (recType) {
        recurrence = {
            type: recType,
            interval: parseInt(document.getElementById('form-rec-interval').value) || 1,
            endDate: document.getElementById('form-rec-end').value || null
        };
        if (recType === 'weekly') {
            recurrence.daysOfWeek = Array.from(
                document.querySelectorAll('#days-of-week input:checked')
            ).map(cb => parseInt(cb.value));
        }
    }
    return {
        title: document.getElementById('form-title').value,
        start: document.getElementById('form-start').value + ':00',
        end: document.getElementById('form-end').value + ':00',
        description: document.getElementById('form-description').value,
        location: document.getElementById('form-location').value,
        category: document.getElementById('form-category').value,
        color: document.getElementById('form-color').value,
        recurrence
    };
}

function resetForm() {
    document.getElementById('event-form').reset();
    document.getElementById('form-id').value = '';
    document.getElementById('form-recurrence-parent').value = '';
    document.getElementById('btn-delete').classList.add('hidden');
    document.getElementById('days-of-week').classList.add('hidden');
    document.getElementById('form-color').value = '#4A90D9';
}

function toLocalDatetime(date) {
    return date.toISOString().slice(0, 16);
}
```

**Step 2: Import and initialize in app.js**

Add to app.js DOMContentLoaded:
```javascript
import { setupEventForm } from './components/eventForm.js';
// In DOMContentLoaded:
setupEventForm();
```

**Step 3: Verify form works**

Click empty space → form opens with pre-filled time. Fill title, save. Event appears.
Click event → form opens in edit mode. Delete works.

**Step 4: Commit**

```bash
git add frontend/js/components/eventForm.js frontend/js/app.js
git commit -m "feat: add event form component with create, edit, delete, and recurrence"
```

---

## Task 9: Drag-and-Drop

**Files:**
- Create: `frontend/js/components/dragDrop.js`

**Step 1: Implement drag to move and resize event blocks**

Works in daily and weekly views. Drag block to move, drag bottom edge to resize duration.

```javascript
import { updateEvent, loadEvents } from '../app.js';

export function setupDragDrop() {
    let dragState = null;

    document.addEventListener('mousedown', (e) => {
        const block = e.target.closest('.event-block');
        if (!block) return;

        const rect = block.getBoundingClientRect();
        const isResize = e.clientY > rect.bottom - 8;

        dragState = {
            eventId: block.dataset.eventId,
            block,
            startX: e.clientX,
            startY: e.clientY,
            isResize,
            originalTop: block.offsetTop,
            originalHeight: block.offsetHeight,
            parentHeight: block.parentElement.clientHeight
        };

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragState) return;

        const deltaY = e.clientY - dragState.startY;

        if (dragState.isResize) {
            const newHeight = Math.max(20, dragState.originalHeight + deltaY);
            dragState.block.style.height = `${(newHeight / dragState.parentHeight) * 100}%`;
        } else {
            const newTop = dragState.originalTop + deltaY;
            dragState.block.style.top = `${(newTop / dragState.parentHeight) * 100}%`;
        }
    });

    document.addEventListener('mouseup', async (e) => {
        if (!dragState) return;

        const { eventId, block, isResize, parentHeight } = dragState;
        const topPercent = parseFloat(block.style.top) / 100;
        const heightPercent = parseFloat(block.style.height) / 100;

        // Convert percentages to hours
        const newStartHour = topPercent * 24;
        const newDurationHours = heightPercent * 24;

        // Fetch event, compute new times
        const res = await fetch(`/api/events/${eventId}`);
        const event = await res.json();

        const oldStart = new Date(event.start);
        if (isResize) {
            const newEnd = new Date(oldStart);
            newEnd.setHours(oldStart.getHours(), oldStart.getMinutes() + newDurationHours * 60);
            event.end = newEnd.toISOString().slice(0, 19);
        } else {
            const newStart = new Date(oldStart);
            newStart.setHours(Math.floor(newStartHour), (newStartHour % 1) * 60, 0);
            const duration = new Date(event.end) - new Date(event.start);
            event.start = newStart.toISOString().slice(0, 19);
            event.end = new Date(newStart.getTime() + duration).toISOString().slice(0, 19);
        }

        await updateEvent(eventId, event);
        await loadEvents();
        dragState = null;
    });
}
```

**Step 2: Import and initialize in app.js**

```javascript
import { setupDragDrop } from './components/dragDrop.js';
// In DOMContentLoaded:
setupDragDrop();
```

**Step 3: Verify drag-and-drop**

Create event, drag it to new time → event updates. Drag bottom edge → duration changes.

**Step 4: Commit**

```bash
git add frontend/js/components/dragDrop.js frontend/js/app.js
git commit -m "feat: add drag-and-drop for moving and resizing events"
```

---

## Task 10: Search Component

**Files:**
- Create: `frontend/js/components/search.js`

**Step 1: Implement search highlighting**

Search is already wired in app.js. This module adds visual highlighting of matching events.

```javascript
export function highlightSearchResults(container, query) {
    if (!query) {
        container.querySelectorAll('.event-block').forEach(b => b.classList.remove('search-highlight'));
        return;
    }

    const q = query.toLowerCase();
    container.querySelectorAll('.event-block').forEach(block => {
        const title = block.querySelector('.event-title')?.textContent?.toLowerCase() || '';
        if (title.includes(q)) {
            block.classList.add('search-highlight');
        } else {
            block.classList.remove('search-highlight');
        }
    });
}
```

**Step 2: Commit**

```bash
git add frontend/js/components/search.js
git commit -m "feat: add search highlighting for event blocks"
```

---

## Task 11: CSS — Light Theme, Dark Mode, Layout

**Files:**
- Create: `frontend/css/style.css`
- Create: `frontend/css/dark.css`

**Step 1: Write style.css**

Complete styles for:
- Nav bar (fixed, flexbox, buttons)
- Calendar views (yearly grid, monthly grid, weekly columns, daily column)
- Event blocks (absolute positioning, rounded, colored, shadows)
- Modal form (centered overlay)
- Waterfall layout support
- Mini month grids (yearly view)
- Week number cells
- Event dot indicators with `--dot-color` and `--dot-opacity` CSS variables
- Search highlight (outline/glow)
- Responsive sizing

**Step 2: Write dark.css**

Dark overrides:
- `body` dark background (#1a1a2e), light text (#e0e0e0)
- Nav bar darker shade
- Event blocks with lighter text
- Modal dark background
- Adjusted borders and shadows

**Step 3: Verify both themes**

Toggle dark mode button. All views should look correct in both themes.

**Step 4: Commit**

```bash
git add frontend/css/
git commit -m "feat: add light and dark theme styles for all views"
```

---

## Task 12: Integration Testing & Polish

**Step 1: End-to-end walkthrough**

1. Start server: `python server/app.py`
2. Open http://localhost:5000
3. Create an event in daily view
4. Verify it appears in weekly, monthly, yearly views
5. Create a recurring weekly event
6. Verify occurrences expand across views
7. Drag an event to a new time
8. Search for an event by title
9. Toggle dark mode
10. Navigate: Year → click month → click week number → click day

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: calendar app complete with all views, recurrence, drag-drop, search, dark mode"
```
