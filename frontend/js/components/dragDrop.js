import { updateEvent } from '../api.js';

export function setupDragDrop(loadEvents) {
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

        const newStartHour = topPercent * 24;
        const newDurationHours = heightPercent * 24;

        try {
            const res = await fetch(`/api/events/${eventId}`);
            const event = await res.json();

            const oldStart = new Date(event.start);
            if (isResize) {
                const newEnd = new Date(oldStart);
                newEnd.setMinutes(oldStart.getMinutes() + newDurationHours * 60);
                event.end = newEnd.toISOString().slice(0, 19);
            } else {
                const newStart = new Date(oldStart);
                newStart.setHours(Math.floor(newStartHour), Math.round((newStartHour % 1) * 60), 0);
                const duration = new Date(event.end) - new Date(event.start);
                event.start = newStart.toISOString().slice(0, 19);
                event.end = new Date(newStart.getTime() + duration).toISOString().slice(0, 19);
            }

            await updateEvent(eventId, event);
            await loadEvents();
        } catch (err) {
            console.error('Drag-drop update failed:', err);
            await loadEvents();
        }

        dragState = null;
    });
}
