import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { authArgs, requireDevice } from './lib/auth';

function dateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export const summary = query({
  args: { ...authArgs, from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args);
    const from = Math.min(args.from, args.to);
    const to = Math.max(args.from, args.to);

    const [tasks, sessions] = await Promise.all([
      ctx.db
        .query('tasks')
        .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', device.workspaceId))
        .order('desc')
        .take(2000),
      ctx.db
        .query('focusSessions')
        .withIndex('by_workspace_started', (q: any) => q.eq('workspaceId', device.workspaceId))
        .order('desc')
        .take(2000),
    ]);

    const active = tasks.filter((task: any) => !task.deletedAt);
    const completed = active.filter(
      (task: any) => task.completed && task.completedAt && task.completedAt >= from && task.completedAt <= to,
    );
    const created = active.filter((task: any) => task.createdAt >= from && task.createdAt <= to);
    const pending = active.filter((task: any) => !task.completed);
    const overdue = pending.filter((task: any) => task.deadline && task.deadline < Date.now());

    const byDay = new Map<string, { date: string; completed: number; created: number; focusMinutes: number }>();
    const ensure = (key: string) => {
      if (!byDay.has(key)) byDay.set(key, { date: key, completed: 0, created: 0, focusMinutes: 0 });
      return byDay.get(key)!;
    };

    for (const task of completed) ensure(dateKey(task.completedAt!)).completed += 1;
    for (const task of created) ensure(dateKey(task.createdAt)).created += 1;

    let focusMinutes = 0;
    for (const session of sessions) {
      if (session.deletedAt || session.kind !== 'focus') continue;
      if (session.startedAt < from || session.startedAt > to) continue;
      const minutes = session.completed && session.endedAt
        ? Math.max(0, Math.round((session.endedAt - session.startedAt) / 60_000))
        : 0;
      focusMinutes += minutes;
      ensure(dateKey(session.startedAt)).focusMinutes += minutes;
    }

    const byCategory = new Map<string, { categoryId: string; total: number; completed: number }>();
    for (const task of active) {
      const bucket = byCategory.get(task.categoryId) ?? {
        categoryId: task.categoryId,
        total: 0,
        completed: 0,
      };
      bucket.total += 1;
      if (task.completed) bucket.completed += 1;
      byCategory.set(task.categoryId, bucket);
    }

    const days = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    const bestDay = days.reduce(
      (best, day) => (day.completed > (best?.completed ?? -1) ? day : best),
      undefined as (typeof days)[number] | undefined,
    );

    return {
      range: { from, to },
      totals: {
        total: active.length,
        completed: completed.length,
        pending: pending.length,
        overdue: overdue.length,
        created: created.length,
        focusMinutes,
        goalCompletion: completed.length + pending.length > 0
          ? Math.round((completed.length / (completed.length + pending.length)) * 100)
          : 0,
      },
      days,
      categories: Array.from(byCategory.values()),
      bestDay: bestDay ?? null,
    };
  },
});

export const rollupToday = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = start.getTime() + 86_400_000;
    const key = start.toISOString().slice(0, 10);
    const workspaces = await ctx.db.query('workspaces').take(500);
    let updated = 0;

    for (const workspace of workspaces) {
      const tasks = await ctx.db
        .query('tasks')
        .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', workspace.workspaceId))
        .order('desc')
        .take(1000);
      const active = tasks.filter((task: any) => !task.deletedAt);
      const completed = active.filter(
        (task: any) => task.completed && task.completedAt && task.completedAt >= start.getTime() && task.completedAt < end,
      ).length;
      const created = active.filter((task: any) => task.createdAt >= start.getTime() && task.createdAt < end).length;
      const overdue = active.filter((task: any) => !task.completed && task.deadline && task.deadline < now).length;

      const sessions = await ctx.db
        .query('focusSessions')
        .withIndex('by_workspace_started', (q: any) => q.eq('workspaceId', workspace.workspaceId))
        .order('desc')
        .take(500);
      const focusMinutes = sessions
        .filter((item: any) => !item.deletedAt && item.kind === 'focus' && item.completed && item.endedAt && item.startedAt >= start.getTime() && item.startedAt < end)
        .reduce((sum: number, item: any) => sum + Math.max(0, Math.round((item.endedAt - item.startedAt) / 60_000)), 0);

      const existing = await ctx.db
        .query('dailyStats')
        .withIndex('by_workspace_date', (q: any) => q.eq('workspaceId', workspace.workspaceId).eq('dateKey', key))
        .unique();
      const doc = { workspaceId: workspace.workspaceId, dateKey: key, completed, created, focusMinutes, overdue, seq: (existing?.seq ?? 0) + 1, updatedAt: now };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert('dailyStats', doc);
      updated += 1;
    }

    return { updated };
  },
});