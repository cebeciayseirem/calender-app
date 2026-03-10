export function expandRecurrences(events, currentDate, view) {
    const { start, end } = getViewRange(currentDate, view);
    const expanded = [];

    for (const event of events) {
        if (!event.recurrence) {
            expanded.push(event);
            continue;
        }

        const occurrences = generateOccurrences(event, start, end);
        expanded.push(...occurrences);
    }
    return expanded;
}

function getViewRange(date, view) {
    const d = new Date(date);
    let start, end;
    switch (view) {
        case 'yearly':
            start = new Date(d.getFullYear(), 0, 1);
            end = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
            break;
        case 'monthly':
            start = new Date(d.getFullYear(), d.getMonth(), 1);
            end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            break;
        case 'weekly':
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(d.getFullYear(), d.getMonth(), diff);
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59);
            break;
        case 'daily':
            start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            break;
    }
    return { start, end };
}

function generateOccurrences(event, rangeStart, rangeEnd) {
    const occurrences = [];
    const rec = event.recurrence;
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const duration = eventEnd - eventStart;
    const recEnd = rec.endDate ? new Date(rec.endDate) : rangeEnd;
    const limit = Math.min(rangeEnd, recEnd);

    let current = new Date(eventStart);

    while (current <= limit) {
        if (current >= rangeStart || new Date(current.getTime() + duration) >= rangeStart) {
            if (rec.type === 'weekly' && rec.daysOfWeek && rec.daysOfWeek.length > 0) {
                if (rec.daysOfWeek.includes(current.getDay())) {
                    occurrences.push(makeOccurrence(event, current, duration));
                }
            } else {
                occurrences.push(makeOccurrence(event, current, duration));
            }
        }
        current = advanceDate(current, rec);
    }
    return occurrences;
}

function advanceDate(date, rec) {
    const d = new Date(date);
    switch (rec.type) {
        case 'daily': d.setDate(d.getDate() + rec.interval); break;
        case 'weekly':
            if (rec.daysOfWeek && rec.daysOfWeek.length > 0) {
                d.setDate(d.getDate() + 1);
            } else {
                d.setDate(d.getDate() + 7 * rec.interval);
            }
            break;
        case 'monthly': d.setMonth(d.getMonth() + rec.interval); break;
        case 'yearly': d.setFullYear(d.getFullYear() + rec.interval); break;
    }
    return d;
}

function makeOccurrence(event, start, duration) {
    return {
        ...event,
        id: event.id,
        originalId: event.id,
        start: toLocalISO(start),
        end: toLocalISO(new Date(start.getTime() + duration)),
        isOccurrence: true
    };
}

function toLocalISO(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
