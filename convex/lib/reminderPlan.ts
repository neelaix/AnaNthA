import { MAX_REMINDERS_PER_TASK, MAX_REMINDER_HORIZON_MS } from './defaults';
import { localDateKey, localToUtc, occurrenceInstants, safeZone } from './recurrence';

export type PlannedReminder = {
  occurrenceId: string;
  category: 'task-reminder' | 'deadline-alert';
  title: string;
  body: string;
  fireAt: number;
  priority: 'low' | 'normal' | 'high';
  repeat: string;
};

export type TaskForPlan = {
  workspaceId?: string;
  taskId: string;
  title: string;
  completed: boolean;
  deletedAt?: number;
  deadline?: number;
  timezone: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    endAt?: number;
    count?: number;
  };
  reminder?: {
    enabled: boolean;
    offsets: number[];
    time?: string;
    date?: string;
    notifyAtDeadline: boolean;
    priority: 'low' | 'normal' | 'high';
    repeat?: string;
    message?: string;
  };
};

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

export function priorityFromTask(priority: string): 'low' | 'normal' | 'high' {
  if (priority === 'urgent' || priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'normal';
}

export function planTaskReminders(task: TaskForPlan, nowMs: number): PlannedReminder[] {
  const config = task.reminder;
  if (!config?.enabled || task.completed || task.deletedAt) return [];

  const zone = safeZone(task.timezone);
  const horizon = nowMs + MAX_REMINDER_HORIZON_MS;
  const planned = new Map<number, PlannedReminder>();
  const customMessage = config.message?.trim();
  const priority = config.priority || 'normal';

  const add = (fireAt: number, category: 'task-reminder' | 'deadline-alert', body: string) => {
    if (!Number.isFinite(fireAt)) return;
    if (fireAt <= nowMs - 60_000 || fireAt > horizon) return;
    const existing = planned.get(fireAt);
    if (existing) {
      if (category === 'deadline-alert') existing.category = 'deadline-alert';
      return;
    }
    planned.set(fireAt, {
      occurrenceId: `${task.taskId}:${fireAt}`,
      category,
      title: task.title,
      body,
      fireAt,
      priority,
      repeat: task.recurrence?.frequency ?? config.repeat ?? 'none',
    });
  };

  let instants: number[] = [];
  if (task.deadline) {
    instants = occurrenceInstants(task.recurrence, task.deadline, zone, nowMs - 24 * 60 * 60 * 1000, horizon);
    if (instants.length === 0 && task.deadline > nowMs - 60_000) instants = [task.deadline];
  }

  const explicitDate = config.date ? localToUtc(config.date, config.time ?? '09:00', zone) : undefined;

  for (const instant of instants) {
    if (config.time) {
      const key = localDateKey(instant, zone);
      add(localToUtc(key, config.time, zone), 'task-reminder', customMessage || `Reminder: "${task.title}"`);
    } else {
      add(instant, 'task-reminder', customMessage || `Reminder: "${task.title}"`);
    }

    for (const offset of config.offsets) {
      if (!Number.isFinite(offset) || offset <= 0) continue;
      add(
        instant - offset * 60_000,
        'deadline-alert',
        customMessage || `${task.title} is due in ${formatOffset(offset)}.`,
      );
    }
    if (config.notifyAtDeadline) {
      add(instant, 'deadline-alert', customMessage || `"${task.title}" is due now.`);
    }
  }

  if (instants.length === 0 && explicitDate) {
    add(explicitDate, 'task-reminder', customMessage || `Reminder: "${task.title}"`);
  }

  return Array.from(planned.values())
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_REMINDERS_PER_TASK);
}

export async function applyTaskReminders(ctx: any, task: TaskForPlan, nowMs: number): Promise<number> {
  const desired = planTaskReminders(task, nowMs);
  const desiredIds = new Set(desired.map((item) => item.occurrenceId));
  const existing = await ctx.db
    .query('reminders')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', taskWorkspace(task)).eq('taskId', task.taskId),
    )
    .collect();

  let changed = 0;
  for (const reminder of existing) {
    if (reminder.status === 'pending' && !desiredIds.has(reminder.occurrenceId)) {
      await ctx.db.patch(reminder._id, { status: 'cancelled', updatedAt: nowMs });
      changed += 1;
    }
  }

  for (const item of desired) {
    const found = await ctx.db
      .query('reminders')
      .withIndex('by_dedupe', (q: any) =>
        q.eq('workspaceId', taskWorkspace(task)).eq('occurrenceId', item.occurrenceId),
      )
      .unique();

    if (found) {
      if (found.status === 'sent' || found.status === 'sending') continue;
      if (found.status !== 'pending') {
        await ctx.db.patch(found._id, {
          title: item.title.slice(0, 160),
          body: item.body.slice(0, 500),
          fireAt: item.fireAt,
          timezone: task.timezone || 'UTC',
          priority: item.priority,
          repeat: item.repeat,
          category: item.category,
          source: 'server',
          status: 'pending',
          attempts: 0,
          lastError: undefined,
          claimedAt: undefined,
          updatedAt: nowMs,
        });
        changed += 1;
      }
      continue;
    }

    await ctx.db.insert('reminders', {
      workspaceId: taskWorkspace(task),
      taskId: task.taskId,
      occurrenceId: item.occurrenceId,
      category: item.category,
      title: item.title.slice(0, 160),
      body: item.body.slice(0, 500),
      fireAt: item.fireAt,
      timezone: task.timezone || 'UTC',
      priority: item.priority,
      repeat: item.repeat,
      status: 'pending',
      source: 'server',
      attempts: 0,
      createdAt: nowMs,
      updatedAt: nowMs,
    });
    changed += 1;
  }

  return changed;
}

function taskWorkspace(task: TaskForPlan & { workspaceId?: string }): string {
  return task.workspaceId ?? '';
}

export async function cancelTaskReminders(ctx: any, workspaceId: string, taskId: string, nowMs: number): Promise<number> {
  const existing = await ctx.db
    .query('reminders')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', workspaceId).eq('taskId', taskId),
    )
    .collect();

  let cancelled = 0;
  for (const reminder of existing) {
    if (reminder.status === 'pending') {
      await ctx.db.patch(reminder._id, { status: 'cancelled', updatedAt: nowMs });
      cancelled += 1;
    }
  }
  return cancelled;
}
