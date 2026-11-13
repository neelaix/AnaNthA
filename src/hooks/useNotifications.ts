import { useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { convex, convexEnabled } from '../lib/convex';
import { useNotificationStore } from '../store/notificationStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { NotificationCategory, Task } from '../types';
import { Notification, NotificationManager } from '../utils/notifications';

type NewNotification = {
  title: string;
  message: string;
  category: NotificationCategory;
  taskId?: string;
};

function remoteAuth() {
  const identity = useWorkspaceStore.getState().identity;
  if (!convexEnabled || !convex || !identity) return null;
  return {
    client: convex,
    identity,
    auth: {
      workspaceId: identity.workspaceId,
      deviceId: identity.deviceId,
      token: identity.token,
    },
  };
}

function isRemoteId(id: string) {
  return !id.startsWith('local-');
}

export const useNotifications = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const addNotification = useCallback((notification: NewNotification) => {
    return useNotificationStore.getState().addLocal(notification);
  }, []);

  const notifyTaskDue = useCallback((task: Task) => {
    NotificationManager.notifyTaskDue(task);
  }, []);

  const setReminder = useCallback((_task: Task, _reminderTime: Date) => {}, []);
  const setDeadlineReminder = useCallback((_task: Task, _minutesBefore = 30) => {}, []);
  const clearReminder = useCallback((_taskId: string) => {}, []);
  const clearAllReminders = useCallback(() => {}, []);

  const markAsRead = useCallback((notificationId: string) => {
    useNotificationStore.getState().markAsRead(notificationId);
    const remote = remoteAuth();
    if (remote && isRemoteId(notificationId)) {
      void remote.client
        .mutation(api.notifications.markRead, {
          ...remote.auth,
          notificationId: notificationId as Id<'notifications'>,
        })
        .catch(() => undefined);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    useNotificationStore.getState().markAllAsRead();
    const remote = remoteAuth();
    if (remote) {
      void remote.client.mutation(api.notifications.markAllRead, remote.auth).catch(() => undefined);
    }
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    useNotificationStore.getState().remove(notificationId);
    const remote = remoteAuth();
    if (remote && isRemoteId(notificationId)) {
      void remote.client
        .mutation(api.notifications.remove, {
          ...remote.auth,
          notificationId: notificationId as Id<'notifications'>,
        })
        .catch(() => undefined);
    }
  }, []);

  const clearAll = useCallback(() => {
    useNotificationStore.getState().clearAll();
    const remote = remoteAuth();
    if (remote) {
      void remote.client.mutation(api.notifications.clearAll, remote.auth).catch(() => undefined);
    }
  }, []);

  return {
    notifications: notifications as Notification[],
    unreadCount,
    addNotification,
    notifyTaskDue,
    setReminder,
    setDeadlineReminder,
    clearReminder,
    clearAllReminders,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};
