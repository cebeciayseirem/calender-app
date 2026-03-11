import type { CalendarEvent, EventFormData } from '@/types/event';

const API_BASE = '/api';

export async function fetchEvents(start: string, end: string): Promise<CalendarEvent[]> {
  const params = start && end ? `?start=${start}&end=${end}` : '';
  const res = await fetch(`${API_BASE}/events${params}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchEvent(id: string): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events/${id}`);
  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json();
}

export async function createEvent(data: EventFormData): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function updateEvent(id: string, data: EventFormData): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update event');
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete event');
}

export async function searchEvents(query: string): Promise<CalendarEvent[]> {
  const res = await fetch(`${API_BASE}/events/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}
