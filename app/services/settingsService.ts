import { apiGet, apiPut } from './api';
import type { UserSettings } from '../types';

export async function getSettings(): Promise<UserSettings> {
  return apiGet<UserSettings>('/settings');
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await apiPut('/settings', settings);
}
