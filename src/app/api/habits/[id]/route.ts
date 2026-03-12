import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits } from '@/lib/schema';
import { eq } from 'drizzle-orm';

function formatHabit(habit: typeof habits.$inferSelect) {
  return {
    id: habit.id,
    title: habit.title,
    subtitle: habit.subtitle,
    category: habit.category,
    recurrence: habit.recurrence ? JSON.parse(habit.recurrence) : null,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const now = new Date().toISOString();

  const existing = db.select().from(habits).where(eq(habits.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  db.update(habits)
    .set({
      title: body.title ?? existing.title,
      subtitle: body.subtitle ?? existing.subtitle,
      category: body.category !== undefined ? (body.category || null) : existing.category,
      recurrence: body.recurrence !== undefined
        ? (body.recurrence ? JSON.stringify(body.recurrence) : null)
        : existing.recurrence,
      updatedAt: now,
    })
    .where(eq(habits.id, id))
    .run();

  const updated = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json(formatHabit(updated!));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(habits).where(eq(habits.id, id)).run();
  return NextResponse.json({ success: true });
}
