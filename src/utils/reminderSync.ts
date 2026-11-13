import { api } from '../../convex/_generated/api';
import { convex, convexEnabled } from '../lib/convex';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { Task } from '../types';
import { currentTimezone, planReminders } from './reminderEngine';

let syncing = false;
let queued = false;
let pendingTasks: Task[] = [];

export async function syncReminders(tasks: Task[]): Promise<void> {
  if (!convexEnabled || !convex) return;
  const identity = useWorkspaceStore.getState().identity;
  if (!identity) return;

  if (syncing) {
    queued = true;
    pendingTasks = tasks;
    return;
  }

  syncing = true;
  try {
    const storageKey = `anantha-synced-task-ids:${identity.workspaceId}`;
    let previous: string[] = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) previous = JSON.parse(raw) as string[];
    } catch {
      previous = [];
    }

    const currentIds = tasks.map((task) => task.id);
    const currentSet = new Set(currentIds);
    const removeTaskIds = previous.filter((id) => !currentSet.has(id));
    const timezone = currentTimezone();

    const payload = tasks.map((task) => ({
      taskId: task.id,
      title: task.title,
      completed: task.completed,
      timezone,
      reminders: planReminders(task).map((reminder) => ({
        occurrenceId: reminder.occurrenceId,
        category: reminder.category,
        title: reminder.title,
        body: reminder.body,
        fireAt: reminder.fireAt,
        priority: reminder.priority,
        repeat: reminder.repeat,
      })),
    }));

    const auth = {
      workspaceId: identity.workspaceId,
      deviceId: identity.deviceId,
      token: identity.token,
    };

    if (payload.length === 0) {
      await convex.mutation(api.reminders.syncAll, {
        ...auth,
        tasks: [],
        removeTaskIds,
      });
    } else {
      for (let index = 0; index < payload.length; index += 20) {
        await convex.mutation(api.reminders.syncAll, {
          ...auth,
          tasks: payload.slice(index, index + 20),
          removeTaskIds: index === 0 ? removeTaskIds : [],
        });
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(currentIds));
  } catch (error) {
    console.warn('Reminder sync failed', error);
  } finally {
    syncing = false;
    if (queued) {
      queued = false;
      const latest = pendingTasks;
      pendingTasks = [];
      void syncReminders(latest);
    }
  }
}
