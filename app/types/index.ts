export type ActivityCategory = string;

export interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  iconName: string;
  infoUrl?: string;
  thumbsUpCount: number;
  thumbsDownCount: number;
  lastShownAt: number | null;
  creatorId?: string;
  creatorName?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: string;
  activityId?: string;
  activityName?: string;
  category?: ActivityCategory;
  duration?: number;
}

export interface UserSettings {
  focusDuration: number;
  pauseDuration: number;
  visibleCategories: ActivityCategory[];
  ringtone: string;
  language: 'EN' | 'FR';
}

export interface Stats {
  totalFocusTime: number;
  totalPauseTime: number;
  totalPausesDone?: number;
  dayStreak?: number;
  weeklyData: { date: string; focusMinutes: number; pauseMinutes: number }[];
  categoryBreakdown: Record<string, number>;
  activityInsight: Record<string, { done: number; skipped: number }>;
}

export interface UserProfile {
  firstName: string;
  surname: string;
  familyName: string;
  email: string;
  timezone: string;
  country: string;
  avatarUrl: string;
  language: 'EN' | 'FR';
  notificationSound: boolean;
  notificationVibration: boolean;
}
