export type ActivityCategory = string;

export interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  iconName: string; // We will use lucide-react names or image filenames
  infoUrl?: string;
  thumbsUpCount: number;
  thumbsDownCount: number;
  lastShownAt: number | null; // Timestamp
  creatorId?: string;
  creatorName?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'focus_started' | 'focus_paused' | 'focus_stopped' | 'focus_resumed' | 'focus_restarted' | 'happypause_started' | 'happypause_done' | 'happypause_skipped' | 'happypause_cycled' | 'happypause_thumb_up' | 'happypause_thumb_down' | 'happypause_created';
  activityId?: string;
  activityName?: string;
  category?: ActivityCategory;
  duration?: number; // In seconds, for stats
}

export interface UserSettings {
  focusDuration: number; // minutes
  pauseDuration: number; // minutes
  visibleCategories: ActivityCategory[];
  ringtone: string;
  language: 'EN' | 'FR';
}

export interface UserProfile {
  firstName: string;
  surname: string;
  familyName: string;
  email: string;
  timezone: string;
  country: string;
  avatarUrl: string;
  loginDates: string[]; // Array of YYYY-MM-DD date strings
}

export enum AppTab {
  TIMER = 'TIMER',
  STATS = 'STATS',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE',
}

export enum TimerMode {
  FOCUS = 'FOCUS',
  PAUSE = 'PAUSE',
}

export enum TimerState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
}