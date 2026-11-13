import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authArgs, hashToken, requireDevice, shortId } from './lib/auth';

const PAIR_CODE_TTL_MS = 15 * 60 * 1000;

export const create = mutation({
  args: {
    deviceId: v.string(),
    deviceName: v.string(),
    tokenHash: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.deviceId.length < 8 || args.tokenHash.length !== 64) {
      throw new Error('Invalid device credentials');
    }

    let pairCode = shortId(8);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await ctx.db
        .query('workspaces')
        .withIndex('by_pair_code', (q) => q.eq('pairCode', pairCode))
        .unique();
      if (!existing) break;
      pairCode = shortId(8);
      attempts += 1;
    }

    const now = Date.now();
    const workspaceId = crypto.randomUUID();
    const pairCodeExpiresAt = now + PAIR_CODE_TTL_MS;

    await ctx.db.insert('workspaces', {
      workspaceId,
      pairCode,
      pairCodeExpiresAt,
      createdAt: now,
    });

    await ctx.db.insert('devices', {
      workspaceId,
      deviceId: args.deviceId,
      name: args.deviceName.slice(0, 80) || 'This device',
      tokenHash: args.tokenHash,
      userAgent: args.userAgent?.slice(0, 300),
      createdAt: now,
      lastSeenAt: now,
    });

    return { workspaceId, pairCode, pairCodeExpiresAt };
  },
});

export const join = mutation({
  args: {
    pairCode: v.string(),
    deviceId: v.string(),
    deviceName: v.string(),
    tokenHash: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const code = args.pairCode.trim().toUpperCase();
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('by_pair_code', (q) => q.eq('pairCode', code))
      .unique();

    if (!workspace) throw new Error('Pairing code not found');
    if (workspace.pairCodeExpiresAt < Date.now()) {
      throw new Error('Pairing code has expired. Generate a new one on your other device.');
    }
    if (args.tokenHash.length !== 64) throw new Error('Invalid device credentials');

    const now = Date.now();
    const existing = await ctx.db
      .query('devices')
      .withIndex('by_device', (q: any) =>
        q.eq('workspaceId', workspace.workspaceId).eq('deviceId', args.deviceId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.deviceName.slice(0, 80) || 'This device',
        tokenHash: args.tokenHash,
        userAgent: args.userAgent?.slice(0, 300),
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert('devices', {
        workspaceId: workspace.workspaceId,
        deviceId: args.deviceId,
        name: args.deviceName.slice(0, 80) || 'This device',
        tokenHash: args.tokenHash,
        userAgent: args.userAgent?.slice(0, 300),
        createdAt: now,
        lastSeenAt: now,
      });
    }

    return { workspaceId: workspace.workspaceId };
  },
});

export const validate = query({
  args: authArgs,
  handler: async (ctx, args) => {
    try {
      await requireDevice(ctx, args);
      return true;
    } catch {
      return false;
    }
  },
});

export const refreshPairCode = mutation({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('by_workspace_id', (q) => q.eq('workspaceId', device.workspaceId))
      .unique();
    if (!workspace) throw new Error('Workspace not found');

    let pairCode = shortId(8);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await ctx.db
        .query('workspaces')
        .withIndex('by_pair_code', (q) => q.eq('pairCode', pairCode))
        .unique();
      if (!existing || existing._id === workspace._id) break;
      pairCode = shortId(8);
    }

    const pairCodeExpiresAt = Date.now() + PAIR_CODE_TTL_MS;
    await ctx.db.patch(workspace._id, { pairCode, pairCodeExpiresAt });
    return { pairCode, pairCodeExpiresAt };
  },
});

export const current = mutation({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('by_workspace_id', (q) => q.eq('workspaceId', device.workspaceId))
      .unique();
    if (!workspace) throw new Error('Workspace not found');
    return {
      workspaceId: workspace.workspaceId,
      pairCode: workspace.pairCode,
      pairCodeExpiresAt: workspace.pairCodeExpiresAt,
      deviceName: device.name,
    };
  },
});

export const hash = mutation({
  args: { token: v.string() },
  handler: async (_ctx, args) => hashToken(args.token),
});
