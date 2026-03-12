import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitCompletions } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const today = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const allHabits = db.select().from(habits).all();

  const result = allHabits.map((habit) => {
    const completion = db
      .select()
      .from(habitCompletions)
      .where(and(eq(habitCompletions.habitId, habit.id), eq(habitCompletions.date, today)))
      .get();

    return {
      ...habit,
      completedToday: !!completion,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.insert(habits)
    .values({
      id,
      title: body.title,
      subtitle: body.subtitle || null,
      icon: body.icon || '✅',
      color: body.color || '#4A90D9',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json({ ...created, completedToday: false }, { status: 201 });
}
