import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';

function lookupCategory(categoryId: string | null) {
  if (!categoryId) return null;
  const cat = db.select().from(categories).where(eq(categories.id, categoryId)).get();
  if (!cat) return null;
  return { id: cat.id, name: cat.name, isDefault: !!cat.isDefault };
}

function formatHabit(habit: typeof habits.$inferSelect) {
  return {
    id: habit.id,
    title: habit.title,
    subtitle: habit.subtitle,
    icon: habit.icon,
    color: habit.color,
    frequencyType: habit.frequencyType,
    frequencyDays: habit.frequencyDays ? JSON.parse(habit.frequencyDays) : null,
    frequencyCount: habit.frequencyCount,
    category: lookupCategory(habit.categoryId),
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
      icon: body.icon ?? existing.icon,
      color: body.color ?? existing.color,
      frequencyType: body.frequencyType ?? existing.frequencyType,
      frequencyDays: body.frequencyDays
        ? JSON.stringify(body.frequencyDays)
        : existing.frequencyDays,
      frequencyCount: body.frequencyCount ?? existing.frequencyCount,
      categoryId: body.categoryId !== undefined ? (body.categoryId || null) : existing.categoryId,
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
