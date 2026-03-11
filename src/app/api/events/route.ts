import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { and, gte, lte, or, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  let rows;
  if (start && end) {
    rows = db
      .select()
      .from(events)
      .where(
        or(
          isNotNull(events.recType),
          and(gte(events.end, start), lte(events.start, end))
        )
      )
      .all();
  } else {
    rows = db.select().from(events).all();
  }

  return NextResponse.json(rows.map(toApiEvent));
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.start && body.end && body.end <= body.start) {
    return NextResponse.json(
      { error: 'End date/time must be after start date/time' },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const rec = body.recurrence;

  db.insert(events)
    .values({
      id,
      title: body.title,
      start: body.start,
      end: body.end,
      description: body.description || null,
      location: body.location || null,
      color: body.color || '#74d5ff',
      category: body.category || null,
      recType: rec?.type || null,
      recInterval: rec?.interval || null,
      recDays: rec?.daysOfWeek ? JSON.stringify(rec.daysOfWeek) : null,
      recEndDate: rec?.endDate || null,
      recCount: rec?.occurrenceCount || null,
      recMonthlyMode: rec?.monthlyMode || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db
    .select()
    .from(events)
    .where(lte(events.id, id))
    .get();
  return NextResponse.json(toApiEvent(created!), { status: 201 });
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
