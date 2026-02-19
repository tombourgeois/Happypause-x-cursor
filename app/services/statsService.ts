import { apiGet } from './api';
import type { Stats } from '../types';

export async function getStats(): Promise<Stats> {
  return apiGet<Stats>('/stats');
}
