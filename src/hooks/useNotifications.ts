import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationManager } from '../utils/notifications';
import { Task } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initialize notification system
    NotificationManager.initialize();

    // Subscribe to notification changes
    const unsubscribe = NotificationManager.subscribe((notifs) => {
      setNotifications(notifs);
      setUnreadCount(NotificationManager.getUnreadCount());
    });

    // Set initial state
    setNotifications(NotificationManager.getNotifications());
    setUnreadCount(NotificationManager.getUnreadCount());

    return unsubscribe;
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      return NotificationManager.addNotification(notification);
    },
    []
  );

  const notifyTaskDue = useCallback((task: Task) => {
    NotificationManager.notifyTaskDue(task);
  }, []);

  const setReminder = useCallback((task: Task, reminderTime: Date) => {
    NotificationManager.setReminder(task, reminderTime);
  }, []);

  const setDeadlineReminder = useCallback((task: Task, minutesBefore: number = 30) => {
    NotificationManager.setDeadlineReminder(task, minutesBefore);
  }, []);

  const clearReminder = useCallback((taskId: string) => {
    NotificationManager.clearReminder(taskId);
  }, []);

  const clearAllReminders = useCallback(() => {
    NotificationManager.clearAllReminders();
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    NotificationManager.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    NotificationManager.markAllAsRead();
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    NotificationManager.removeNotification(notificationId);
  }, []);

  const clearAll = useCallback(() => {
    NotificationManager.clearAll();
  }, []);

  return {
    notifications,
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
