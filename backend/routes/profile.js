import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const avatarsDir = join(__dirname, '..', 'public', 'images', 'avatars');

const DEFAULT_PROFILE = {
  firstName: '',
  surname: '',
  familyName: '',
  timezone: 'GMT+00:00',
  country: '',
  avatarUrl: '',
  language: 'EN',
  notificationSound: true,
  notificationVibration: true,
};

export async function profileRoutes(fastify) {
  fastify.addHook('preHandler', requireAuth);

  // GET /profile
  fastify.get('/profile', async (request, reply) => {
    const userId = request.userId;
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const row = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const profile = row
      ? {
          firstName: row.first_name ?? '',
          surname: row.surname ?? '',
          familyName: row.family_name ?? '',
          email: user.email,
          timezone: row.timezone ?? 'GMT+00:00',
          country: row.country ?? '',
          avatarUrl: row.avatar_url ?? '',
          language: row.language ?? 'EN',
          notificationSound: (row.notification_sound ?? 1) === 1,
          notificationVibration: (row.notification_vibration ?? 1) === 1,
        }
      : { ...DEFAULT_PROFILE, email: user.email };

    return profile;
  });

  // PUT /profile
  fastify.put('/profile', async (request, reply) => {
    const userId = request.userId;
    const body = request.body || {};
    const {
      firstName,
      surname,
      familyName,
      timezone,
      country,
      language,
      notificationSound,
      notificationVibration,
    } = body;

    db.prepare(`
      INSERT INTO user_profiles (user_id, first_name, surname, family_name, timezone, country, language, notification_sound, notification_vibration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        first_name = excluded.first_name,
        surname = excluded.surname,
        family_name = excluded.family_name,
        timezone = excluded.timezone,
        country = excluded.country,
        language = excluded.language,
        notification_sound = excluded.notification_sound,
        notification_vibration = excluded.notification_vibration
    `).run(
      userId,
      firstName ?? '',
      surname ?? '',
      familyName ?? '',
      timezone ?? 'GMT+00:00',
      country ?? '',
      language ?? 'EN',
      notificationSound !== false ? 1 : 0,
      notificationVibration !== false ? 1 : 0
    );

    return { ok: true };
  });

  // PUT /profile/avatar - set avatar URL (for URL option, no upload)
  fastify.put('/profile/avatar', async (request, reply) => {
    const userId = request.userId;
    const { avatarUrl } = request.body || {};
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return reply.code(400).send({ error: 'avatarUrl required' });
    }
    const row = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(userId);
    if (row) {
      db.prepare('UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?').run(avatarUrl, userId);
    } else {
      db.prepare('INSERT INTO user_profiles (user_id, avatar_url) VALUES (?, ?)').run(userId, avatarUrl);
    }
    return { avatarUrl };
  });

  // POST /profile/avatar/upload - multipart file upload
  fastify.post('/profile/avatar/upload', async (request, reply) => {
    const userId = request.userId;
    let data;
    try {
      data = await request.file();
    } catch (err) {
      fastify.log.warn({ err }, 'Multipart parse error');
      return reply.code(400).send({ error: 'Invalid multipart request' });
    }
    if (!data) return reply.code(400).send({ error: 'No file uploaded - ensure the request uses multipart/form-data with a file field' });

    const ext = data.mimetype?.includes('png') ? 'png' : data.mimetype?.includes('webp') ? 'webp' : 'jpg';
    const filename = `${userId}-${randomUUID().slice(0, 8)}.${ext}`;
    await mkdir(avatarsDir, { recursive: true });
    const filepath = join(avatarsDir, filename);
    const buffer = await data.toBuffer();
    await writeFile(filepath, buffer);

    const avatarUrl = `/images/avatars/${filename}`;
    const row = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(userId);
    if (row) {
      db.prepare('UPDATE user_profiles SET avatar_url = ? WHERE user_id = ?').run(avatarUrl, userId);
    } else {
      db.prepare('INSERT INTO user_profiles (user_id, avatar_url) VALUES (?, ?)').run(userId, avatarUrl);
    }

    return { avatarUrl };
  });
}
