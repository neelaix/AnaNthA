import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';

export const list = query({
  args: { ...authArgs, limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const limit = Math.max(1, Math.min(150, args.limit ?? 100));
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_workspace_created', (q) => q.eq('workspaceId', device.workspaceId))
      .order('desc')
      .take(limit);

    return notifications.map((notification) => ({
      id: notification._id,
      title: notification.title,
      body: notification.body,
      category: notification.category,
      taskId: notification.taskId,
      createdAt: notification.createdAt,
      read: notification.read,
    }));
  },
});

export const unreadCount = query({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_workspace_created', (q) => q.eq('workspaceId', device.workspaceId))
      .order('desc')
      .take(300);
    return notifications.filter((notification) => !notification.read).length;
  },
});

export const insert = internalMutation({
  args: {
    workspaceId: v.string(),
    title: v.string(),
    body: v.string(),
    category: v.union(
      v.literal('task-reminder'),
      v.literal('deadline-alert'),
      v.literal('daily-motivation'),
      v.literal('system'),
    ),
    taskId: v.optional(v.string()),
    reminderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('notifications', {
      workspaceId: args.workspaceId,
      title: args.title.slice(0, 160),
      body: args.body.slice(0, 500),
      category: args.category,
      taskId: args.taskId,
      reminderId: args.reminderId,
      createdAt: Date.now(),
      read: false,
    });
  },
});

export const markRead = mutation({
  args: { ...authArgs, notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.workspaceId !== device.workspaceId) return;
    if (!notification.read) await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_workspace_created', (q) => q.eq('workspaceId', device.workspaceId))
      .order('desc')
      .take(300);
    for (const notification of notifications) {
      if (!notification.read) await ctx.db.patch(notification._id, { read: true });
    }
  },
});

export const remove = mutation({
  args: { ...authArgs, notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.workspaceId !== device.workspaceId) return;
    await ctx.db.delete(args.notificationId);
  },
});

export const clearAll = mutation({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_workspace_created', (q) => q.eq('workspaceId', device.workspaceId))
      .order('desc')
      .take(500);
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    return { removed: notifications.length };
  },
});
