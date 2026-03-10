import { getWeekNumber, getDaysInMonth, isSameDay } from '../utils/dateUtils.js';

export function renderMonthly(container, state) {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const today = new Date();
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
        const firstDayOfRow = row === 0 ? 1 : dayCounter;
        if (firstDayOfRow <= daysInMonth) {
            const weekDate = new Date(year, month, firstDayOfRow);
            const weekNum = getWeekNumber(weekDate);
            const wnCell = document.createElement('div');
            wnCell.className = 'week-num-cell';
            wnCell.textContent = `W${weekNum}`;
            wnCell.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'weekly', date: weekDate } }));
            });
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
                if (isSameDay(date, today)) {
                    cell.classList.add('today');
                }
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
                cell.addEventListener('click', () => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'daily', date: new Date(year, month, d) } }));
                });
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
