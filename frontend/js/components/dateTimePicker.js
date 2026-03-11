function pad(n) {
    return String(n).padStart(2, '0');
}

export function createDatePicker(triggerEl, onChange) {
    let currentMonth, currentYear, selectedDate;
    let pickerEl = null;

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function formatDisplay(date) {
        return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthsFull[date.getMonth()]} ${date.getFullYear()}`;
    }

    function open() {
        if (pickerEl) { close(); return; }

        if (selectedDate) {
            currentMonth = selectedDate.getMonth();
            currentYear = selectedDate.getFullYear();
        } else {
            const now = new Date();
            currentMonth = now.getMonth();
            currentYear = now.getFullYear();
        }

        pickerEl = document.createElement('div');
        pickerEl.className = 'dt-picker';
        pickerEl.addEventListener('mousedown', e => e.stopPropagation());
        pickerEl.addEventListener('click', e => e.stopPropagation());

        render();

        const container = triggerEl.closest('.dt-row') || triggerEl.parentElement;
        container.style.position = 'relative';
        container.appendChild(pickerEl);
    }

    function close() {
        if (pickerEl) { pickerEl.remove(); pickerEl = null; }
    }

    function render() {
        if (!pickerEl) return;
        pickerEl.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'dt-header';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'dt-nav';
        prevBtn.innerHTML = '&larr;';
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            render();
        });

        const monthLabel = document.createElement('span');
        monthLabel.className = 'dt-month-year';
        monthLabel.textContent = `${monthsFull[currentMonth]} ${currentYear}`;

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'dt-nav';
        nextBtn.innerHTML = '&rarr;';
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            render();
        });

        header.appendChild(prevBtn);
        header.appendChild(monthLabel);
        header.appendChild(nextBtn);
        pickerEl.appendChild(header);

        // Day-of-week headers
        const dowHeader = document.createElement('div');
        dowHeader.className = 'dt-dow';
        ['Mo','Tu','We','Th','Fr','Sa','Su'].forEach(d => {
            const s = document.createElement('span');
            s.textContent = d;
            dowHeader.appendChild(s);
        });
        pickerEl.appendChild(dowHeader);

        // Calendar grid
        const grid = document.createElement('div');
        grid.className = 'dt-grid';
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < offset; i++) {
            const empty = document.createElement('span');
            empty.className = 'dt-day empty';
            grid.appendChild(empty);
        }

        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEl = document.createElement('span');
            dayEl.className = 'dt-day';
            dayEl.textContent = d;

            if (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            if (selectedDate && d === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()) {
                dayEl.classList.add('selected');
            }

            dayEl.addEventListener('click', () => {
                selectedDate = new Date(currentYear, currentMonth, d);
                render();
            });
            grid.appendChild(dayEl);
        }
        pickerEl.appendChild(grid);

        // OK button
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'dt-pick-btn';
        okBtn.textContent = 'OK';
        okBtn.addEventListener('click', () => {
            if (selectedDate) {
                triggerEl.textContent = formatDisplay(selectedDate);
                triggerEl.classList.add('dt-filled');
            }
            close();
            if (onChange) onChange(selectedDate);
        });
        pickerEl.appendChild(okBtn);
    }

    triggerEl.addEventListener('click', e => {
        e.stopPropagation();
        open();
    });

    document.addEventListener('mousedown', e => {
        if (pickerEl && !pickerEl.contains(e.target) && e.target !== triggerEl) close();
    });

    return {
        setValue(date) {
            if (date) {
                selectedDate = new Date(date);
                triggerEl.textContent = formatDisplay(selectedDate);
                triggerEl.classList.add('dt-filled');
            } else {
                selectedDate = null;
                triggerEl.textContent = 'Select date';
                triggerEl.classList.remove('dt-filled');
            }
        },
        getDate() { return selectedDate ? new Date(selectedDate) : null; },
        close
    };
}

export function createTimePicker(triggerEl, onChange, options = {}) {
    let selectedHour, selectedMinute;
    let pickerEl = null;

    function formatTime(h, m) {
        return `${pad(h)}:${pad(m)}`;
    }

    function open() {
        if (pickerEl) { close(); return; }

        if (selectedHour == null) {
            const now = new Date();
            selectedHour = now.getHours();
            selectedMinute = 0;
        }

        pickerEl = document.createElement('div');
        pickerEl.className = 'dt-picker dt-time-picker';
        pickerEl.addEventListener('mousedown', e => e.stopPropagation());
        pickerEl.addEventListener('click', e => e.stopPropagation());

        render();

        const container = triggerEl.closest('.dt-row') || triggerEl.parentElement;
        container.style.position = 'relative';
        container.appendChild(pickerEl);
    }

    function close() {
        if (pickerEl) { pickerEl.remove(); pickerEl = null; }
    }

    function showWarning(msg) {
        if (!pickerEl) return;
        let warn = pickerEl.querySelector('.dt-warning');
        if (warn) warn.remove();
        warn = document.createElement('div');
        warn.className = 'dt-warning';
        warn.textContent = msg;
        pickerEl.appendChild(warn);
        setTimeout(() => warn.remove(), 3000);
    }

    function render() {
        if (!pickerEl) return;
        pickerEl.innerHTML = '';

        const timeRow = document.createElement('div');
        timeRow.className = 'dt-time';

        const hourSelect = document.createElement('select');
        hourSelect.className = 'dt-hour';
        for (let h = 0; h < 24; h++) {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = pad(h);
            if (h === selectedHour) opt.selected = true;
            hourSelect.appendChild(opt);
        }
        hourSelect.addEventListener('change', () => { selectedHour = parseInt(hourSelect.value); });

        const sep = document.createElement('span');
        sep.className = 'dt-sep';
        sep.textContent = ':';

        const minSelect = document.createElement('select');
        minSelect.className = 'dt-min';
        for (let m = 0; m < 60; m += 5) {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = pad(m);
            if (m === selectedMinute || (m > selectedMinute && m - 5 < selectedMinute)) opt.selected = true;
            minSelect.appendChild(opt);
        }
        if (selectedMinute % 5 !== 0) {
            const exact = document.createElement('option');
            exact.value = selectedMinute;
            exact.textContent = pad(selectedMinute);
            exact.selected = true;
            minSelect.appendChild(exact);
            const opts = Array.from(minSelect.options).sort((a, b) => a.value - b.value);
            minSelect.innerHTML = '';
            opts.forEach(o => minSelect.appendChild(o));
        }
        minSelect.addEventListener('change', () => { selectedMinute = parseInt(minSelect.value); });

        timeRow.appendChild(hourSelect);
        timeRow.appendChild(sep);
        timeRow.appendChild(minSelect);
        pickerEl.appendChild(timeRow);

        // OK button
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'dt-pick-btn';
        okBtn.textContent = 'OK';
        okBtn.addEventListener('click', () => {
            // Validate min time
            if (options.getMin) {
                const min = options.getMin();
                if (min) {
                    const pickedTotal = selectedHour * 60 + selectedMinute;
                    const minTotal = min.h * 60 + min.m;
                    if (pickedTotal <= minTotal) {
                        showWarning('End time must be after start time.');
                        return;
                    }
                }
            }
            triggerEl.textContent = formatTime(selectedHour, selectedMinute);
            triggerEl.classList.add('dt-filled');
            close();
            if (onChange) onChange(selectedHour, selectedMinute);
        });
        pickerEl.appendChild(okBtn);
    }

    triggerEl.addEventListener('click', e => {
        e.stopPropagation();
        open();
    });

    document.addEventListener('mousedown', e => {
        if (pickerEl && !pickerEl.contains(e.target) && e.target !== triggerEl) close();
    });

    return {
        setValue(h, m) {
            if (h != null && m != null) {
                selectedHour = h;
                selectedMinute = m;
                triggerEl.textContent = formatTime(h, m);
                triggerEl.classList.add('dt-filled');
            } else {
                selectedHour = null;
                selectedMinute = null;
                triggerEl.textContent = options.placeholder || 'Time';
                triggerEl.classList.remove('dt-filled');
            }
        },
        getTime() {
            return selectedHour != null ? { h: selectedHour, m: selectedMinute } : null;
        },
        close,
        open
    };
}
