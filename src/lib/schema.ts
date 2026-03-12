import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  description: text('description'),
  location: text('location'),
  color: text('color').notNull().default('#74d5ff'),
  category: text('category'),
  recType: text('rec_type'),
  recInterval: integer('rec_interval'),
  recDays: text('rec_days'),
  recEndDate: text('rec_end_date'),
  recCount: integer('rec_count'),
  recMonthlyMode: text('rec_monthly_mode'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  category: text('category'),
  frequencyType: text('frequency_type').notNull().default('daily'),
  frequencyDays: text('frequency_days'),
  frequencyCount: integer('frequency_count'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const habitCompletions = sqliteTable('habit_completions', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
