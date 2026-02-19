import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const DB_PATH = process.env.DB_PATH || join(dataDir, 'happypause.db');

export const db = new Database(DB_PATH);

// Initialize schema
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Phase 2 migration
try {
  const migratePath = join(__dirname, 'migrate-phase2.sql');
  const migrate = readFileSync(migratePath, 'utf-8');
  db.exec(migrate);
} catch (e) {
  // migrate-phase2.sql might not exist
}

// Add user_id to logs if not exists
try {
  const cols = db.prepare("PRAGMA table_info(logs)").all();
  if (!cols.some((c) => c.name === 'user_id')) {
    db.exec('ALTER TABLE logs ADD COLUMN user_id TEXT');
  }
} catch (_) {}

// Add user_id to custom_activities if not exists (device_id kept for guest/migration)
try {
  const cols = db.prepare("PRAGMA table_info(custom_activities)").all();
  if (!cols.some((c) => c.name === 'user_id')) {
    db.exec('ALTER TABLE custom_activities ADD COLUMN user_id TEXT');
  }
} catch (_) {}

// Add user_settings table for logged-in users
db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    focus_duration INTEGER DEFAULT 55,
    pause_duration INTEGER DEFAULT 5,
    visible_categories TEXT DEFAULT '["FITNESS","LEISURE","SOCIAL","MIND","SPIRITUAL","RELAXATION"]',
    ringtone TEXT DEFAULT 'Default',
    language TEXT DEFAULT 'EN'
  )
`);

// User profiles (extended user data)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    first_name TEXT,
    surname TEXT,
    family_name TEXT,
    timezone TEXT DEFAULT 'GMT+00:00',
    country TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'EN',
    notification_sound INTEGER DEFAULT 1,
    notification_vibration INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Delete account codes
db.exec(`
  CREATE TABLE IF NOT EXISTS delete_account_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0
  )
`);

// Email change codes (for change-email flow)
db.exec(`
  CREATE TABLE IF NOT EXISTS email_change_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    old_email TEXT NOT NULL,
    new_email TEXT NOT NULL,
    code TEXT NOT NULL,
    stage TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0
  )
`);

export default db;
