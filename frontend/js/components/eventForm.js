import { createEvent, updateEvent, deleteEvent } from '../api.js';
import { createDatePicker, createTimePicker } from './dateTimePicker.js';

export function setupEventForm(loadEvents) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const cancelBtn = document.getElementById('btn-cancel');
    const deleteBtn = document.getElementById('btn-delete');
    const recTypeSelect = document.getElementById('form-rec-type');
    const daysOfWeekDiv = document.getElementById('days-of-week');

    const formStart = document.getElementById('form-start');
    const formEnd = document.getElementById('form-end');

    // Assemble full datetime into hidden inputs
    function syncHiddenInputs() {
        const date = datePicker.getDate();
        const startTime = startTimePicker.getTime();
        const endTime = endTimePicker.getTime();
        if (date && startTime) {
            formStart.value = toLocalDatetime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), startTime.h, startTime.m));
        }
        if (date && endTime) {
            formEnd.value = toLocalDatetime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), endTime.h, endTime.m));
        }
    }

    // Date picker
    const datePicker = createDatePicker(document.getElementById('date-trigger'), (selectedDate) => {
        syncHiddenInputs();
        // Auto-open start time picker
        startTimePicker.open();
    });

    // Start time picker
    const startTimePicker = createTimePicker(document.getElementById('start-time-trigger'), (h, m) => {
        syncHiddenInputs();
        // Auto-adjust end if needed
        const endTime = endTimePicker.getTime();
        if (!endTime || (endTime.h * 60 + endTime.m) <= (h * 60 + m)) {
            const endH = (h + 1) % 24;
            endTimePicker.setValue(endH, m);
            syncHiddenInputs();
        }
        // Auto-open end time picker
        endTimePicker.open();
    }, { placeholder: 'Start' });

    // End time picker
    const endTimePicker = createTimePicker(document.getElementById('end-time-trigger'), (h, m) => {
        syncHiddenInputs();
    }, {
        placeholder: 'End',
        getMin: () => startTimePicker.getTime()
    });

    // Enter on title opens date picker instead of submitting
    document.getElementById('form-title').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('date-trigger').click();
        }
    });

    // Auto-expand description textarea
    const descEl = document.getElementById('form-description');
    descEl.addEventListener('input', () => {
        descEl.style.height = 'auto';
        descEl.style.height = descEl.scrollHeight + 'px';
    });

    // Enter in description moves to location, Shift+Enter adds newline
    descEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('form-location').focus();
        }
    });

    // Tag-based category selection
    const colorHidden = document.getElementById('form-color');
    const categoryHidden = document.getElementById('form-category');
    const tagColors = {
        'Work':   '#FFA726',
        'Health': '#42a5f5',
        'Errand': '#4caf50',
        'Social': '#ab47bc'
    };
    const tagBtns = document.querySelectorAll('#tag-row .tag-btn');

    function setTag(value) {
        categoryHidden.value = value;
        colorHidden.value = tagColors[value] || '#74d5ff';
        tagBtns.forEach(btn => {
            const isActive = btn.dataset.tag === value;
            btn.classList.toggle('active', isActive);
            if (isActive) {
                btn.style.setProperty('--tag-color', btn.dataset.color);
            }
        });
    }

    tagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle: clicking active tag deselects it
            if (categoryHidden.value === btn.dataset.tag) {
                setTag('');
            } else {
                setTag(btn.dataset.tag);
            }
        });
    });

    // Recurrence — icon row trigger → preset popup → custom modal
    const recPresetModal = document.getElementById('rec-preset-modal');
    const recModal = document.getElementById('recurrence-modal');
    const recTrigger = document.getElementById('rec-trigger');
    const recBackBtn = document.getElementById('rec-back-btn');
    const recModalSave = document.getElementById('rec-modal-save');
    const recRepeatsOnSection = document.getElementById('rec-repeats-on-section');
    const recMonthlyModeSection = document.getElementById('rec-monthly-mode-section');
    const monthlyModeTrigger = document.getElementById('monthly-mode-trigger');
    const monthlyModeOptions = document.getElementById('monthly-mode-options');
    const monthlyModeHidden = document.getElementById('form-rec-monthly-mode');

    const presetLabels = { '': 'Does not repeat', daily: 'Every day', weekly: 'Every week', monthly: 'Every month', yearly: 'Every year' };
    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function getMonthlyOptions() {
        const startVal = formStart.value;
        if (!startVal) return { dayOfMonth: 'Monthly on day 1', nthWeekday: 'Monthly on the first Monday', weekday: 1, nth: 0 };
        const d = new Date(startVal);
        const dom = d.getDate();
        const dow = d.getDay();
        const nth = Math.floor((dom - 1) / 7);
        return {
            dayOfMonth: `Monthly on day ${dom}`,
            nthWeekday: `Monthly on the ${ordinals[nth]} ${dayNames[dow]}`,
            weekday: dow,
            nth
        };
    }

    function buildMonthlyModeOptions() {
        const opts = getMonthlyOptions();
        monthlyModeOptions.innerHTML = '';
        [{ value: 'dayOfMonth', label: opts.dayOfMonth }, { value: 'nthWeekday', label: opts.nthWeekday }].forEach(item => {
            const div = document.createElement('div');
            div.className = 'custom-select-option';
            div.textContent = item.label;
            div.addEventListener('click', () => {
                monthlyModeHidden.value = item.value;
                monthlyModeTrigger.textContent = item.label;
                monthlyModeOptions.classList.add('hidden');
            });
            monthlyModeOptions.appendChild(div);
        });
        const current = monthlyModeHidden.value === 'nthWeekday' ? opts.nthWeekday : opts.dayOfMonth;
        monthlyModeTrigger.textContent = current;
    }

    monthlyModeTrigger.addEventListener('click', () => {
        monthlyModeOptions.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#monthly-mode-dropdown')) {
            monthlyModeOptions.classList.add('hidden');
        }
    });

    function updateRecTriggerLabel() {
        const type = recTypeSelect.value;
        if (!type) {
            recTrigger.textContent = 'Does not repeat';
        } else if (presetLabels[type] && document.getElementById('form-rec-interval').value == 1) {
            recTrigger.textContent = presetLabels[type];
        } else {
            const interval = document.getElementById('form-rec-interval').value;
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            recTrigger.textContent = `Custom: ${label}` + (interval > 1 ? ` (every ${interval})` : '');
        }
    }

    // Clicking the recurrence row opens the preset popup
    document.getElementById('rec-trigger-row').addEventListener('click', () => {
        recPresetModal.classList.remove('hidden');
    });

    // Preset item click
    recPresetModal.querySelectorAll('.rec-preset-item:not(.rec-preset-custom)').forEach(item => {
        item.addEventListener('click', () => {
            const value = item.dataset.value;
            recTypeSelect.value = value;
            document.getElementById('form-rec-interval').value = '1';
            document.querySelector('input[name="rec-end-type"][value="never"]').checked = true;
            document.getElementById('form-rec-end').value = '';
            document.getElementById('form-rec-count').value = '1';
            daysOfWeekDiv.querySelectorAll('input').forEach(cb => cb.checked = false);
            updateRecTriggerLabel();
            recPresetModal.classList.add('hidden');
        });
    });

    // Custom option: close preset popup, open custom modal
    recPresetModal.querySelector('.rec-preset-custom').addEventListener('click', () => {
        recPresetModal.classList.add('hidden');
        if (!recTypeSelect.value) recTypeSelect.value = 'weekly';
        updateRecSections();
        recModal.classList.remove('hidden');
    });

    // Close preset popup on backdrop click
    recPresetModal.addEventListener('click', (e) => {
        if (e.target === recPresetModal) recPresetModal.classList.add('hidden');
    });

    // Back button closes custom modal
    recBackBtn.addEventListener('click', () => {
        recModal.classList.add('hidden');
    });

    function updateRecSections() {
        const type = recTypeSelect.value;
        recRepeatsOnSection.classList.toggle('hidden', type !== 'weekly');
        recMonthlyModeSection.classList.toggle('hidden', type !== 'monthly');
        if (type === 'monthly') buildMonthlyModeOptions();
    }

    recTypeSelect.addEventListener('change', updateRecSections);

    // Done button saves custom recurrence
    recModalSave.addEventListener('click', () => {
        updateRecTriggerLabel();
        recModal.classList.add('hidden');
    });

    // Click outside closes custom modal
    recModal.addEventListener('click', (e) => {
        if (e.target === recModal) recModal.classList.add('hidden');
    });

    // Auto-select radio when clicking inline inputs in Ends section
    document.getElementById('form-rec-end').addEventListener('focus', () => {
        document.querySelector('input[name="rec-end-type"][value="on"]').checked = true;
    });
    document.getElementById('form-rec-count').addEventListener('focus', () => {
        document.querySelector('input[name="rec-end-type"][value="after"]').checked = true;
    });

    window.addEventListener('open-event-form', (e) => {
        const { date, hour, event } = e.detail;
        resetForm();

        if (event) {
            // Edit mode
            document.getElementById('form-id').value = event.id;
            document.getElementById('form-title').value = event.title;
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            datePicker.setValue(startDate);
            startTimePicker.setValue(startDate.getHours(), startDate.getMinutes());
            endTimePicker.setValue(endDate.getHours(), endDate.getMinutes());
            syncHiddenInputs();
            document.getElementById('form-description').value = event.description || '';
            document.getElementById('form-location').value = event.location || '';
            setTag(event.category || '');

            if (event.recurrence) {
                recTypeSelect.value = event.recurrence.type;
                document.getElementById('form-rec-interval').value = event.recurrence.interval;
                if (event.recurrence.daysOfWeek) {
                    daysOfWeekDiv.querySelectorAll('input').forEach(cb => {
                        cb.checked = event.recurrence.daysOfWeek.includes(parseInt(cb.value));
                    });
                }
                // Restore end type
                const endType = event.recurrence.endType || (event.recurrence.endDate ? 'on' : 'never');
                document.querySelector(`input[name="rec-end-type"][value="${endType}"]`).checked = true;
                if (event.recurrence.endDate) {
                    document.getElementById('form-rec-end').value = event.recurrence.endDate;
                }
                if (event.recurrence.occurrenceCount) {
                    document.getElementById('form-rec-count').value = event.recurrence.occurrenceCount;
                }
                if (event.recurrence.monthlyMode) {
                    monthlyModeHidden.value = event.recurrence.monthlyMode;
                }
                updateRecTriggerLabel();
            }

            if (event.isOccurrence) {
                document.getElementById('form-recurrence-parent').value = event.originalId;
            }

            deleteBtn.classList.remove('hidden');
        } else if (date) {
            // Create mode with pre-filled time
            const start = new Date(date);
            if (hour != null) {
                start.setHours(hour, 0, 0);
            }
            const end = new Date(start);
            end.setHours(end.getHours() + 1);
            datePicker.setValue(start);
            startTimePicker.setValue(start.getHours(), start.getMinutes());
            endTimePicker.setValue(end.getHours(), end.getMinutes());
            syncHiddenInputs();
        }

        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('form-title').focus(), 50);
    });

    function closeModal() {
        datePicker.close();
        startTimePicker.close();
        endTimePicker.close();
        modal.classList.add('hidden');
    }

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventData = getFormData();

        if (!formStart.value || !formEnd.value) {
            alert('Please select both start and end date/time.');
            return;
        }

        if (eventData.end <= eventData.start) {
            alert('End date/time must be after start date/time.');
            return;
        }

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
        const endType = document.querySelector('input[name="rec-end-type"]:checked')?.value || 'never';
        recurrence = {
            type: recType,
            interval: parseInt(document.getElementById('form-rec-interval').value) || 1,
            endType,
            endDate: endType === 'on' ? (document.getElementById('form-rec-end').value || null) : null,
            occurrenceCount: endType === 'after' ? (parseInt(document.getElementById('form-rec-count').value) || 1) : null
        };
        if (recType === 'weekly') {
            recurrence.daysOfWeek = Array.from(
                document.querySelectorAll('#days-of-week input:checked')
            ).map(cb => parseInt(cb.value));
        }
        if (recType === 'monthly') {
            recurrence.monthlyMode = document.getElementById('form-rec-monthly-mode').value;
            if (recurrence.monthlyMode === 'nthWeekday') {
                const startDate = new Date(document.getElementById('form-start').value);
                recurrence.nthWeekday = {
                    weekday: startDate.getDay(),
                    nth: Math.floor((startDate.getDate() - 1) / 7)
                };
            }
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
    document.getElementById('form-start').value = '';
    document.getElementById('form-end').value = '';
    document.getElementById('date-trigger').textContent = 'Select date';
    document.getElementById('date-trigger').classList.remove('dt-filled');
    document.getElementById('start-time-trigger').textContent = 'Start';
    document.getElementById('start-time-trigger').classList.remove('dt-filled');
    document.getElementById('end-time-trigger').textContent = 'End';
    document.getElementById('end-time-trigger').classList.remove('dt-filled');
    document.getElementById('form-category').value = '';
    document.querySelectorAll('#tag-row .tag-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-delete').classList.add('hidden');
    document.getElementById('form-rec-type').value = '';
    document.getElementById('form-rec-interval').value = '1';
    document.getElementById('form-rec-end').value = '';
    document.getElementById('form-rec-count').value = '1';
    document.querySelector('input[name="rec-end-type"][value="never"]').checked = true;
    document.querySelectorAll('#days-of-week input').forEach(cb => cb.checked = false);
    document.getElementById('rec-repeats-on-section').classList.add('hidden');
    document.getElementById('rec-monthly-mode-section').classList.add('hidden');
    document.getElementById('form-rec-monthly-mode').value = 'dayOfMonth';
    document.getElementById('rec-trigger').textContent = 'Does not repeat';
    document.getElementById('form-color').value = '#74d5ff';
}

function toLocalDatetime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
