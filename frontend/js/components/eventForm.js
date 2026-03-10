import { createEvent, updateEvent, deleteEvent } from '../api.js';

export function setupEventForm(loadEvents) {
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

            if (event.isOccurrence) {
                document.getElementById('form-recurrence-parent').value = event.originalId;
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
            const isOccurrence = document.getElementById('form-recurrence-parent').value;
            if (isOccurrence) {
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
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
