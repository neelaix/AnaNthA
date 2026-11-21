import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { applyCategoryUpsert } from './categories';
import { upsertTask, type TaskInput } from './lib/taskOps';

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

export const importLocal = mutation({
  args: {
    ...authArgs,
    tasks: v.array(taskObject),
    categories: v.array(categoryObject),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const now = Date.now();

    if (args.dryRun) {
      let existing = 0;
      for (const task of args.tasks.slice(0, 500)) {
        if (!task.taskId) continue;
        const found = await ctx.db
          .query('tasks')
          .withIndex('by_workspace_task', (q: any) =>
            q.eq('workspaceId', device.workspaceId).eq('taskId', task.taskId!),
          )
          .unique();
        if (found && !found.deletedAt) existing += 1;
      }
      return {
        dryRun: true,
        tasks: args.tasks.length,
        categories: args.categories.length,
        alreadyImported: existing,
      };
    }

    let categoriesInserted = 0;
    let categoriesUpdated = 0;
    let tasksInserted = 0;
    let tasksUpdated = 0;
    const errors: string[] = [];

    for (const category of args.categories.slice(0, 100)) {
      try {
        const found = category.categoryId
          ? await ctx.db
              .query('categories')
              .withIndex('by_workspace_category', (q: any) =>
                q.eq('workspaceId', device.workspaceId).eq('categoryId', category.categoryId!),
              )
              .unique()
          : null;
        await applyCategoryUpsert(ctx, device, category, now);
        if (found) categoriesUpdated += 1;
        else categoriesInserted += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Category import failed');
      }
    }

    for (const task of args.tasks.slice(0, 100)) {
      try {
        const found = task.taskId
          ? await ctx.db
              .query('tasks')
              .withIndex('by_workspace_task', (q: any) =>
                q.eq('workspaceId', device.workspaceId).eq('taskId', task.taskId!),
              )
              .unique()
          : null;
        await upsertTask(ctx, device, task as TaskInput, now);
        if (found) tasksUpdated += 1;
        else tasksInserted += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Task import failed');
      }
    }

    return {
      dryRun: false,
      categoriesInserted,
      categoriesUpdated,
      tasksInserted,
      tasksUpdated,
      errors,
      remainingTasks: Math.max(0, args.tasks.length - 100),
    };
  },
});
