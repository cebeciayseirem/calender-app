import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habitCompletions } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const today = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  const existing = db
    .select()
    .from(habitCompletions)
    .where(and(eq(habitCompletions.habitId, id), eq(habitCompletions.date, today)))
    .get();

  if (existing) {
    db.delete(habitCompletions).where(eq(habitCompletions.id, existing.id)).run();
    return NextResponse.json({ completed: false });
  } else {
    db.insert(habitCompletions)
      .values({ id: uuidv4(), habitId: id, date: today, createdAt: new Date().toISOString() })
      .run();
    return NextResponse.json({ completed: true });
  }
}
