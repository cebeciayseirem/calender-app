import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits, habitCompletions } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import type { RecurrenceConfig } from '@/types/event';

function formatHabit(habit: typeof habits.$inferSelect, completedToday: boolean) {
  return {
    id: habit.id,
    title: habit.title,
    subtitle: habit.subtitle,
    category: habit.category,
    recurrence: habit.recurrence ? JSON.parse(habit.recurrence) : null,
    completedToday,
  };
}

function shouldShowHabitOnDate(recurrence: RecurrenceConfig | null, dateStr: string): boolean {
  if (!recurrence) return true;
  if (recurrence.type === 'weekly' && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
    const date = new Date(dateStr + 'T00:00:00');
    return recurrence.daysOfWeek.includes(date.getDay());
  }
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateParam = searchParams.get('date');
  const today = dateParam || format(new Date(), 'yyyy-MM-dd');
  const allHabits = db.select().from(habits).all();

  const result = allHabits
    .filter((habit) => {
      if (!dateParam) return true; // No date param = return all (manage view)
      const rec: RecurrenceConfig | null = habit.recurrence ? JSON.parse(habit.recurrence) : null;
      return shouldShowHabitOnDate(rec, today);
    })
    .map((habit) => {
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
      recurrence: body.recurrence ? JSON.stringify(body.recurrence) : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(habits).where(eq(habits.id, id)).get();
  return NextResponse.json(formatHabit(created!, false), { status: 201 });
}
