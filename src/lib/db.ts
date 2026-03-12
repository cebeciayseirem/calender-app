import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { seedEvents } from './seed-events';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'calendar.db');

function createDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      description TEXT,
      location TEXT,
      color TEXT NOT NULL DEFAULT '#74d5ff',
      category TEXT,
      rec_type TEXT,
      rec_interval INTEGER,
      rec_days TEXT,
      rec_end_date TEXT,
      rec_count INTEGER,
      rec_monthly_mode TEXT,
      created_at TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
      updated_at TEXT NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      category TEXT,
      recurrence TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habit_id, date)
    );
  `);

  // Migration: add columns to existing habits table if missing
  try { sqlite.exec("ALTER TABLE habits ADD COLUMN category TEXT"); } catch {}
  try { sqlite.exec("ALTER TABLE habits ADD COLUMN recurrence TEXT"); } catch {}

  seedEvents(sqlite);

  return drizzle(sqlite, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
