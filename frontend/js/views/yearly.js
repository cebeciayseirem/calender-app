import { getDaysInMonth, isSameDay } from '../utils/dateUtils.js';

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
        title.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'monthly', date: new Date(year, month, 1) } }));
        });
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
