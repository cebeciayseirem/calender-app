import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = db.select().from(events).where(eq(events.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(toApiEvent(row));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.start && body.end && body.end <= body.start) {
    return NextResponse.json(
      { error: 'End date/time must be after start date/time' },
      { status: 400 }
    );
  }

  const existing = db.select().from(events).where(eq(events.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rec = body.recurrence;
  const now = new Date().toISOString();

  db.update(events)
    .set({
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
      updatedAt: now,
    })
    .where(eq(events.id, id))
    .run();

  const updated = db.select().from(events).where(eq(events.id, id)).get();
  return NextResponse.json(toApiEvent(updated!));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(events).where(eq(events.id, id)).run();
  return NextResponse.json({ success: true });
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
