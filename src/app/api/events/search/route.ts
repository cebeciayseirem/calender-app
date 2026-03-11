import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { or, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';

  if (!q) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;
  const rows = db
    .select()
    .from(events)
    .where(
      or(
        like(events.title, pattern),
        like(events.description, pattern),
        like(events.location, pattern),
        like(events.category, pattern)
      )
    )
    .all();

  return NextResponse.json(rows.map(toApiEvent));
}

function toApiEvent(row: typeof events.$inferSelect) {
  const event: Record<string, unknown> = {
    id: row.id,
    title: row.title,
    start: row.start,
    end: row.end,
    description: row.description,
    location: row.location,
    color: row.color,
    category: row.category,
  };

  if (row.recType) {
    event.recurrence = {
      type: row.recType,
      interval: row.recInterval ?? 1,
      daysOfWeek: row.recDays ? JSON.parse(row.recDays) : undefined,
      endDate: row.recEndDate,
      occurrenceCount: row.recCount,
      monthlyMode: row.recMonthlyMode,
    };
  } else {
    event.recurrence = null;
  }

  return event;
}
