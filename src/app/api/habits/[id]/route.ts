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
    frequencyType: habit.frequencyType,
    frequencyDays: habit.frequencyDays ? JSON.parse(habit.frequencyDays) : null,
    frequencyCount: habit.frequencyCount,
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
      frequencyType: body.frequencyType ?? existing.frequencyType,
      frequencyDays: body.frequencyDays
        ? JSON.stringify(body.frequencyDays)
        : existing.frequencyDays,
      frequencyCount: body.frequencyCount ?? existing.frequencyCount,
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
