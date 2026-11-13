import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { MAX_SUBSCRIPTIONS_PER_WORKSPACE } from './lib/defaults';

export const upsert = mutation({
  args: {
    ...authArgs,
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);

    if (!args.endpoint.startsWith('https://') || args.endpoint.length > 2000) {
      throw new Error('Invalid push endpoint');
    }
    if (args.p256dh.length < 20 || args.p256dh.length > 500) {
      throw new Error('Invalid push key');
    }
    if (args.auth.length < 8 || args.auth.length > 200) {
      throw new Error('Invalid push auth secret');
    }

    const now = Date.now();
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .unique();

    if (existing) {
      if (existing.workspaceId !== device.workspaceId) {
        throw new Error('This push endpoint is registered to another workspace');
      }
      await ctx.db.patch(existing._id, {
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent?.slice(0, 300),
        lastSeenAt: now,
      });
      await ctx.db.patch(device._id, { lastSeenAt: now });
      return { subscriptionId: existing._id };
    }

    const workspaceSubscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', device.workspaceId))
      .collect();

    if (workspaceSubscriptions.length >= MAX_SUBSCRIPTIONS_PER_WORKSPACE) {
      throw new Error('Too many registered devices. Remove one before adding another.');
    }

    const subscriptionId = await ctx.db.insert('subscriptions', {
      workspaceId: device.workspaceId,
      deviceId: device.deviceId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      userAgent: args.userAgent?.slice(0, 300),
      createdAt: now,
      lastSeenAt: now,
    });
    await ctx.db.patch(device._id, { lastSeenAt: now });
    return { subscriptionId };
  },
});

export const remove = mutation({
  args: { ...authArgs, subscriptionId: v.id('subscriptions') },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || subscription.workspaceId !== device.workspaceId) {
      throw new Error('Subscription not found');
    }
    await ctx.db.delete(args.subscriptionId);
  },
});

export const removeDevice = mutation({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_device', (q: any) =>
        q.eq('workspaceId', device.workspaceId).eq('deviceId', device.deviceId),
      )
      .collect();
    await Promise.all(subscriptions.map((subscription) => ctx.db.delete(subscription._id)));
    return { removed: subscriptions.length };
  },
});

export const listDevices = query({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const [devices, subscriptions] = await Promise.all([
      ctx.db
        .query('devices')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', device.workspaceId))
        .collect(),
      ctx.db
        .query('subscriptions')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', device.workspaceId))
        .collect(),
    ]);

    return {
      currentDeviceId: device.deviceId,
      devices: devices.map((item) => ({
        deviceId: item.deviceId,
        name: item.name,
        createdAt: item.createdAt,
        lastSeenAt: item.lastSeenAt,
        isCurrent: item.deviceId === device.deviceId,
        subscriptions: subscriptions
          .filter((subscription) => subscription.deviceId === item.deviceId)
          .map((subscription) => ({
            id: subscription._id,
            userAgent: subscription.userAgent ?? 'Unknown browser',
            createdAt: subscription.createdAt,
            lastSeenAt: subscription.lastSeenAt,
          })),
      })),
    };
  },
});

export const listForWorkspace = internalQuery({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect();
  },
});

export const authorizeTest = internalMutation({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const now = Date.now();
    if (device.lastTestAt && now - device.lastTestAt < 20_000) {
      throw new Error('Please wait a few seconds before sending another test notification.');
    }
    await ctx.db.patch(device._id, { lastTestAt: now, lastSeenAt: now });
    return { workspaceId: device.workspaceId };
  },
});

export const pruneEndpoints = internalMutation({
  args: { endpoints: v.array(v.string()) },
  handler: async (ctx, args) => {
    let removed = 0;
    for (const endpoint of args.endpoints.slice(0, 50)) {
      const subscription = await ctx.db
        .query('subscriptions')
        .withIndex('by_endpoint', (q) => q.eq('endpoint', endpoint))
        .unique();
      if (subscription) {
        await ctx.db.delete(subscription._id);
        removed += 1;
      }
    }
    return { removed };
  },
});
