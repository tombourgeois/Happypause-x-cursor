import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

function isAdmin(userId) {
  return ADMIN_USER_IDS.length > 0 && ADMIN_USER_IDS.includes(userId);
}

export async function adminRoutes(fastify) {
  fastify.addHook('preHandler', requireAuth);

  // GET /admin/pending-activities - list activities pending approval
  fastify.get('/admin/pending-activities', async (request, reply) => {
    if (!isAdmin(request.userId)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const rows = db.prepare(`
      SELECT id, category, title, description, creator_name, created_at
      FROM custom_activities
      WHERE pending_approval = 1
      ORDER BY created_at DESC
    `).all();

    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      creatorName: r.creator_name,
      createdAt: r.created_at,
    }));
  });

  // POST /admin/activities/:id/approve - approve and make public
  fastify.post('/admin/activities/:id/approve', async (request, reply) => {
    if (!isAdmin(request.userId)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { id } = request.params;
    const result = db.prepare(`
      UPDATE custom_activities
      SET is_public = 1, pending_approval = 0
      WHERE id = ? AND pending_approval = 1
    `).run(id);

    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Activity not found or already processed' });
    }

    return { ok: true };
  });

  // POST /admin/activities/:id/reject - reject (remove pending)
  fastify.post('/admin/activities/:id/reject', async (request, reply) => {
    if (!isAdmin(request.userId)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { id } = request.params;
    const result = db.prepare(`
      UPDATE custom_activities
      SET pending_approval = 0
      WHERE id = ? AND pending_approval = 1
    `).run(id);

    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Activity not found or already processed' });
    }

    return { ok: true };
  });
}
