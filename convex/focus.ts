import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { nextSeq } from './lib/taskOps';

export const record = mutation({
  args: {
    ...authArgs,
    sessionId: v.string(),
    taskId: v.optional(v.string()),
    kind: v.union(v.literal('focus'), v.literal('short-break'), v.literal('long-break')),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    plannedMinutes: v.number(),
    completed: v.boolean(),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const now = Date.now();
    const existing = await ctx.db
      .query('focusSessions')
      .withIndex('by_workspace_session', (q: any) =>
        q.eq('workspaceId', device.workspaceId).eq('sessionId', args.sessionId),
      )
      .unique();
    const seq = await nextSeq(ctx, device.workspaceId);
    const doc = {
      workspaceId: device.workspaceId,
      sessionId: args.sessionId.slice(0, 80),
      taskId: args.taskId,
      kind: args.kind,
      startedAt: args.startedAt,
      endedAt: args.endedAt,
      plannedMinutes: Math.max(1, Math.min(720, Math.round(args.plannedMinutes))),
      completed: args.completed,
      timezone: args.timezone ?? 'UTC',
      seq,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { sessionId: args.sessionId, seq };
    }
    await ctx.db.insert('focusSessions', doc);
    return { sessionId: args.sessionId, seq };
  },
});

export const list = query({
  args: { ...authArgs, limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const limit = Math.max(1, Math.min(500, args.limit ?? 120));
    const sessions = await ctx.db
      .query('focusSessions')
      .withIndex('by_workspace_started', (q: any) => q.eq('workspaceId', device.workspaceId))
      .order('desc')
      .take(limit);
    return sessions
      .filter((item: any) => !item.deletedAt)
      .map((item: any) => ({
        sessionId: item.sessionId,
        taskId: item.taskId,
        kind: item.kind,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        plannedMinutes: item.plannedMinutes,
        completed: item.completed,
        seq: item.seq,
      }));
  },
});
