import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';
import { nextSeq } from './lib/taskOps';

const categoryFields = {
  categoryId: v.optional(v.string()),
  name: v.string(),
  color: v.string(),
  icon: v.optional(v.string()),
  isCustom: v.optional(v.boolean()),
  order: v.optional(v.number()),
  clientUpdatedAt: v.optional(v.number()),
};

function toPublic(doc: any) {
  return {
    categoryId: doc.categoryId,
    name: doc.name,
    color: doc.color,
    icon: doc.icon,
    isCustom: doc.isCustom,
    order: doc.order,
    seq: doc.seq,
    version: doc.version,
    deletedAt: doc.deletedAt,
    updatedAt: doc.updatedAt,
  };
}

export async function applyCategoryUpsert(ctx: any, device: any, input: any, now: number) {
  const name = (input.name ?? '').trim().slice(0, 80);
  if (!name) throw new Error('Category name is required');
  const categoryId = (input.categoryId ?? crypto.randomUUID()).slice(0, 80);
  const existing = await ctx.db
    .query('categories')
    .withIndex('by_workspace_category', (q: any) =>
      q.eq('workspaceId', device.workspaceId).eq('categoryId', categoryId),
    )
    .unique();

  const seq = await nextSeq(ctx, device.workspaceId);
  const doc = {
    workspaceId: device.workspaceId,
    categoryId,
    name,
    color: (input.color ?? '#9d88ff').slice(0, 20),
    icon: input.icon?.slice(0, 40),
    isCustom: input.isCustom ?? existing?.isCustom ?? true,
    order: input.order ?? existing?.order ?? 999,
    seq,
    version: (existing?.version ?? 0) + 1,
    deletedAt: undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: Math.max(now, Math.min(input.clientUpdatedAt ?? now, now + 120_000)),
  };

  if (existing) {
    await ctx.db.patch(existing._id, doc);
    return toPublic({ ...existing, ...doc });
  }
  await ctx.db.insert('categories', doc);
  return toPublic(doc);
}

export const upsert = mutation({
  args: { ...authArgs, category: v.object(categoryFields) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    return await applyCategoryUpsert(ctx, device, args.category, Date.now());
  },
});

export const bulkUpsert = mutation({
  args: { ...authArgs, categories: v.array(v.object(categoryFields)) },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    let inserted = 0;
    let updated = 0;
    for (const category of args.categories.slice(0, 100)) {
      const existing = category.categoryId
        ? await ctx.db
            .query('categories')
            .withIndex('by_workspace_category', (q: any) =>
              q.eq('workspaceId', device.workspaceId).eq('categoryId', category.categoryId!),
            )
            .unique()
        : null;
      await applyCategoryUpsert(ctx, device, category, Date.now());
      if (existing) updated += 1;
      else inserted += 1;
    }
    return { inserted, updated };
  },
});

export const remove = mutation({
  args: { ...authArgs, categoryId: v.string() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const existing = await ctx.db
      .query('categories')
      .withIndex('by_workspace_category', (q: any) =>
        q.eq('workspaceId', device.workspaceId).eq('categoryId', args.categoryId),
      )
      .unique();
    if (!existing || existing.deletedAt) return { ok: false };
    const seq = await nextSeq(ctx, device.workspaceId);
    await ctx.db.patch(existing._id, {
      deletedAt: Date.now(),
      seq,
      version: existing.version + 1,
      updatedAt: Date.now(),
    });

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_workspace_completed', (q: any) => q.eq('workspaceId', device.workspaceId).eq('completed', false))
      .take(1000);
    let moved = 0;
    for (const task of tasks) {
      if (task.categoryId !== args.categoryId || task.deletedAt) continue;
      const nextTaskSeq = await nextSeq(ctx, device.workspaceId);
      await ctx.db.patch(task._id, {
        categoryId: 'personal',
        seq: nextTaskSeq,
        version: task.version + 1,
        updatedAt: Date.now(),
      });
      moved += 1;
    }
    return { ok: true, moved };
  },
});

export const list = query({
  args: authArgs,
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const categories = await ctx.db
      .query('categories')
      .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', device.workspaceId))
      .order('desc')
      .take(200);
    return categories.filter((item: any) => !item.deletedAt).map(toPublic);
  },
});
