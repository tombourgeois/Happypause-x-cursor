import db from '../db/database.js';

const DEFAULT_SETTINGS = {
  focusDuration: 55,
  pauseDuration: 5,
  visibleCategories: ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'],
  ringtone: 'Default',
  language: 'EN',
};

export async function settingsRoutes(fastify) {
  // GET /settings
  fastify.get('/settings', async (request, reply) => {
    const userId = request.userId;
    const deviceId = request.headers['x-device-id'] || '';

    if (userId) {
      const row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      if (row) {
        return {
          focusDuration: row.focus_duration,
          pauseDuration: row.pause_duration,
          visibleCategories: JSON.parse(row.visible_categories || '[]'),
          ringtone: row.ringtone,
          language: row.language,
        };
      }
    }

    const row = db.prepare('SELECT * FROM settings WHERE device_id = ?').get(deviceId);
    if (!row) return DEFAULT_SETTINGS;
    return {
      focusDuration: row.focus_duration,
      pauseDuration: row.pause_duration,
      visibleCategories: JSON.parse(row.visible_categories || '[]'),
      ringtone: row.ringtone,
      language: row.language,
    };
  });

  // PUT /settings
  fastify.put('/settings', async (request, reply) => {
    const userId = request.userId;
    const deviceId = request.headers['x-device-id'] || '';
    const { focusDuration, pauseDuration, visibleCategories, ringtone, language } = request.body || {};

    const fd = focusDuration ?? 55;
    const pd = pauseDuration ?? 5;
    const vc = JSON.stringify(visibleCategories || DEFAULT_SETTINGS.visibleCategories);
    const rt = ringtone ?? 'Default';
    const lang = language ?? 'EN';

    if (userId) {
      db.prepare(`
        INSERT INTO user_settings (user_id, focus_duration, pause_duration, visible_categories, ringtone, language)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          focus_duration = excluded.focus_duration,
          pause_duration = excluded.pause_duration,
          visible_categories = excluded.visible_categories,
          ringtone = excluded.ringtone,
          language = excluded.language
      `).run(userId, fd, pd, vc, rt, lang);
    } else {
      db.prepare(`
        INSERT INTO settings (device_id, focus_duration, pause_duration, visible_categories, ringtone, language)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(device_id) DO UPDATE SET
          focus_duration = excluded.focus_duration,
          pause_duration = excluded.pause_duration,
          visible_categories = excluded.visible_categories,
          ringtone = excluded.ringtone,
          language = excluded.language
      `).run(deviceId, fd, pd, vc, rt, lang);
    }

    return { ok: true };
  });
}
