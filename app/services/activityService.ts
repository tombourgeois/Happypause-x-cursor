import { apiGet, apiPost, apiPatch } from './api';
import type { Activity, UserSettings } from '../types';

export async function getActivities(category?: string): Promise<Activity[]> {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiGet<Activity[]>(`/activities${q}`);
}

export async function getNextActivity(settings: UserSettings): Promise<Activity | null> {
  try {
    const categories = settings.visibleCategories.join(',');
    return await apiGet<Activity>(`/activities/next?categories=${encodeURIComponent(categories)}`);
  } catch {
    return null;
  }
}

export async function updateFeedback(activityId: string, type: 'increment_up' | 'decrement_up' | 'increment_down' | 'decrement_down' | 'shown'): Promise<void> {
  await apiPatch(`/activities/${activityId}/feedback`, { type });
}

export async function createActivity(data: {
  category: string;
  title: string;
  description: string;
  icon_path?: string;
  info_url?: string;
  is_public?: boolean;
}): Promise<Activity> {
  return apiPost<Activity>('/activities', data);
}
