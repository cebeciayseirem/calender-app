import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
