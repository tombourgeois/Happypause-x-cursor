import { verifyToken } from '../lib/auth.js';

export async function optionalAuth(request, reply) {
  const auth = request.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (payload && payload.type === 'access') {
      request.userId = payload.sub;
    }
  }
}

export async function requireAuth(request, reply) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'access') {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
  request.userId = payload.sub;
}
