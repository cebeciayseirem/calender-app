import { getMonday, isSameDay, formatTime } from '../utils/dateUtils.js';

export function renderWeekly(container, state) {
    const monday = getMonday(state.currentDate);
    const today = new Date();
    const wrapper = document.createElement('div');
    wrapper.className = 'weekly-view';

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);

        const col = document.createElement('div');
        col.className = 'week-day-column';

        const header = document.createElement('div');
        header.className = 'week-day-header';
        if (isSameDay(day, today)) {
            header.classList.add('today');
        }
        header.textContent = day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
        header.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'daily', date: day } }));
        });
        col.appendChild(header);

        const dayBody = document.createElement('div');
        dayBody.className = 'week-day-body';

        const dayEvents = state.events
            .filter(e => isSameDay(new Date(e.start), day))
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        for (const event of dayEvents) {
            const startTime = formatTime(new Date(event.start));
            const endTime = formatTime(new Date(event.end));

            const block = document.createElement('div');
            block.className = 'event-block week-event-card';
            block.style.backgroundColor = event.color || '#4A90D9';
            block.dataset.eventId = event.id;
            block.innerHTML = `<span class="event-title">${event.title}</span><span class="event-time">${startTime} – ${endTime}</span>`;
            block.addEventListener('click', (e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('open-event-form', {
                    detail: { event }
                }));
            });
            dayBody.appendChild(block);
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

    // Add task FAB button
    const fab = document.createElement('button');
    fab.className = 'fab-add';
    fab.textContent = '+';
    fab.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-event-form', {
            detail: { date: new Date() }
        }));
    });
    wrapper.appendChild(fab);

    container.appendChild(wrapper);
}
