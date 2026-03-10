import { fetchEvents, fetchEvent, createEvent, updateEvent, deleteEvent, searchEvents } from './api.js';
import { renderYearly } from './views/yearly.js';
import { renderMonthly } from './views/monthly.js';
import { renderWeekly } from './views/weekly.js';
import { renderDaily } from './views/daily.js';
import { expandRecurrences } from './utils/recurrence.js';
import { toLocalISO } from './utils/dateUtils.js';
import { setupDragDrop } from './components/dragDrop.js';
import { setupEventForm } from './components/eventForm.js';

// Re-export API functions for use by other modules
export { fetchEvents, fetchEvent, createEvent, updateEvent, deleteEvent, searchEvents };

const renderers = {
    yearly: renderYearly,
    monthly: renderMonthly,
    weekly: renderWeekly,
    daily: renderDaily
};

// App state
const state = {
    view: 'monthly',
    currentDate: new Date(),
    events: [],
    searchQuery: ''
};

export function getState() {
    return state;
}

export function navigate(view, date) {
    if (view) state.view = view;
    if (date) state.currentDate = new Date(date);
    render();
}

export async function loadEvents() {
    // Compute date range based on current view
    const d = state.currentDate;
    let start, end;

    switch (state.view) {
        case 'yearly': {
            start = toLocalISO(new Date(d.getFullYear(), 0, 1));
            end = toLocalISO(new Date(d.getFullYear() + 1, 0, 1));
            break;
        }
        case 'monthly': {
            start = toLocalISO(new Date(d.getFullYear(), d.getMonth(), 1));
            end = toLocalISO(new Date(d.getFullYear(), d.getMonth() + 1, 1));
            break;
        }
        case 'weekly': {
            const day = d.getDay();
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - day);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            start = toLocalISO(weekStart);
            end = toLocalISO(weekEnd);
            break;
        }
        case 'daily': {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            start = toLocalISO(dayStart);
            end = toLocalISO(dayEnd);
            break;
        }
    }

    try {
        const raw = await fetchEvents(start, end);
        state.events = expandRecurrences(raw, state.currentDate, state.view);
    } catch (err) {
        console.error('Failed to load events:', err);
        state.events = [];
    }

    render();
}

function updateNavTitle() {
    const el = document.getElementById('nav-title');
    const d = state.currentDate;
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    switch (state.view) {
        case 'yearly':
            el.textContent = d.getFullYear();
            break;
        case 'monthly':
            el.textContent = `${months[d.getMonth()]} ${d.getFullYear()}`;
            break;
        case 'weekly':
        case 'daily':
            el.textContent = d.toLocaleDateString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });
            break;
    }
}

function render() {
    const container = document.getElementById('calendar');
    container.innerHTML = '';
    updateNavTitle();
    updateActiveViewButton();

    const renderer = renderers[state.view];
    if (renderer) {
        renderer(container, state);
    }
}

function updateActiveViewButton() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === state.view);
    });
}

function stepDate(direction) {
    const d = state.currentDate;
    switch (state.view) {
        case 'yearly':
            state.currentDate = new Date(d.getFullYear() + direction, d.getMonth(), d.getDate());
            break;
        case 'monthly':
            state.currentDate = new Date(d.getFullYear(), d.getMonth() + direction, d.getDate());
            break;
        case 'weekly':
            state.currentDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + direction * 7);
            break;
        case 'daily':
            state.currentDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + direction);
            break;
    }
    loadEvents();
}

// Initialise when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // View switcher buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.view = btn.dataset.view;
            loadEvents();
        });
    });

    // Date navigation
    document.getElementById('btn-prev').addEventListener('click', () => stepDate(-1));
    document.getElementById('btn-next').addEventListener('click', () => stepDate(1));
    document.getElementById('btn-today').addEventListener('click', () => {
        state.currentDate = new Date();
        loadEvents();
    });

    // Dark mode toggle
    document.getElementById('btn-dark-mode').addEventListener('click', () => {
        const darkSheet = document.getElementById('dark-theme');
        darkSheet.disabled = !darkSheet.disabled;
        document.body.classList.toggle('dark');
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            state.searchQuery = searchInput.value.trim();
            if (state.searchQuery) {
                try {
                    state.events = await searchEvents(state.searchQuery);
                } catch (err) {
                    console.error('Search failed:', err);
                }
                render();
            } else {
                loadEvents();
            }
        }, 300);
    });

    // Listen for navigate events from views (drill-down)
    window.addEventListener('navigate', (e) => {
        const { view, date } = e.detail;
        if (view) state.view = view;
        if (date) state.currentDate = new Date(date);
        loadEvents();
    });

    // Event form (create/edit/delete)
    setupEventForm(loadEvents);

    // Drag-and-drop for event blocks
    setupDragDrop(loadEvents);

    // Initial render
    loadEvents();
});
