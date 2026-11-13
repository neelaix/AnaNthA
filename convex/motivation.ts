import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';

export const alreadySent = internalQuery({
  args: { workspaceId: v.string(), dateKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('motivationSends')
      .withIndex('by_workspace_date', (q: any) =>
        q.eq('workspaceId', args.workspaceId).eq('dateKey', args.dateKey),
      )
      .unique();
    return Boolean(existing);
  },
});

export const record = internalMutation({
  args: {
    workspaceId: v.string(),
    dateKey: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('motivationSends')
      .withIndex('by_workspace_date', (q: any) =>
        q.eq('workspaceId', args.workspaceId).eq('dateKey', args.dateKey),
      )
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    const id = await ctx.db.insert('motivationSends', {
      workspaceId: args.workspaceId,
      dateKey: args.dateKey,
      sentAt: now,
    });
    await ctx.db.insert('notifications', {
      workspaceId: args.workspaceId,
      title: args.title.slice(0, 160),
      body: args.body.slice(0, 500),
      category: 'daily-motivation',
      createdAt: now,
      read: false,
    });
    return id;
  },
});
