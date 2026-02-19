import { apiGet, apiPost } from './api';
import type { LogEntry } from '../types';

export async function getLogs(limit = 50, offset = 0): Promise<LogEntry[]> {
  const logs = await apiGet<LogEntry[]>(`/logs?limit=${limit}&offset=${offset}`);
  return logs.map((l) => ({ ...l, id: String(l.id) }));
}

export async function addLog(data: {
  type: string;
  activityId?: string;
  activityName?: string;
  category?: string;
  duration?: number;
}): Promise<void> {
  await apiPost('/logs', data);
}
