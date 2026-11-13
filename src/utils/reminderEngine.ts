import { addDays, addMonths, addWeeks } from 'date-fns';
import type { ReminderConfig, Task } from '../types';
import { generateRecurrenceInstances } from './recurrence';

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: false,
  offsets: [10, 30, 60],
  notifyAtDeadline: false,
  priority: 'normal',
  repeat: 'none',
};

export const REMINDER_OFFSETS = [10, 30, 60, 1440];

const HORIZON_DAYS = 30;
const MAX_PLANNED = 120;

export interface PlannedReminder {
  occurrenceId: string;
  category: 'task-reminder' | 'deadline-alert';
  title: string;
  body: string;
  fireAt: number;
  priority: 'low' | 'normal' | 'high';
  repeat: string;
}

export function toDate(value?: Date | string): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseLocalDateTime(date: string, time: string): Date | undefined {
  if (!date) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = (time || '09:00').split(':').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) return undefined;
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

export function currentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatOffset(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  if (minutes >= 60) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function planReminders(task: Task, now: Date = new Date()): PlannedReminder[] {
  const config = task.reminder;
  if (!config?.enabled || task.completed) return [];

  const nowMs = now.getTime();
  const horizon = nowMs + HORIZON_DAYS * 24 * 60 * 60 * 1000;
  const deadline = toDate(task.deadline);
  const explicitDate = config.date
    ? parseLocalDateTime(config.date, config.time ?? '09:00')
    : undefined;

  if (!deadline && !explicitDate) return [];

  const customMessage = config.message?.trim();
  const repeat = task.recurrence ? task.recurrence.frequency : config.repeat;
  const planned = new Map<number, PlannedReminder>();

  const add = (
    fireAt: number,
    category: 'task-reminder' | 'deadline-alert',
    body: string,
  ) => {
    if (!Number.isFinite(fireAt)) return;
    if (fireAt <= nowMs - 60_000 || fireAt > horizon) return;
    const existing = planned.get(fireAt);
    if (existing) {
      if (category === 'deadline-alert') existing.category = 'deadline-alert';
      return;
    }
    planned.set(fireAt, {
      occurrenceId: `${task.id}:${fireAt}`,
      category,
      title: task.title,
      body,
      fireAt,
      priority: config.priority,
      repeat,
    });
  };

  const occurrences: Array<{ date: Date; deadline?: Date }> = [];
  if (task.recurrence && deadline) {
    const windowStart = new Date(Math.min(nowMs - 24 * 60 * 60 * 1000, deadline.getTime() - 24 * 60 * 60 * 1000));
    const instances = generateRecurrenceInstances(task, windowStart, new Date(horizon));
    for (const instance of instances) {
      const instanceDeadline = toDate(instance.deadline);
      if (instanceDeadline) occurrences.push({ date: instanceDeadline, deadline: instanceDeadline });
    }
    if (occurrences.length === 0) occurrences.push({ date: deadline, deadline });
  } else {
    occurrences.push({ date: explicitDate ?? deadline ?? now, deadline });
  }

  for (const occurrence of occurrences) {
    if (config.time) {
      const primary = new Date(occurrence.date);
      const [hour, minute] = config.time.split(':').map(Number);
      primary.setHours(hour || 0, minute || 0, 0, 0);
      add(
        primary.getTime(),
        'task-reminder',
        customMessage || `Reminder: "${task.title}"`,
      );
    } else if (occurrence.deadline) {
      add(
        occurrence.deadline.getTime(),
        'task-reminder',
        customMessage || `Reminder: "${task.title}"`,
      );
    }

    if (occurrence.deadline) {
      for (const offset of config.offsets) {
        if (!Number.isFinite(offset) || offset <= 0) continue;
        add(
          occurrence.deadline.getTime() - offset * 60_000,
          'deadline-alert',
          customMessage || `${task.title} is due in ${formatOffset(offset)}.`,
        );
      }
      if (config.notifyAtDeadline) {
        add(
          occurrence.deadline.getTime(),
          'deadline-alert',
          customMessage || `"${task.title}" is due now.`,
        );
      }
    }
  }

  if (!task.recurrence && config.repeat !== 'none') {
    const base = Array.from(planned.values());
    for (const reminder of base) {
      for (let step = 1; step <= 45; step += 1) {
        const next =
          config.repeat === 'daily'
            ? addDays(reminder.fireAt, step)
            : config.repeat === 'weekly'
              ? addWeeks(reminder.fireAt, step)
              : addMonths(reminder.fireAt, step);
        if (next.getTime() > horizon) break;
        add(next.getTime(), reminder.category, reminder.body);
      }
    }
  }

  return Array.from(planned.values())
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_PLANNED);
}

export function nextReminderLabel(task: Task): string | null {
  const next = planReminders(task)[0];
  if (!next) return null;
  return new Date(next.fireAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
