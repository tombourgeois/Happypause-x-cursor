import db from '../db/database.js';

export async function logsRoutes(fastify) {
  // GET /logs
  fastify.get('/logs', async (request, reply) => {
    const userId = request.userId;
    const deviceId = request.headers['x-device-id'] || '';
    const { limit = 50, offset = 0 } = request.query;

    const logs = userId
      ? db.prepare(`
          SELECT id, timestamp, type, activity_id as activityId, category, activity_name as activityName, duration
          FROM logs WHERE user_id = ?
          ORDER BY timestamp DESC LIMIT ? OFFSET ?
        `).all(userId, parseInt(limit, 10), parseInt(offset, 10))
      : db.prepare(`
          SELECT id, timestamp, type, activity_id as activityId, category, activity_name as activityName, duration
          FROM logs WHERE device_id = ? AND (user_id IS NULL OR user_id = '')
          ORDER BY timestamp DESC LIMIT ? OFFSET ?
        `).all(deviceId, parseInt(limit, 10), parseInt(offset, 10));

    return logs;
  });

  // POST /logs
  fastify.post('/logs', async (request, reply) => {
    const userId = request.userId || null;
    const deviceId = request.headers['x-device-id'] || '';
    const { type, activityId, activityName, category, duration } = request.body || {};
    if (!type) return reply.code(400).send({ error: 'Missing type' });

    const result = db.prepare(`
      INSERT INTO logs (device_id, user_id, timestamp, type, activity_id, activity_name, category, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(deviceId, userId, Date.now(), type, activityId || null, activityName || null, category || null, duration || null);

    return { id: result.lastInsertRowid, ok: true };
  });
}
