import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { reminderConfig, recurrence, taskPriority } from './schema';
import { listTasksForWorkspace, removeTask, setTaskCompleted, toPublicTask, upsertTask } from './lib/taskOps';
import { applyTaskReminders } from './lib/reminderPlan';

const taskFields = {
  taskId: v.optional(v.string()),
  title: v.string(),
  description: v.optional(v.string()),
  notes: v.optional(v.string()),
  priority: v.optional(taskPriority),
  categoryId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  deadline: v.optional(v.number()),
  startAt: v.optional(v.number()),
  timezone: v.optional(v.string()),
  completed: v.optional(v.boolean()),
  completedAt: v.optional(v.number()),
  recurrence: v.optional(recurrence),
  reminder: v.optional(reminderConfig),
  parentTaskId: v.optional(v.string()),
  occurrenceKey: v.optional(v.string()),
  isRecurringInstance: v.optional(v.boolean()),
  clientUpdatedAt: v.optional(v.number()),
};

export const upsert = mutation({
  args: { ...authArgs, task: v.object(taskFields) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    return await upsertTask(ctx, device, args.task);
  },
});

export const setCompleted = mutation({
  args: { ...authArgs, taskId: v.string(), completed: v.boolean() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    return await setTaskCompleted(ctx, device, args.taskId, args.completed);
  },
});

export const remove = mutation({
  args: { ...authArgs, taskId: v.string() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    return await removeTask(ctx, device, args.taskId);
  },
});

export const bulkUpsert = mutation({
  args: { ...authArgs, tasks: v.array(v.object(taskFields)), migration: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    let inserted = 0;
    let updated = 0;
    let cancelled = 0;
    const errors: string[] = [];

    for (const task of args.tasks.slice(0, 100)) {
      try {
        const existing = task.taskId
          ? await ctx.db
              .query('tasks')
              .withIndex('by_workspace_task', (q: any) =>
                q.eq('workspaceId', device.workspaceId).eq('taskId', task.taskId!),
              )
              .unique()
          : null;
        const result = await upsertTask(ctx, device, task);
        if (existing) updated += 1;
        else inserted += 1;
        cancelled += result.cancelled;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Import failed');
      }
    }

    return { inserted, updated, cancelled, errors };
  },
});

export const list = query({
  args: { ...authArgs, limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const limit = Math.max(1, Math.min(1000, args.limit ?? 500));
    const tasks = await listTasksForWorkspace(ctx, device.workspaceId, limit);
    return tasks.filter((task: any) => !task.deletedAt).map(toPublicTask);
  },
});

export const get = query({
  args: { ...authArgs, taskId: v.string() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const task = await ctx.db
      .query('tasks')
      .withIndex('by_workspace_task', (q: any) =>
        q.eq('workspaceId', device.workspaceId).eq('taskId', args.taskId),
      )
      .unique();
    if (!task || task.deletedAt) return null;
    return toPublicTask(task);
  },
});

export const rebuildReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query('workspaces').take(500);
    let tasks = 0;
    for (const workspace of workspaces) {
      const rows = await ctx.db
        .query('tasks')
        .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', workspace.workspaceId))
        .order('desc')
        .take(500);
      for (const task of rows) {
        if (task.deletedAt) continue;
        await applyTaskReminders(
          ctx,
          {
            workspaceId: task.workspaceId,
            taskId: task.taskId,
            title: task.title,
            completed: task.completed,
            deletedAt: task.deletedAt,
            deadline: task.deadline,
            timezone: task.timezone,
            recurrence: task.recurrence,
            reminder: task.reminder,
          },
          Date.now(),
        );
        tasks += 1;
      }
    }
    return { tasks };
  },
});