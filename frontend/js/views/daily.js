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
