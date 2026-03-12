import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const allCategories = db.select().from(categories).all();
  return NextResponse.json(
    allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      isDefault: !!c.isDefault,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  db.insert(categories)
    .values({ id, name: body.name, isDefault: 0 })
    .run();

  const created = db.select().from(categories).where(eq(categories.id, id)).get();

  return NextResponse.json(
    { id: created!.id, name: created!.name, isDefault: false },
    { status: 201 }
  );
}
