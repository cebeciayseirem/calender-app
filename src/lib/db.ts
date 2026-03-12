import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
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
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      icon TEXT NOT NULL DEFAULT '✅',
      color TEXT NOT NULL DEFAULT '#4A90D9',
      frequency_type TEXT NOT NULL DEFAULT 'daily',
      frequency_days TEXT,
      frequency_count INTEGER,
      category_id TEXT REFERENCES categories(id),
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

  // Seed default categories
  const defaultCategories = ['Health', 'Fitness', 'Learning', 'Mindfulness', 'Productivity'];
  for (const name of defaultCategories) {
    sqlite.exec(`INSERT OR IGNORE INTO categories (id, name, is_default) VALUES ('${name.toLowerCase()}', '${name}', 1)`);
  }

  // Migration: add new columns to existing habits table if missing
  try { sqlite.exec('ALTER TABLE habits ADD COLUMN frequency_type TEXT NOT NULL DEFAULT \'daily\''); } catch {}
  try { sqlite.exec('ALTER TABLE habits ADD COLUMN frequency_days TEXT'); } catch {}
  try { sqlite.exec('ALTER TABLE habits ADD COLUMN frequency_count INTEGER'); } catch {}
  try { sqlite.exec('ALTER TABLE habits ADD COLUMN category_id TEXT REFERENCES categories(id)'); } catch {}
  return drizzle(sqlite, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
