const API_BASE = '/api';

export async function fetchEvents(start, end) {
    const params = start && end ? `?start=${start}&end=${end}` : '';
    const res = await fetch(`${API_BASE}/events${params}`);
    return res.json();
}

export async function fetchEvent(id) {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return res.json();
}

export async function createEvent(event) {
    const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });
    return res.json();
}

export async function updateEvent(id, event) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });
    return res.json();
}

export async function deleteEvent(id) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE'
    });
    return res.json();
}

export async function searchEvents(query) {
    const res = await fetch(`${API_BASE}/events/search?q=${encodeURIComponent(query)}`);
    return res.json();
}
