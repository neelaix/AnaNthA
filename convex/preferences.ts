import { v } from 'convex/values';
import { internalQuery, mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { DEFAULT_PREFERENCES } from './lib/defaults';

const timeString = v.optional(v.string());

function sanitizeTime(value: string | undefined, fallback: string): string {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return fallback;
  return value;
}

function sanitizeTimezone(value: string | undefined, fallback: string): string {
  if (!value || value.length > 64) return fallback;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return value;
  } catch {
    return fallback;
  }
}

export const get = query({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const preferences = await ctx.db
      .query('preferences')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', device.workspaceId))
      .unique();

    if (!preferences) {
      return { ...DEFAULT_PREFERENCES, workspaceId: device.workspaceId, updatedAt: 0 };
    }

    const { _id, _creationTime, ...rest } = preferences;
    return rest;
  },
});

export const update = mutation({
  args: {
    ...authArgs,
    pushEnabled: v.optional(v.boolean()),
    taskReminders: v.optional(v.boolean()),
    deadlineAlerts: v.optional(v.boolean()),
    dailyMotivation: v.optional(v.boolean()),
    recurringReminders: v.optional(v.boolean()),
    sound: v.optional(
      v.union(
        v.literal('default'),
        v.literal('soft'),
        v.literal('urgent'),
        v.literal('silent'),
      ),
    ),
    quietHoursEnabled: v.optional(v.boolean()),
    quietHoursStart: timeString,
    quietHoursEnd: timeString,
    urgentBypassQuietHours: v.optional(v.boolean()),
    dailyMotivationTime: timeString,
    timezone: v.optional(v.string()),
    defaultReminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const existing = await ctx.db
      .query('preferences')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', device.workspaceId))
      .unique();

    const base = existing
      ? {
          pushEnabled: existing.pushEnabled,
          taskReminders: existing.taskReminders,
          deadlineAlerts: existing.deadlineAlerts,
          dailyMotivation: existing.dailyMotivation,
          recurringReminders: existing.recurringReminders,
          sound: existing.sound,
          quietHoursEnabled: existing.quietHoursEnabled,
          quietHoursStart: existing.quietHoursStart,
          quietHoursEnd: existing.quietHoursEnd,
          urgentBypassQuietHours: existing.urgentBypassQuietHours,
          dailyMotivationTime: existing.dailyMotivationTime,
          timezone: existing.timezone,
          defaultReminderMinutes: existing.defaultReminderMinutes,
        }
      : DEFAULT_PREFERENCES;

    const next = {
      pushEnabled: args.pushEnabled ?? base.pushEnabled,
      taskReminders: args.taskReminders ?? base.taskReminders,
      deadlineAlerts: args.deadlineAlerts ?? base.deadlineAlerts,
      dailyMotivation: args.dailyMotivation ?? base.dailyMotivation,
      recurringReminders: args.recurringReminders ?? base.recurringReminders,
      sound: args.sound ?? base.sound,
      quietHoursEnabled: args.quietHoursEnabled ?? base.quietHoursEnabled,
      quietHoursStart: sanitizeTime(args.quietHoursStart, base.quietHoursStart),
      quietHoursEnd: sanitizeTime(args.quietHoursEnd, base.quietHoursEnd),
      urgentBypassQuietHours:
        args.urgentBypassQuietHours ?? base.urgentBypassQuietHours,
      dailyMotivationTime: sanitizeTime(
        args.dailyMotivationTime,
        base.dailyMotivationTime,
      ),
      timezone: sanitizeTimezone(args.timezone, base.timezone),
      defaultReminderMinutes: Math.max(
        1,
        Math.min(
          10080,
          Math.round(args.defaultReminderMinutes ?? base.defaultReminderMinutes),
        ),
      ),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return next;
    }

    await ctx.db.insert('preferences', {
      workspaceId: device.workspaceId,
      ...next,
    });
    return next;
  },
});

export const getForWorkspace = internalQuery({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query('preferences')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .unique();
    if (!preferences) return null;
    return preferences;
  },
});

export const listWithDailyMotivation = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('preferences')
      .filter((q) => q.eq(q.field('dailyMotivation'), true))
      .take(500);
  },
});
