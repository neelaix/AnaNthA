import type { Doc } from '../_generated/dataModel';

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000];
export const CLAIM_BATCH_SIZE = 40;
export const MAX_REMINDER_HORIZON_MS = 31 * 24 * 60 * 60 * 1000;
export const MAX_TITLE_LENGTH = 160;
export const MAX_BODY_LENGTH = 500;
export const MAX_SUBSCRIPTIONS_PER_WORKSPACE = 12;
export const MAX_REMINDERS_PER_TASK = 120;

export type PreferenceValues = Omit<Doc<'preferences'>, '_id' | '_creationTime' | 'workspaceId' | 'updatedAt'>;

export const DEFAULT_PREFERENCES: PreferenceValues = {
  pushEnabled: true,
  taskReminders: true,
  deadlineAlerts: true,
  dailyMotivation: false,
  recurringReminders: true,
  sound: 'default',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  urgentBypassQuietHours: true,
  dailyMotivationTime: '08:00',
  timezone: 'UTC',
  defaultReminderMinutes: 30,
};

export const MOTIVATION_MESSAGES = [
  'Good morning! Make today productive.',
  'Your goals are waiting for you.',
  'Small steps create extraordinary results.',
  'You are one step closer to your dreams.',
  'Progress, not perfection. Keep moving.',
  'Today is a beautiful day to become infinite.',
  'One focused hour can change your whole day.',
  'Your future self is cheering you on.',
];
