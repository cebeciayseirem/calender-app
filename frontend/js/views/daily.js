import { isSameDay, formatTime } from '../utils/dateUtils.js';

export function renderDaily(container, state) {
    const dayEvents = state.events
        .filter(e => isSameDay(new Date(e.start), state.currentDate))
        .sort((a, b) => new Date(a.start) - new Date(b.start));

    const wrapper = document.createElement('div');
    wrapper.className = 'daily-view';

    // Group events into rows: overlapping events go in the same row (horizontal),
    // non-overlapping events go in separate rows (vertical)
    const rows = [];
    for (const event of dayEvents) {
        const eStart = new Date(event.start).getTime();
        const eEnd = new Date(event.end).getTime();

        let placed = false;
        for (const row of rows) {
            const overlaps = row.some(other => {
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

    for (const row of rows) {
        const rowEl = document.createElement('div');
        rowEl.className = row.length > 1 ? 'daily-row horizontal' : 'daily-row vertical';

        for (const event of row) {
            const note = document.createElement('div');
            note.className = 'post-it';
            note.style.borderLeftColor = event.color || '#4A90D9';

            note.innerHTML = `
                <span class="post-it-time">${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}</span>
                <span class="post-it-title">${event.title}</span>
                ${event.location ? `<span class="post-it-location">${event.location}</span>` : ''}
                ${event.description ? `<span class="post-it-description">${event.description}</span>` : ''}
                ${event.category ? `<span class="post-it-category">${event.category}</span>` : ''}
            `;

            note.addEventListener('click', (e) => {
                e.stopPropagation();
                openEventForm(null, null, event);
            });
            rowEl.appendChild(note);
        }

        wrapper.appendChild(rowEl);
    }

    // Add task FAB button
    const fab = document.createElement('button');
    fab.className = 'fab-add';
    fab.textContent = '+';
    fab.addEventListener('click', () => {
        openEventForm(state.currentDate, 9);
    });
    wrapper.appendChild(fab);

    container.appendChild(wrapper);
}

function openEventForm(date, hour, event = null) {
    window.dispatchEvent(new CustomEvent('open-event-form', {
        detail: { date, hour, event }
    }));
}
