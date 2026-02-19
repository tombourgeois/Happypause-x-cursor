import db from '../db/database.js';

const DEFAULT_CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];

export async function activitiesRoutes(fastify) {
  // GET /activities - list activities
  fastify.get('/activities', async (request, reply) => {
    const userId = request.userId;
    const deviceId = request.headers['x-device-id'] || '';
    const { category } = request.query;
    let sql = `
      SELECT a.*, COALESCE(f.thumbs_up, 0) as thumbs_up, COALESCE(f.thumbs_down, 0) as thumbs_down, f.last_shown_at
      FROM activities a
      LEFT JOIN activity_feedback f ON a.id = f.activity_id
      WHERE a.is_custom = 0
    `;
    const params = [];
    if (category) {
      sql += ' AND a.category = ?';
      params.push(category);
    }
    sql += ' ORDER BY a.category, a.id';

    const activities = db.prepare(sql).all(...params);

    const custom = userId
      ? db.prepare(`
          SELECT c.*, COALESCE(f.thumbs_up, 0) as thumbs_up, COALESCE(f.thumbs_down, 0) as thumbs_down, f.last_shown_at
          FROM custom_activities c
          LEFT JOIN activity_feedback f ON c.id = f.activity_id
          WHERE (c.user_id = ? OR (c.device_id = ? AND (c.user_id IS NULL OR c.user_id = '')) OR (c.is_public = 1 AND c.pending_approval = 0))
        `).all(userId, deviceId)
      : db.prepare(`
          SELECT c.*, COALESCE(f.thumbs_up, 0) as thumbs_up, COALESCE(f.thumbs_down, 0) as thumbs_down, f.last_shown_at
          FROM custom_activities c
          LEFT JOIN activity_feedback f ON c.id = f.activity_id
          WHERE (c.device_id = ? AND (c.user_id IS NULL OR c.user_id = '')) OR (c.is_public = 1 AND c.pending_approval = 0)
        `).all(deviceId);

    return [...activities, ...custom].map(row => ({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      iconName: row.icon_path,
      infoUrl: row.info_url,
      thumbsUpCount: row.thumbs_up ?? 0,
      thumbsDownCount: row.thumbs_down ?? 0,
      lastShownAt: row.last_shown_at,
      creatorId: row.creator_id,
      creatorName: row.creator_name,
    }));
  });

  // GET /activities/next - weighted random activity
  fastify.get('/activities/next', async (request, reply) => {
    const userId = request.userId;
    const deviceId = request.headers['x-device-id'] || '';
    const categoriesParam = request.query.categories;
    const categories = categoriesParam ? categoriesParam.split(',') : DEFAULT_CATEGORIES;

    const defaultActivities = db.prepare(`
      SELECT a.*, COALESCE(f.thumbs_up, 0) as thumbs_up, COALESCE(f.thumbs_down, 0) as thumbs_down, f.last_shown_at
      FROM activities a
      LEFT JOIN activity_feedback f ON a.id = f.activity_id
      WHERE a.category IN (${categories.map(() => '?').join(',')})
    `).all(...categories);

    const customWhere = userId
      ? `(c.user_id = ? OR (c.device_id = ? AND (c.user_id IS NULL OR c.user_id = '')) OR (c.is_public = 1 AND c.pending_approval = 0)) AND c.category IN (${categories.map(() => '?').join(',')})`
      : `((c.device_id = ? AND (c.user_id IS NULL OR c.user_id = '')) OR (c.is_public = 1 AND c.pending_approval = 0)) AND c.category IN (${categories.map(() => '?').join(',')})`;
    const customParams = userId ? [userId, deviceId, ...categories] : [deviceId, ...categories];
    const customActivities = db.prepare(`
      SELECT c.*, COALESCE(f.thumbs_up, 0) as thumbs_up, COALESCE(f.thumbs_down, 0) as thumbs_down, f.last_shown_at
      FROM custom_activities c
      LEFT JOIN activity_feedback f ON c.id = f.activity_id
      WHERE ${customWhere}
    `).all(...customParams);

    const allActivities = [...defaultActivities, ...customActivities].map(row => ({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      iconName: row.icon_path,
      infoUrl: row.info_url,
      thumbsUpCount: row.thumbs_up ?? 0,
      thumbsDownCount: row.thumbs_down ?? 0,
      lastShownAt: row.last_shown_at,
    }));

    if (allActivities.length === 0) return reply.code(404).send({ error: 'No activities found' });

    const recentBreaks = userId
      ? db.prepare(`
          SELECT activity_id FROM logs
          WHERE user_id = ? AND type = 'happypause_started'
          ORDER BY timestamp DESC LIMIT 3
        `).all(userId)
      : db.prepare(`
          SELECT activity_id FROM logs
          WHERE device_id = ? AND (user_id IS NULL OR user_id = '') AND type = 'happypause_started'
          ORDER BY timestamp DESC LIMIT 3
        `).all(deviceId);
    const recentIds = new Set(recentBreaks.map(r => r.activity_id));

    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    const weighted = allActivities.map(activity => {
      let weight = 1.0;
      const multiplier = (1 + activity.thumbsUpCount) / (1 + activity.thumbsDownCount);
      weight *= multiplier;
      if (recentIds.has(activity.id)) weight *= 0.25;
      if (activity.lastShownAt && (now - activity.lastShownAt) < twoHours) weight *= 0.5;
      if (weight < 0.05) weight = 0.05;
      return { activity, weight };
    });

    const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * totalWeight;
    for (const { activity, weight } of weighted) {
      r -= weight;
      if (r <= 0) return activity;
    }
    return weighted[0].activity;
  });

  // PATCH /activities/:id/feedback
  fastify.patch('/activities/:id/feedback', async (request, reply) => {
    const { id } = request.params;
    const { type } = request.body || {};
    if (!['increment_up', 'decrement_up', 'increment_down', 'decrement_down', 'shown'].includes(type)) {
      return reply.code(400).send({ error: 'Invalid type' });
    }

    const row = db.prepare('SELECT * FROM activity_feedback WHERE activity_id = ?').get(id);
    const current = row || { thumbs_up: 0, thumbs_down: 0, last_shown_at: null };

    if (type === 'shown') {
      db.prepare('INSERT OR REPLACE INTO activity_feedback (activity_id, thumbs_up, thumbs_down, last_shown_at) VALUES (?, ?, ?, ?)')
        .run(id, current.thumbs_up, current.thumbs_down, Date.now());
    } else {
      let up = current.thumbs_up ?? 0, down = current.thumbs_down ?? 0;
      if (type === 'increment_up') up++; else if (type === 'decrement_up') up = Math.max(0, up - 1);
      if (type === 'increment_down') down++; else if (type === 'decrement_down') down = Math.max(0, down - 1);
      db.prepare('INSERT OR REPLACE INTO activity_feedback (activity_id, thumbs_up, thumbs_down, last_shown_at) VALUES (?, ?, ?, ?)')
        .run(id, up, down, current.last_shown_at);
    }
    return { ok: true };
  });

  // POST /activities - create custom activity
  fastify.post('/activities', async (request, reply) => {
    const userId = request.userId || null;
    const deviceId = request.headers['x-device-id'] || '';
    const { category, title, description, icon_path, info_url, is_public } = request.body || {};
    if (!category || !title || !description) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const id = `1${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
    const iconPath = icon_path || `${category}-${id}.png`;
    db.prepare(`
      INSERT INTO custom_activities (id, category, title, description, icon_path, info_url, device_id, user_id, is_public, pending_approval)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, category, title, description, iconPath, info_url || null, deviceId, userId, is_public ? 1 : 0, is_public ? 1 : 0);

    db.prepare('INSERT OR IGNORE INTO activity_feedback (activity_id, thumbs_up, thumbs_down, last_shown_at) VALUES (?, 0, 0, NULL)').run(id);

    return { id, category, title, description, iconName: iconPath, infoUrl: info_url };
  });
}
