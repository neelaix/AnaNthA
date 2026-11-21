import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { applyCategoryUpsert } from './categories';
import {
  removeTask,
  setTaskCompleted,
  toPublicTask,
  upsertTask,
  type TaskInput,
} from './lib/taskOps';

const taskObject = v.object({
  taskId: v.optional(v.string()),
  title: v.string(),
  description: v.optional(v.string()),
  notes: v.optional(v.string()),
  priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent'))),
  categoryId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  deadline: v.optional(v.number()),
  startAt: v.optional(v.number()),
  timezone: v.optional(v.string()),
  completed: v.optional(v.boolean()),
  completedAt: v.optional(v.number()),
  recurrence: v.optional(v.object({
    frequency: v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'), v.literal('yearly')),
    interval: v.number(),
    daysOfWeek: v.optional(v.array(v.number())),
    endAt: v.optional(v.number()),
    count: v.optional(v.number()),
  })),
  reminder: v.optional(v.object({
    enabled: v.boolean(),
    offsets: v.array(v.number()),
    time: v.optional(v.string()),
    date: v.optional(v.string()),
    notifyAtDeadline: v.boolean(),
    priority: v.union(v.literal('low'), v.literal('normal'), v.literal('high')),
    repeat: v.optional(v.string()),
    message: v.optional(v.string()),
  })),
  parentTaskId: v.optional(v.string()),
  occurrenceKey: v.optional(v.string()),
  isRecurringInstance: v.optional(v.boolean()),
  clientUpdatedAt: v.optional(v.number()),
});

const categoryObject = v.object({
  categoryId: v.optional(v.string()),
  name: v.string(),
  color: v.string(),
  icon: v.optional(v.string()),
  isCustom: v.optional(v.boolean()),
  order: v.optional(v.number()),
  clientUpdatedAt: v.optional(v.number()),
});

const op = v.object({
  opId: v.string(),
  type: v.union(
    v.literal('task.upsert'),
    v.literal('task.complete'),
    v.literal('task.remove'),
    v.literal('category.upsert'),
    v.literal('category.remove'),
  ),
  task: v.optional(taskObject),
  category: v.optional(categoryObject),
  taskId: v.optional(v.string()),
  categoryId: v.optional(v.string()),
  completed: v.optional(v.boolean()),
});

export const pull = query({
  args: { ...authArgs, cursor: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const cursor = Math.max(0, Math.floor(args.cursor ?? 0));
    const limit = Math.max(1, Math.min(200, args.limit ?? 100));

    const [tasks, categories, focus] = await Promise.all([
      ctx.db
        .query('tasks')
        .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', device.workspaceId).gt('seq', cursor))
        .order('asc')
        .take(limit),
      ctx.db
        .query('categories')
        .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', device.workspaceId).gt('seq', cursor))
        .order('asc')
        .take(limit),
      ctx.db
        .query('focusSessions')
        .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', device.workspaceId).gt('seq', cursor))
        .order('asc')
        .take(limit),
    ]);

    const prefs = await ctx.db
      .query('preferences')
      .withIndex('by_workspace', (q: any) => q.eq('workspaceId', device.workspaceId))
      .unique();

    const allSeq = [
      ...tasks.map((item: any) => item.seq),
      ...categories.map((item: any) => item.seq),
      ...focus.map((item: any) => item.seq),
    ];
    const nextCursor = allSeq.length > 0 ? Math.max(...allSeq) : cursor;

    return {
      cursor: nextCursor,
      serverTime: Date.now(),
      hasMore:
        tasks.length === limit || categories.length === limit || focus.length === limit,
      tasks: tasks.map(toPublicTask),
      categories: categories.map((item: any) => ({
        categoryId: item.categoryId,
        name: item.name,
        color: item.color,
        icon: item.icon,
        isCustom: item.isCustom,
        order: item.order,
        seq: item.seq,
        version: item.version,
        deletedAt: item.deletedAt,
        updatedAt: item.updatedAt,
      })),
      focus: focus.map((item: any) => ({
        sessionId: item.sessionId,
        taskId: item.taskId,
        kind: item.kind,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        plannedMinutes: item.plannedMinutes,
        completed: item.completed,
        seq: item.seq,
        deletedAt: item.deletedAt,
      })),
      preferences: prefs
        ? {
            pushEnabled: prefs.pushEnabled,
            taskReminders: prefs.taskReminders,
            deadlineAlerts: prefs.deadlineAlerts,
            dailyMotivation: prefs.dailyMotivation,
            recurringReminders: prefs.recurringReminders,
            sound: prefs.sound,
            quietHoursEnabled: prefs.quietHoursEnabled,
            quietHoursStart: prefs.quietHoursStart,
            quietHoursEnd: prefs.quietHoursEnd,
            urgentBypassQuietHours: prefs.urgentBypassQuietHours,
            dailyMotivationTime: prefs.dailyMotivationTime,
            timezone: prefs.timezone,
            defaultReminderMinutes: prefs.defaultReminderMinutes,
            focusMinutes: prefs.focusMinutes ?? 25,
            shortBreakMinutes: prefs.shortBreakMinutes ?? 5,
            longBreakMinutes: prefs.longBreakMinutes ?? 15,
            updatedAt: prefs.updatedAt,
          }
        : null,
    };
  },
});

export const push = mutation({
  args: { ...authArgs, ops: v.array(op) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const results: Array<{ opId: string; ok: boolean; error?: string; task?: any }> = [];

    for (const item of args.ops.slice(0, 50)) {
      const seen = await ctx.db
        .query('syncOps')
        .withIndex('by_workspace_op', (q: any) =>
          q.eq('workspaceId', device.workspaceId).eq('opId', item.opId),
        )
        .unique();
      if (seen) {
        results.push({ opId: item.opId, ok: true });
        continue;
      }

      try {
        let task: any;
        if (item.type === 'task.upsert') {
          if (!item.task) throw new Error('Missing task payload');
          task = (await upsertTask(ctx, device, item.task as TaskInput)).task;
        } else if (item.type === 'task.complete') {
          if (!item.taskId) throw new Error('Missing taskId');
          task = (await setTaskCompleted(ctx, device, item.taskId, item.completed ?? true)).task;
        } else if (item.type === 'task.remove') {
          if (!item.taskId) throw new Error('Missing taskId');
          await removeTask(ctx, device, item.taskId);
        } else if (item.type === 'category.upsert') {
          if (!item.category) throw new Error('Missing category payload');
          await applyCategoryUpsert(ctx, device, item.category, Date.now());
        } else if (item.type === 'category.remove') {
          if (!item.categoryId) throw new Error('Missing categoryId');
          const existing = await ctx.db
            .query('categories')
            .withIndex('by_workspace_category', (q: any) =>
              q.eq('workspaceId', device.workspaceId).eq('categoryId', item.categoryId!),
            )
            .unique();
          if (existing && !existing.deletedAt) {
            await ctx.db.patch(existing._id, {
              deletedAt: Date.now(),
              updatedAt: Date.now(),
              version: existing.version + 1,
            });
          }
        }
        await ctx.db.insert('syncOps', {
          workspaceId: device.workspaceId,
          opId: item.opId,
          appliedAt: Date.now(),
        });
        results.push({ opId: item.opId, ok: true, task });
      } catch (error) {
        results.push({
          opId: item.opId,
          ok: false,
          error: error instanceof Error ? error.message : 'Sync operation failed',
        });
      }
    }

    return { results };
  },
});
