import { useEffect, useRef } from 'react';
import { convexEnabled } from '../lib/convex';
import { useNotificationStore } from '../store/notificationStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useToastStore } from '../store/toastStore';
import type { Task } from '../types';
import { showLocalNotification } from '../utils/push';
import { planReminders, type PlannedReminder } from '../utils/reminderEngine';

const FIRED_KEY = 'anantha-fired-reminders';
const LATE_TOLERANCE_MS = 10 * 60_000;

function loadFired(): Set<string> {
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function persistFired(fired: Set<string>) {
  try {
    sessionStorage.setItem(FIRED_KEY, JSON.stringify(Array.from(fired).slice(-500)));
  } catch {
    // Ignore storage failures; scheduling still works for this session.
  }
}

interface QueuedReminder {
  task: Task;
  reminder: PlannedReminder;
}

export const useInAppReminders = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const timerRef = useRef<number>();
  const queueRef = useRef<QueuedReminder[]>([]);
  const firedRef = useRef<Set<string>>(loadFired());

  useEffect(() => {
    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };

    const fire = (entry: QueuedReminder) => {
      const occurrenceId = entry.reminder.occurrenceId;
      if (firedRef.current.has(occurrenceId)) return;
      firedRef.current.add(occurrenceId);
      persistFired(firedRef.current);

      const { title, body, category } = entry.reminder;
      const taskId = entry.task.id;

      useToastStore.getState().pushToast({ title, message: body, category, taskId });

      if (!convexEnabled) {
        useNotificationStore.getState().addLocal({
          title,
          message: body,
          category,
          taskId,
          timestamp: entry.reminder.fireAt,
        });
      }

      const sound = useSettingsStore.getState().notificationSound;
      void showLocalNotification(title, {
        body,
        tag: occurrenceId,
        silent: sound === 'silent',
        data: {
          taskId,
          url: `/?task=${encodeURIComponent(taskId)}`,
        },
      });
    };

    const scheduleNext = () => {
      clearTimer();
      if (cancelled) return;

      const next = queueRef.current[0];
      if (!next) return;

      const delay = Math.min(Math.max(next.reminder.fireAt - Date.now(), 250), 2_000_000_000);
      timerRef.current = window.setTimeout(() => {
        const now = Date.now();
        const due = queueRef.current.filter(
          (entry) => entry.reminder.fireAt <= now + 1000,
        );
        queueRef.current = queueRef.current.filter(
          (entry) => entry.reminder.fireAt > now + 1000,
        );

        for (const entry of due) {
          if (entry.reminder.fireAt < now - LATE_TOLERANCE_MS) {
            firedRef.current.add(entry.reminder.occurrenceId);
            continue;
          }
          fire(entry);
        }
        if (due.length > 0) persistFired(firedRef.current);

        scheduleNext();
      }, delay);
    };

    const queue: QueuedReminder[] = [];
    for (const task of tasks) {
      if (task.completed) continue;
      for (const reminder of planReminders(task)) {
        if (firedRef.current.has(reminder.occurrenceId)) continue;
        if (reminder.fireAt < Date.now() - LATE_TOLERANCE_MS) continue;
        queue.push({ task, reminder });
      }
    }
    queue.sort((a, b) => a.reminder.fireAt - b.reminder.fireAt);
    queueRef.current = queue;

    scheduleNext();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [tasks]);
};
