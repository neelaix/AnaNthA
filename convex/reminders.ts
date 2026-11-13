import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import {
  CLAIM_BATCH_SIZE,
  MAX_BODY_LENGTH,
  MAX_REMINDERS_PER_TASK,
  MAX_REMINDER_HORIZON_MS,
  MAX_TITLE_LENGTH,
} from './lib/defaults';

const reminderInput = v.object({
  occurrenceId: v.string(),
  category: v.union(v.literal('task-reminder'), v.literal('deadline-alert')),
  title: v.string(),
  body: v.string(),
  fireAt: v.number(),
  priority: v.union(v.literal('low'), v.literal('normal'), v.literal('high')),
  repeat: v.string(),
});

const taskPayload = v.object({
  taskId: v.string(),
  title: v.string(),
  completed: v.boolean(),
  timezone: v.string(),
  reminders: v.array(reminderInput),
});

type TaskPayload = {
  taskId: string;
  title: string;
  completed: boolean;
  timezone: string;
  reminders: Array<{
    occurrenceId: string;
    category: 'task-reminder' | 'deadline-alert';
    title: string;
    body: string;
    fireAt: number;
    priority: 'low' | 'normal' | 'high';
    repeat: string;
  }>;
};

async function cancelPendingForTask(
  ctx: any,
  workspaceId: string,
  taskId: string,
): Promise<number> {
  const existing = await ctx.db
    .query('reminders')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', workspaceId).eq('taskId', taskId),
    )
    .collect();

  let cancelled = 0;
  for (const reminder of existing) {
    if (reminder.status === 'pending') {
      await ctx.db.patch(reminder._id, {
        status: 'cancelled',
        updatedAt: Date.now(),
      });
      cancelled += 1;
    }
  }
  return cancelled;
}

async function syncTaskInternal(
  ctx: any,
  device: { workspaceId: string },
  payload: TaskPayload,
  now: number,
): Promise<{ inserted: number; updated: number; cancelled: number }> {
  const desired = payload.completed
    ? []
    : payload.reminders.slice(0, MAX_REMINDERS_PER_TASK);

  const desiredIds = new Set(desired.map((reminder) => reminder.occurrenceId));
  const existing = await ctx.db
    .query('reminders')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', device.workspaceId).eq('taskId', payload.taskId),
    )
    .collect();

  let cancelled = 0;
  for (const reminder of existing) {
    if (reminder.status === 'pending' && !desiredIds.has(reminder.occurrenceId)) {
      await ctx.db.patch(reminder._id, {
        status: 'cancelled',
        updatedAt: now,
      });
      cancelled += 1;
    }
  }

  let inserted = 0;
  let updated = 0;

  for (const reminder of desired) {
    if (!Number.isFinite(reminder.fireAt)) continue;
    if (reminder.fireAt < now - 5 * 60_000) continue;
    if (reminder.fireAt > now + MAX_REMINDER_HORIZON_MS) continue;

    const sanitized = {
      category: reminder.category,
      title: reminder.title.slice(0, MAX_TITLE_LENGTH),
      body: reminder.body.slice(0, MAX_BODY_LENGTH),
      fireAt: reminder.fireAt,
      timezone: payload.timezone || 'UTC',
      priority: reminder.priority,
      repeat: reminder.repeat.slice(0, 40),
    };

    const found = await ctx.db
      .query('reminders')
      .withIndex('by_dedupe', (q: any) =>
        q
          .eq('workspaceId', device.workspaceId)
          .eq('occurrenceId', reminder.occurrenceId),
      )
      .unique();

    if (found) {
      if (found.status === 'sent' || found.status === 'sending') continue;
      if (found.status === 'pending' || found.status === 'cancelled' || found.status === 'failed' || found.status === 'suppressed') {
        await ctx.db.patch(found._id, {
          ...sanitized,
          status: 'pending',
          attempts: 0,
          lastError: undefined,
          claimedAt: undefined,
          updatedAt: now,
        });
        updated += 1;
      }
      continue;
    }

    await ctx.db.insert('reminders', {
      workspaceId: device.workspaceId,
      taskId: payload.taskId,
      occurrenceId: reminder.occurrenceId,
      category: sanitized.category,
      title: sanitized.title,
      body: sanitized.body,
      fireAt: sanitized.fireAt,
      timezone: sanitized.timezone,
      priority: sanitized.priority,
      repeat: sanitized.repeat,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    inserted += 1;
  }

  return { inserted, updated, cancelled };
}

export const syncAll = mutation({
  args: {
    ...authArgs,
    tasks: v.array(taskPayload),
    removeTaskIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    let cancelled = 0;

    for (const taskId of args.removeTaskIds.slice(0, 100)) {
      cancelled += await cancelPendingForTask(ctx, device.workspaceId, taskId);
    }

    for (const payload of args.tasks.slice(0, 60)) {
      const result = await syncTaskInternal(ctx, device, payload as TaskPayload, now);
      inserted += result.inserted;
      updated += result.updated;
      cancelled += result.cancelled;
    }

    return { inserted, updated, cancelled };
  },
});

export const removeTasks = mutation({
  args: { ...authArgs, taskIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    let cancelled = 0;
    for (const taskId of args.taskIds.slice(0, 100)) {
      cancelled += await cancelPendingForTask(ctx, device.workspaceId, taskId);
    }
    return { cancelled };
  },
});

export const claimDue = internalMutation({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const now = args.now;
    const staleBefore = now - 10 * 60_000;

    const staleSending = await ctx.db
      .query('reminders')
      .withIndex('by_status_fireAt', (q) => q.eq('status', 'sending'))
      .take(100);
    for (const reminder of staleSending) {
      if ((reminder.claimedAt ?? 0) < staleBefore) {
        await ctx.db.patch(reminder._id, {
          status: 'pending',
          claimedAt: undefined,
          updatedAt: now,
        });
      }
    }

    const due = await ctx.db
      .query('reminders')
      .withIndex('by_status_fireAt', (q: any) =>
        q.eq('status', 'pending').lte('fireAt', now),
      )
      .take(CLAIM_BATCH_SIZE);

    for (const reminder of due) {
      await ctx.db.patch(reminder._id, {
        status: 'sending',
        claimedAt: now,
        attempts: reminder.attempts + 1,
        updatedAt: now,
      });
    }

    return due.map((reminder) => ({ ...reminder, status: 'sending' as const }));
  },
});

export const markResult = internalMutation({
  args: {
    reminderId: v.id('reminders'),
    sent: v.boolean(),
    attempts: v.number(),
    error: v.optional(v.string()),
    removeEndpoints: v.array(v.string()),
    nextRetryAt: v.optional(v.number()),
    notification: v.optional(
      v.object({
        title: v.string(),
        body: v.string(),
        category: v.union(
          v.literal('task-reminder'),
          v.literal('deadline-alert'),
          v.literal('daily-motivation'),
          v.literal('system'),
        ),
        taskId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) return { ok: false };

    for (const endpoint of args.removeEndpoints.slice(0, 50)) {
      const subscription = await ctx.db
        .query('subscriptions')
        .withIndex('by_endpoint', (q) => q.eq('endpoint', endpoint))
        .unique();
      if (subscription) await ctx.db.delete(subscription._id);
    }

    if (args.sent) {
      await ctx.db.patch(args.reminderId, {
        status: 'sent',
        sentAt: now,
        claimedAt: undefined,
        lastError: undefined,
        attempts: args.attempts,
        updatedAt: now,
      });

      if (args.notification) {
        const existingNotification = await ctx.db
          .query('notifications')
          .withIndex('by_reminder', (q) => q.eq('reminderId', args.reminderId))
          .first();
        if (!existingNotification) {
          await ctx.db.insert('notifications', {
            workspaceId: reminder.workspaceId,
            title: args.notification.title.slice(0, MAX_TITLE_LENGTH),
            body: args.notification.body.slice(0, MAX_BODY_LENGTH),
            category: args.notification.category,
            taskId: args.notification.taskId,
            reminderId: args.reminderId,
            createdAt: now,
            read: false,
          });
        }
      }
      return { ok: true };
    }

    if (args.nextRetryAt && args.nextRetryAt > now) {
      await ctx.db.patch(args.reminderId, {
        status: 'pending',
        fireAt: args.nextRetryAt,
        claimedAt: undefined,
        attempts: args.attempts,
        lastError: args.error?.slice(0, 300),
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(args.reminderId, {
        status: 'failed',
        claimedAt: undefined,
        attempts: args.attempts,
        lastError: args.error?.slice(0, 300),
        updatedAt: now,
      });
    }
    return { ok: true };
  },
});

export const defer = internalMutation({
  args: {
    reminderId: v.id('reminders'),
    fireAt: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder || reminder.status !== 'sending') return;
    await ctx.db.patch(args.reminderId, {
      status: 'pending',
      fireAt: args.fireAt,
      claimedAt: undefined,
      lastError: args.reason?.slice(0, 300),
      updatedAt: Date.now(),
    });
  },
});

export const suppress = internalMutation({
  args: { reminderId: v.id('reminders'), reason: v.string() },
  handler: async (ctx, args) => {
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) return;
    await ctx.db.patch(args.reminderId, {
      status: 'suppressed',
      claimedAt: undefined,
      lastError: args.reason.slice(0, 300),
      updatedAt: Date.now(),
    });
  },
});
