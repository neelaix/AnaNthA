import { api } from '../../convex/_generated/api';
import { convex, convexEnabled } from '../lib/convex';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { Settings } from '../types';
import { currentTimezone } from './reminderEngine';

export async function pushPreferences(partial: Partial<Settings>): Promise<void> {
  if (!convexEnabled || !convex) return;
  const identity = useWorkspaceStore.getState().identity;
  if (!identity) return;

  const payload: {
    workspaceId: string;
    deviceId: string;
    token: string;
    timezone: string;
    pushEnabled?: boolean;
    taskReminders?: boolean;
    deadlineAlerts?: boolean;
    dailyMotivation?: boolean;
    recurringReminders?: boolean;
    sound?: Settings['notificationSound'];
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    urgentBypassQuietHours?: boolean;
    dailyMotivationTime?: string;
    defaultReminderMinutes?: number;
  } = {
    workspaceId: identity.workspaceId,
    deviceId: identity.deviceId,
    token: identity.token,
    timezone: currentTimezone(),
  };

  if (partial.pushEnabled !== undefined) payload.pushEnabled = partial.pushEnabled;
  if (partial.taskReminders !== undefined) payload.taskReminders = partial.taskReminders;
  if (partial.deadlineAlerts !== undefined) payload.deadlineAlerts = partial.deadlineAlerts;
  if (partial.dailyMotivation !== undefined) payload.dailyMotivation = partial.dailyMotivation;
  if (partial.recurringReminders !== undefined) payload.recurringReminders = partial.recurringReminders;
  if (partial.notificationSound !== undefined) payload.sound = partial.notificationSound;
  if (partial.quietHoursEnabled !== undefined) payload.quietHoursEnabled = partial.quietHoursEnabled;
  if (partial.quietHoursStart !== undefined) payload.quietHoursStart = partial.quietHoursStart;
  if (partial.quietHoursEnd !== undefined) payload.quietHoursEnd = partial.quietHoursEnd;
  if (partial.urgentBypassQuietHours !== undefined) {
    payload.urgentBypassQuietHours = partial.urgentBypassQuietHours;
  }
  if (partial.dailyMotivationTime !== undefined) {
    payload.dailyMotivationTime = partial.dailyMotivationTime;
  }
  if (partial.defaultReminderMinutes !== undefined) {
    payload.defaultReminderMinutes = partial.defaultReminderMinutes;
  }

  try {
    await convex.mutation(api.preferences.update, payload);
  } catch (error) {
    console.warn('Could not sync notification preferences', error);
  }
}
