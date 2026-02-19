import db from '../db/database.js';

export async function statsRoutes(fastify) {
  fastify.get('/stats', async (request, reply) => {
    const userId = request.userId;
    const deviceId = request.headers['x-device-id'] || '';

    const logs = userId
      ? db.prepare(`
          SELECT type, duration, timestamp FROM logs
          WHERE user_id = ?
          ORDER BY timestamp DESC
        `).all(userId)
      : db.prepare(`
          SELECT type, duration, timestamp FROM logs
          WHERE device_id = ? AND (user_id IS NULL OR user_id = '')
          ORDER BY timestamp DESC
        `).all(deviceId);

    let totalFocusTime = 0;
    let totalPauseTime = 0;
    const categoryBreakdown = {};
    const weeklyData = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * oneDay);
      dayStart.setHours(0, 0, 0, 0);
      weeklyData.push({
        date: dayStart.toISOString().slice(0, 10),
        focusMinutes: 0,
        pauseMinutes: 0,
      });
    }

    let lastFocusStart = null;
    let lastPauseStart = null;

    for (const log of logs) {
      const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
      const weekEntry = weeklyData.find(w => w.date === logDate);
      if (weekEntry) {
        if (log.type === 'focus_started') lastFocusStart = log.timestamp;
        if (log.type === 'focus_stopped' || log.type === 'focus_paused') {
          if (lastFocusStart) {
            const dur = Math.floor((log.timestamp - lastFocusStart) / 60);
            totalFocusTime += dur;
            weekEntry.focusMinutes += dur;
          }
          lastFocusStart = null;
        }
        if (log.type === 'happypause_started') lastPauseStart = log.timestamp;
        if (log.type === 'happypause_done' || log.type === 'happypause_skipped') {
          if (lastPauseStart) {
            const dur = Math.floor((log.timestamp - lastPauseStart) / 60);
            totalPauseTime += dur;
            weekEntry.pauseMinutes += dur;
          }
          if (log.type === 'happypause_done' && log.category) {
            categoryBreakdown[log.category] = (categoryBreakdown[log.category] || 0) + 1;
          }
          lastPauseStart = null;
        }
      }
    }

    const activityInsight = userId
      ? db.prepare(`
          SELECT category, type, COUNT(*) as count
          FROM logs WHERE user_id = ? AND type IN ('happypause_done', 'happypause_skipped')
          GROUP BY category, type
        `).all(userId)
      : db.prepare(`
          SELECT category, type, COUNT(*) as count
          FROM logs
          WHERE device_id = ? AND (user_id IS NULL OR user_id = '') AND type IN ('happypause_done', 'happypause_skipped')
          GROUP BY category, type
        `).all(deviceId);

    const insight = {};
    for (const row of activityInsight) {
      if (!insight[row.category]) insight[row.category] = { done: 0, skipped: 0 };
      insight[row.category][row.type === 'happypause_done' ? 'done' : 'skipped'] = row.count;
    }

    return {
      totalFocusTime,
      totalPauseTime,
      weeklyData,
      categoryBreakdown,
      activityInsight: insight,
    };
  });
}
