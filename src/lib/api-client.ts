import type { CalendarEvent, EventFormData } from '@/types/event';
import type { Habit, HabitFormData } from '@/types/habit';

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

// Habits API

export async function fetchHabits(date?: string): Promise<Habit[]> {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE}/habits${params}`);
  if (!res.ok) throw new Error('Failed to fetch habits');
  return res.json();
}

export async function createHabit(data: HabitFormData): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create habit');
  return res.json();
}

export async function updateHabit(id: string, data: HabitFormData): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update habit');
  return res.json();
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/habits/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete habit');
}

export async function toggleHabit(id: string, date?: string): Promise<{ completed: boolean }> {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE}/habits/${id}/toggle${params}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle habit');
  return res.json();
}

