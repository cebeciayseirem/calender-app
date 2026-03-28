import Database from 'better-sqlite3';
import path from 'path';
import { deleteAllEvents, seedEvents } from '../src/lib/seed-events';

const dbPath = path.join(process.cwd(), 'data', 'calendar.db');
const sqlite = new Database(dbPath);

console.log('Deleting all events...');
deleteAllEvents(sqlite);
console.log('Seeding new events for this week (Mar 23-29)...');
seedEvents(sqlite);
console.log('Done!');

sqlite.close();
