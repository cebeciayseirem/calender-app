import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
      updatedAt: now,
    })
    .where(eq(habits.id, id))
    .run();

  const updated = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.delete(habits).where(eq(habits.id, id)).run();
  return NextResponse.json({ success: true });
}
