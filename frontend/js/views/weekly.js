import { getMonday, isSameDay, formatTime, startOfDay } from '../utils/dateUtils.js';
import { calculateOverlapLayout } from '../utils/overlap.js';

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
        header.textContent = day.toLocaleDateString('default', { weekday: 'short', day: 'numeric' });
        header.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'daily', date: day } }));
        });
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
