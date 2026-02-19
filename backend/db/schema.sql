-- HappyPause SQLite Schema

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_path TEXT NOT NULL,
  info_url TEXT,
  creator_id TEXT DEFAULT '1',
  creator_name TEXT DEFAULT 'admin',
  is_custom INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_feedback (
  activity_id TEXT PRIMARY KEY,
  thumbs_up INTEGER DEFAULT 0,
  thumbs_down INTEGER DEFAULT 0,
  last_shown_at INTEGER,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE TABLE IF NOT EXISTS custom_activities (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_path TEXT NOT NULL,
  info_url TEXT,
  creator_id TEXT,
  creator_name TEXT,
  device_id TEXT NOT NULL,
  is_public INTEGER DEFAULT 0,
  pending_approval INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  timestamp INTEGER NOT NULL,
  type TEXT NOT NULL,
  activity_id TEXT,
  category TEXT,
  activity_name TEXT,
  duration INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  device_id TEXT PRIMARY KEY,
  focus_duration INTEGER DEFAULT 55,
  pause_duration INTEGER DEFAULT 5,
  visible_categories TEXT DEFAULT '["FITNESS","LEISURE","SOCIAL","MIND","SPIRITUAL","RELAXATION"]',
  ringtone TEXT DEFAULT 'Default',
  language TEXT DEFAULT 'EN'
);

CREATE INDEX IF NOT EXISTS idx_logs_device_timestamp ON logs(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
