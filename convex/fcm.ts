import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';

const platform = v.union(v.literal('web'), v.literal('android'), v.literal('ios'));

export const registerToken = mutation({
  args: {
    ...authArgs,
    token: v.string(),
    platform,
    appVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const token = args.token.trim();
    if (token.length < 20 || token.length > 4096) throw new Error('Invalid FCM token');

    const now = Date.now();
    const existing = await ctx.db
      .query('fcmTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .unique();

    if (existing) {
      if (existing.workspaceId !== device.workspaceId) {
        throw new Error('This device token belongs to another workspace');
      }
      await ctx.db.patch(existing._id, {
        deviceId: device.deviceId,
        platform: args.platform,
        lastSeenAt: now,
        lastError: undefined,
      });
    } else {
      await ctx.db.insert('fcmTokens', {
        workspaceId: device.workspaceId,
        deviceId: device.deviceId,
        token,
        platform: args.platform,
        createdAt: now,
        lastSeenAt: now,
      });
    }

    await ctx.db.patch(device._id, {
      fcmToken: token,
      platform: args.platform,
      appVersion: args.appVersion?.slice(0, 40),
      lastSeenAt: now,
    });

    return { ok: true };
  },
});

export const removeToken = mutation({
  args: { ...authArgs, token: v.string() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const existing = await ctx.db
      .query('fcmTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!existing || existing.workspaceId !== device.workspaceId) return { removed: 0 };
    await ctx.db.delete(existing._id);
    return { removed: 1 };
  },
});

export const listForWorkspace = internalQuery({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('fcmTokens')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect();
  },
});

export const prune = internalMutation({
  args: { tokens: v.array(v.string()) },
  handler: async (ctx, args) => {
    let removed = 0;
    for (const token of args.tokens.slice(0, 50)) {
      const existing = await ctx.db
        .query('fcmTokens')
        .withIndex('by_token', (q) => q.eq('token', token))
        .unique();
      if (existing) {
        await ctx.db.delete(existing._id);
        removed += 1;
      }
    }
    return { removed };
  },
});
