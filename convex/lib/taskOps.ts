import { applyTaskReminders, cancelTaskReminders, TaskForPlan } from './reminderPlan';

export type TaskInput = {
  taskId?: string;
  title: string;
  description?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  categoryId?: string;
  tags?: string[];
  deadline?: number;
  startAt?: number;
  timezone?: string;
  completed?: boolean;
  completedAt?: number;
  recurrence?: TaskForPlan['recurrence'];
  reminder?: TaskForPlan['reminder'];
  parentTaskId?: string;
  occurrenceKey?: string;
  isRecurringInstance?: boolean;
  clientUpdatedAt?: number;
};

export async function nextSeq(ctx: any, workspaceId: string): Promise<number> {
  const state = await ctx.db
    .query('syncState')
    .withIndex('by_workspace', (q: any) => q.eq('workspaceId', workspaceId))
    .unique();
  const next = (state?.lastSeq ?? 0) + 1;
  if (state) {
    await ctx.db.patch(state._id, { lastSeq: next, updatedAt: Date.now() });
  } else {
    await ctx.db.insert('syncState', { workspaceId, lastSeq: next, updatedAt: Date.now() });
  }
  return next;
}

function clampClientTime(now: number, clientUpdatedAt?: number): number {
  if (!clientUpdatedAt || !Number.isFinite(clientUpdatedAt)) return now;
  if (clientUpdatedAt > now + 120_000) return now;
  if (clientUpdatedAt < now - 30 * 24 * 60 * 60 * 1000) return now;
  return Math.max(clientUpdatedAt, now - 120_000);
}

function toPlan(doc: any): TaskForPlan {
  return {
    workspaceId: doc.workspaceId,
    taskId: doc.taskId,
    title: doc.title,
    completed: doc.completed,
    deletedAt: doc.deletedAt,
    deadline: doc.deadline,
    timezone: doc.timezone,
    recurrence: doc.recurrence,
    reminder: doc.reminder,
  };
}

export function toPublicTask(doc: any) {
  return {
    taskId: doc.taskId,
    title: doc.title,
    description: doc.description,
    notes: doc.notes,
    priority: doc.priority,
    categoryId: doc.categoryId,
    tags: doc.tags,
    deadline: doc.deadline,
    startAt: doc.startAt,
    timezone: doc.timezone,
    completed: doc.completed,
    completedAt: doc.completedAt,
    recurrence: doc.recurrence,
    reminder: doc.reminder,
    parentTaskId: doc.parentTaskId,
    occurrenceKey: doc.occurrenceKey,
    isRecurringInstance: doc.isRecurringInstance,
    seq: doc.seq,
    version: doc.version,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function upsertTask(
  ctx: any,
  device: { workspaceId: string; deviceId: string },
  input: TaskInput,
  now = Date.now(),
): Promise<{ task: ReturnType<typeof toPublicTask>; conflict: boolean; cancelled: number }> {
  const title = (input.title ?? '').trim().slice(0, 200);
  if (!title) throw new Error('Task title is required');

  const taskId = (input.taskId ?? crypto.randomUUID()).slice(0, 80);
  const existing = await ctx.db
    .query('tasks')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', device.workspaceId).eq('taskId', taskId),
    )
    .unique();

  if (existing && existing.version > 0 && input.clientUpdatedAt) {
    const stale = clampClientTime(now, input.clientUpdatedAt) < existing.updatedAt - 2000;
    if (stale) {
      return { task: toPublicTask(existing), conflict: true, cancelled: 0 };
    }
  }

  const seq = await nextSeq(ctx, device.workspaceId);
  const updatedAt = Math.max(now, clampClientTime(now, input.clientUpdatedAt));
  const base = {
    workspaceId: device.workspaceId,
    taskId,
    title,
    description: input.description?.slice(0, 5000),
    notes: input.notes?.slice(0, 20000),
    priority: input.priority ?? existing?.priority ?? 'medium',
    categoryId: (input.categoryId ?? existing?.categoryId ?? 'personal').slice(0, 80),
    tags: (input.tags ?? existing?.tags ?? []).slice(0, 20).map((tag: string) => tag.slice(0, 40)),
    deadline: input.deadline ?? existing?.deadline,
    startAt: input.startAt ?? existing?.startAt,
    timezone: input.timezone ?? existing?.timezone ?? 'UTC',
    completed: input.completed ?? existing?.completed ?? false,
    completedAt: input.completedAt ?? existing?.completedAt,
    recurrence: input.recurrence ?? existing?.recurrence,
    reminder: input.reminder ?? existing?.reminder,
    parentTaskId: input.parentTaskId ?? existing?.parentTaskId,
    occurrenceKey: input.occurrenceKey ?? existing?.occurrenceKey,
    isRecurringInstance: input.isRecurringInstance ?? existing?.isRecurringInstance,
    seq,
    version: (existing?.version ?? 0) + 1,
    deletedAt: undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt,
    createdByDeviceId: existing?.createdByDeviceId ?? device.deviceId,
    updatedByDeviceId: device.deviceId,
  };

  let doc: any;
  if (existing) {
    await ctx.db.patch(existing._id, base);
    doc = { ...existing, ...base };
  } else {
    const id = await ctx.db.insert('tasks', base);
    doc = { ...base, _id: id };
  }

  const cancelled = doc.completed
    ? await cancelTaskReminders(ctx, device.workspaceId, taskId, now)
    : await applyTaskReminders(ctx, toPlan(doc), now);

  return { task: toPublicTask(doc), conflict: false, cancelled };
}

export async function setTaskCompleted(
  ctx: any,
  device: { workspaceId: string; deviceId: string },
  taskId: string,
  completed: boolean,
  now = Date.now(),
): Promise<{ task: ReturnType<typeof toPublicTask> | null; cancelled: number }> {
  const existing = await ctx.db
    .query('tasks')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', device.workspaceId).eq('taskId', taskId),
    )
    .unique();
  if (!existing || existing.deletedAt) return { task: null, cancelled: 0 };

  const seq = await nextSeq(ctx, device.workspaceId);
  const patch = {
    completed,
    completedAt: completed ? now : undefined,
    seq,
    version: existing.version + 1,
    updatedAt: now,
    updatedByDeviceId: device.deviceId,
  };
  await ctx.db.patch(existing._id, patch);
  const doc = { ...existing, ...patch };
  const cancelled = completed
    ? await cancelTaskReminders(ctx, device.workspaceId, taskId, now)
    : await applyTaskReminders(ctx, toPlan(doc), now);
  return { task: toPublicTask(doc), cancelled };
}

export async function removeTask(
  ctx: any,
  device: { workspaceId: string; deviceId: string },
  taskId: string,
  now = Date.now(),
): Promise<{ cancelled: number }> {
  const existing = await ctx.db
    .query('tasks')
    .withIndex('by_workspace_task', (q: any) =>
      q.eq('workspaceId', device.workspaceId).eq('taskId', taskId),
    )
    .unique();
  if (!existing || existing.deletedAt) return { cancelled: 0 };

  const seq = await nextSeq(ctx, device.workspaceId);
  await ctx.db.patch(existing._id, {
    deletedAt: now,
    seq,
    version: existing.version + 1,
    updatedAt: now,
    updatedByDeviceId: device.deviceId,
  });
  const cancelled = await cancelTaskReminders(ctx, device.workspaceId, taskId, now);
  return { cancelled };
}

export async function listTasksForWorkspace(ctx: any, workspaceId: string, limit = 500) {
  return await ctx.db
    .query('tasks')
    .withIndex('by_workspace_seq', (q: any) => q.eq('workspaceId', workspaceId))
    .order('desc')
    .take(limit);
}
