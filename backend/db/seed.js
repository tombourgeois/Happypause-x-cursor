import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATEGORY_MAP = {
  1: 'FITNESS',
  2: 'LEISURE',
  3: 'SOCIAL',
  4: 'MIND',
  5: 'SPIRITUAL',
  6: 'RELAXATION',
};

const csvPath = join(__dirname, '..', '..', 'docs', 'HappyPause-Activities.csv');
const csv = readFileSync(csvPath, 'utf-8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');
const rows = lines.slice(1);

const insertActivity = db.prepare(`
  INSERT OR REPLACE INTO activities (id, category, title, description, icon_path, info_url, creator_id, creator_name, is_custom)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
`);

const insertFeedback = db.prepare(`
  INSERT OR IGNORE INTO activity_feedback (activity_id, thumbs_up, thumbs_down, last_shown_at)
  VALUES (?, 0, 0, NULL)
`);

const transaction = db.transaction(() => {
  for (const line of rows) {
    const values = parseCSVLine(line);
    if (values.length < 6) continue;

    const [categoryNum, id, title, description, image, url] = values;
    const category = CATEGORY_MAP[parseInt(categoryNum, 10)] || 'FITNESS';
    const iconPath = `activityimages/${category}-${id}.png`;
    const creatorId = values[7] || '1';
    const creatorName = values[8] || 'admin';

    insertActivity.run(id, category, title, description, iconPath, url || null, creatorId, creatorName);
    insertFeedback.run(id);
  }
});

transaction();
console.log(`Seeded ${rows.length} activities`);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\n') {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}
