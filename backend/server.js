import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { activitiesRoutes } from './routes/activities.js';
import { logsRoutes } from './routes/logs.js';
import { statsRoutes } from './routes/stats.js';
import { settingsRoutes } from './routes/settings.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { profileRoutes } from './routes/profile.js';
import { optionalAuth } from './middleware/auth.js';
import './db/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);

const imagesDir = join(__dirname, 'public', 'images');
const activityImagesDir = join(imagesDir, 'activityimages');
const avatarsDir = join(imagesDir, 'avatars');
if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });
if (!existsSync(activityImagesDir)) mkdirSync(activityImagesDir, { recursive: true });
if (!existsSync(avatarsDir)) mkdirSync(avatarsDir, { recursive: true });

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });
await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

await fastify.addHook('preHandler', optionalAuth);

await fastify.register(fastifyStatic, {
  root: imagesDir,
  prefix: '/images/',
});

await fastify.register(authRoutes, { prefix: '/' });
await fastify.register(adminRoutes, { prefix: '/' });
await fastify.register(profileRoutes, { prefix: '/' });
await fastify.register(activitiesRoutes, { prefix: '/' });
await fastify.register(logsRoutes, { prefix: '/' });
await fastify.register(statsRoutes, { prefix: '/' });
await fastify.register(settingsRoutes, { prefix: '/' });

fastify.get('/', async () => ({
  name: 'HappyPause API',
  version: '1.0.0',
  docs: {
    health: 'GET /health',
    auth: 'POST /auth/register, /auth/login, /auth/refresh, /auth/forgot-password, /auth/reset-password',
    activities: 'GET /activities, GET /activities/next',
    logs: 'GET /logs, POST /logs',
    stats: 'GET /stats',
    settings: 'GET /settings, PUT /settings',
  },
}));

fastify.get('/health', async () => ({ ok: true }));

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API running at http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
