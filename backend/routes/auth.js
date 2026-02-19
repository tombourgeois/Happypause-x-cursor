import db from '../db/database.js';
import { hashPassword, verifyPassword, createAccessToken, createRefreshToken, verifyToken, generateUserId } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

function getUserIdFromRequest(request, reply) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized' });
    return null;
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload || payload.type !== 'access') {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return null;
  }
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(payload.sub);
  if (!user) {
    reply.code(401).send({ error: 'User not found' });
    return null;
  }
  return user;
}

export async function authRoutes(fastify) {
  // GET /auth/me - get current user (requires Bearer token)
  fastify.get('/auth/me', async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const payload = verifyToken(auth.slice(7));
    if (!payload || payload.type !== 'access') {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(payload.sub);
    if (!user) return reply.code(401).send({ error: 'User not found' });
    return { userId: user.id, email: user.email };
  });

  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password required' });
    }
    const emailLower = String(email).trim().toLowerCase();
    if (password.length < 8) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (existing) {
      return reply.code(409).send({ error: 'Email already registered' });
    }

    const userId = generateUserId();
    const hash = hashPassword(password);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(userId, emailLower, hash);

    const accessToken = createAccessToken(userId);
    const refreshToken = createRefreshToken(userId);

    return {
      userId,
      email: emailLower,
      accessToken,
      refreshToken,
      expiresIn: 604800, // 7 days in seconds
    };
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password required' });
    }
    const emailLower = String(email).trim().toLowerCase();

    const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(emailLower);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    return {
      userId: user.id,
      email: emailLower,
      accessToken,
      refreshToken,
      expiresIn: 604800,
    };
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body || {};
    if (!refreshToken) {
      return reply.code(400).send({ error: 'Refresh token required' });
    }

    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return reply.code(401).send({ error: 'Invalid or expired refresh token' });
    }

    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(payload.sub);
    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }

    const accessToken = createAccessToken(user.id);
    const newRefreshToken = createRefreshToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 604800,
    };
  });

  // POST /auth/forgot-password - request reset code
  fastify.post('/auth/forgot-password', async (request, reply) => {
    const { email } = request.body || {};
    if (!email) {
      return reply.code(400).send({ error: 'Email required' });
    }
    const emailLower = String(email).trim().toLowerCase();

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (!user) {
      // Don't reveal whether email exists
      return { ok: true, message: 'If the email exists, a reset code was sent' };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 min

    db.prepare('INSERT INTO password_reset_codes (email, code, expires_at) VALUES (?, ?, ?)')
      .run(emailLower, code, expiresAt);

    // Send email (see lib/email.js)
    const { sendPasswordResetEmail } = await import('../lib/email.js');
    await sendPasswordResetEmail(emailLower, code).catch((err) => {
      fastify.log.warn({ err }, 'Failed to send password reset email');
    });

    return { ok: true, message: 'If the email exists, a reset code was sent' };
  });

  // POST /auth/reset-password - verify code and set new password
  fastify.post('/auth/reset-password', async (request, reply) => {
    const { email, code, newPassword } = request.body || {};
    if (!email || !code || !newPassword) {
      return reply.code(400).send({ error: 'Email, code, and newPassword required' });
    }
    const emailLower = String(email).trim().toLowerCase();
    if (newPassword.length < 8) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }

    const row = db.prepare(`
      SELECT id FROM password_reset_codes
      WHERE email = ? AND code = ? AND expires_at > ? AND used = 0
      ORDER BY id DESC LIMIT 1
    `).get(emailLower, String(code).trim(), Math.floor(Date.now() / 1000));

    if (!row) {
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    db.prepare('UPDATE password_reset_codes SET used = 1 WHERE email = ? AND code = ?')
      .run(emailLower, String(code).trim());

    const hash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, emailLower);

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    return {
      userId: user.id,
      email: emailLower,
      accessToken,
      refreshToken,
      expiresIn: 604800,
    };
  });

  // --- Protected routes (require Bearer token) ---

  // POST /auth/change-password - request code (when logged in)
  fastify.post('/auth/change-password', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    db.prepare('INSERT INTO password_reset_codes (email, code, expires_at) VALUES (?, ?, ?)')
      .run(user.email, code, expiresAt);

    const { sendChangePasswordCode } = await import('../lib/email.js');
    await sendChangePasswordCode(user.email, code).catch((err) => {
      fastify.log.warn({ err }, 'Failed to send change password email');
    });

    return { ok: true, message: 'Code sent to your email' };
  });

  // POST /auth/change-password/verify - verify code and set new password
  fastify.post('/auth/change-password/verify', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const { code, newPassword } = request.body || {};
    if (!code || !newPassword) {
      return reply.code(400).send({ error: 'Code and newPassword required' });
    }
    if (newPassword.length < 8) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }

    const row = db.prepare(`
      SELECT id FROM password_reset_codes
      WHERE email = ? AND code = ? AND expires_at > ? AND used = 0
      ORDER BY id DESC LIMIT 1
    `).get(user.email, String(code).trim(), Math.floor(Date.now() / 1000));

    if (!row) {
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    db.prepare('UPDATE password_reset_codes SET used = 1 WHERE email = ? AND code = ?')
      .run(user.email, String(code).trim());

    const hash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);

    return { ok: true };
  });

  // POST /auth/change-email/request - send code to current email
  fastify.post('/auth/change-email/request', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    db.prepare(`
      INSERT INTO email_change_codes (user_id, old_email, new_email, code, stage, expires_at)
      VALUES (?, ?, '', ?, 'old', ?)
    `).run(user.id, user.email, code, expiresAt);

    const { sendEmailChangeCode } = await import('../lib/email.js');
    await sendEmailChangeCode(user.email, code, false).catch((err) => {
      fastify.log.warn({ err }, 'Failed to send email change code');
    });

    return { ok: true, message: 'Code sent to your current email' };
  });

  // POST /auth/change-email/verify-old - verify old email code
  fastify.post('/auth/change-email/verify-old', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const { code } = request.body || {};
    if (!code) return reply.code(400).send({ error: 'Code required' });

    const row = db.prepare(`
      SELECT id FROM email_change_codes
      WHERE user_id = ? AND code = ? AND stage = 'old' AND expires_at > ? AND used = 0
      ORDER BY id DESC LIMIT 1
    `).get(user.id, String(code).trim(), Math.floor(Date.now() / 1000));

    if (!row) {
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    db.prepare('UPDATE email_change_codes SET used = 1 WHERE user_id = ? AND stage = ? AND code = ?')
      .run(user.id, 'old', String(code).trim());

    return { ok: true };
  });

  // POST /auth/change-email/request-new - send code to new email
  fastify.post('/auth/change-email/request-new', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const { newEmail } = request.body || {};
    const newEmailLower = newEmail ? String(newEmail).trim().toLowerCase() : '';
    if (!newEmailLower || !newEmailLower.includes('@')) {
      return reply.code(400).send({ error: 'Valid new email required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(newEmailLower);
    if (existing) {
      return reply.code(409).send({ error: 'Email already in use' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    db.prepare(`
      INSERT INTO email_change_codes (user_id, old_email, new_email, code, stage, expires_at)
      VALUES (?, ?, ?, ?, 'new', ?)
    `).run(user.id, user.email, newEmailLower, code, expiresAt);

    const { sendEmailChangeCode } = await import('../lib/email.js');
    await sendEmailChangeCode(newEmailLower, code, true).catch((err) => {
      fastify.log.warn({ err }, 'Failed to send email change code');
    });

    return { ok: true, message: 'Code sent to new email' };
  });

  // POST /auth/change-email/verify-new - verify new email code and update
  fastify.post('/auth/change-email/verify-new', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const { code } = request.body || {};
    if (!code) return reply.code(400).send({ error: 'Code required' });

    const row = db.prepare(`
      SELECT new_email FROM email_change_codes
      WHERE user_id = ? AND code = ? AND stage = 'new' AND expires_at > ? AND used = 0
      ORDER BY id DESC LIMIT 1
    `).get(user.id, String(code).trim(), Math.floor(Date.now() / 1000));

    if (!row) {
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    db.prepare('UPDATE email_change_codes SET used = 1 WHERE user_id = ? AND stage = ? AND code = ?')
      .run(user.id, 'new', String(code).trim());

    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(row.new_email, user.id);

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    return {
      userId: user.id,
      email: row.new_email,
      accessToken,
      refreshToken,
      expiresIn: 604800,
    };
  });

  // POST /auth/delete-account - request code
  fastify.post('/auth/delete-account', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    db.prepare(`
      INSERT INTO delete_account_codes (user_id, code, expires_at)
      VALUES (?, ?, ?)
    `).run(user.id, code, expiresAt);

    const { sendDeleteAccountCode } = await import('../lib/email.js');
    await sendDeleteAccountCode(user.email, code).catch((err) => {
      fastify.log.warn({ err }, 'Failed to send delete account email');
    });

    return { ok: true, message: 'Code sent to your email' };
  });

  // POST /auth/delete-account/confirm - verify code and delete account
  fastify.post('/auth/delete-account/confirm', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const { code } = request.body || {};
    if (!code) return reply.code(400).send({ error: 'Code required' });

    const row = db.prepare(`
      SELECT id FROM delete_account_codes
      WHERE user_id = ? AND code = ? AND expires_at > ? AND used = 0
      ORDER BY id DESC LIMIT 1
    `).get(user.id, String(code).trim(), Math.floor(Date.now() / 1000));

    if (!row) {
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    db.prepare('UPDATE delete_account_codes SET used = 1 WHERE user_id = ? AND code = ?')
      .run(user.id, String(code).trim());

    db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(user.id);
    db.prepare('UPDATE logs SET user_id = NULL WHERE user_id = ?').run(user.id);
    db.prepare('UPDATE custom_activities SET user_id = NULL WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

    return { ok: true, deleted: true };
  });

  // GET /auth/download-data - export user data
  fastify.get('/auth/download-data', async (request, reply) => {
    const user = getUserIdFromRequest(request, reply);
    if (!user) return;

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id);
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);
    const logs = db.prepare('SELECT * FROM logs WHERE user_id = ? ORDER BY timestamp DESC').all(user.id);

    const data = {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      profile: profile || {},
      settings: settings || {},
      logs,
    };

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', 'attachment; filename="happypause-data.json"');
    return JSON.stringify(data, null, 2);
  });
}
