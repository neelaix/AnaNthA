import { useEffect } from 'react';
import { convexEnabled } from '../lib/convex';
import { useTaskStore } from '../store/taskStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { syncReminders } from '../utils/reminderSync';

export const useReminderSync = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const identity = useWorkspaceStore((state) => state.identity);
  const ready = useWorkspaceStore((state) => state.ready);

  useEffect(() => {
    if (!convexEnabled || !identity || !ready) return;
    const timer = window.setTimeout(() => {
      void syncReminders(tasks);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [tasks, identity, ready]);

  useEffect(() => {
    const handleOnline = () => {
      void syncReminders(useTaskStore.getState().tasks);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
};
