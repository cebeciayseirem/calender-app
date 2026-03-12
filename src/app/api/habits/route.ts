import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitCompletions } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

function formatHabit(habit: typeof habits.$inferSelect, completedToday: boolean) {
  return {
    id: habit.id,
    title: habit.title,
    subtitle: habit.subtitle,
    category: habit.category,
    frequencyType: habit.frequencyType,
    frequencyDays: habit.frequencyDays ? JSON.parse(habit.frequencyDays) : null,
    frequencyCount: habit.frequencyCount,
    completedToday,
  };
}

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

    return formatHabit(habit, !!completion);
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
      category: body.category || null,
      frequencyType: body.frequencyType || 'daily',
      frequencyDays: body.frequencyDays ? JSON.stringify(body.frequencyDays) : null,
      frequencyCount: body.frequencyCount ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json(formatHabit(created!, false), { status: 201 });
}
