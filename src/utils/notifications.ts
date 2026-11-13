import { AppNotification, useNotificationStore } from '../store/notificationStore';
import type { Task } from '../types';
import { showLocalNotification } from './push';

export type Notification = AppNotification;

export interface NotificationAction {
  label: string;
  action: () => void;
}

export class NotificationManager {
  static initialize(): void {
    // Permission is only requested from an explicit user action.
  }

  static addNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'source'>,
  ): Notification {
    return useNotificationStore.getState().addLocal({
      title: notification.title,
      message: notification.message,
      category: notification.category,
      taskId: notification.taskId,
    });
  }

  static sendBrowserNotification(title: string, options: NotificationOptions = {}): void {
    void showLocalNotification(title, { tag: 'anantha-task', ...options });
  }

  static notifyTaskDue(task: Task): void {
    if (task.completed || !task.deadline) return;
    const deadline = new Date(task.deadline);
    if (Number.isNaN(deadline.getTime())) return;

    const now = new Date();
    const isOverdue = deadline.getTime() < now.getTime();
    const isToday = deadline.toDateString() === now.toDateString();
    if (!isOverdue && !isToday) return;

    const title = isOverdue ? 'Overdue task' : 'Task due today';
    const message = isOverdue
      ? `"${task.title}" is overdue. Complete it now.`
      : `"${task.title}" is due today${task.time ? ` at ${task.time}` : ''}.`;

    useNotificationStore.getState().addLocal({
      title,
      message,
      category: 'deadline-alert',
      taskId: task.id,
    });
    void showLocalNotification(title, {
      body: message,
      tag: `task-${task.id}-${isOverdue ? 'overdue' : 'today'}`,
      data: { taskId: task.id, url: `/?task=${encodeURIComponent(task.id)}` },
    });
  }

  static setReminder(_task: Task, _reminderTime: Date): void {
    // Server-side scheduling replaces in-page timers.
  }

  static setDeadlineReminder(_task: Task, _minutesBefore = 30): void {
    // Server-side scheduling replaces in-page timers.
  }

  static clearReminder(_taskId: string): void {}

  static clearAllReminders(): void {}

  static getNotifications(): Notification[] {
    return useNotificationStore.getState().notifications;
  }

  static getUnreadCount(): number {
    return useNotificationStore.getState().notifications.filter((notification) => !notification.read).length;
  }

  static markAsRead(notificationId: string): void {
    useNotificationStore.getState().markAsRead(notificationId);
  }

  static markAllAsRead(): void {
    useNotificationStore.getState().markAllAsRead();
  }

  static removeNotification(notificationId: string): void {
    useNotificationStore.getState().remove(notificationId);
  }

  static clearAll(): void {
    useNotificationStore.getState().clearAll();
  }

  static subscribe(listener: (notifications: Notification[]) => void): () => void {
    listener(useNotificationStore.getState().notifications);
    return useNotificationStore.subscribe((state) => listener(state.notifications));
  }

  static getTimeUntilDeadline(deadline: Date | string): {
    days: number;
    hours: number;
    minutes: number;
  } {
    const diff = new Date(deadline).getTime() - Date.now();
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
    };
  }
}

export const getNotificationPermission = (): NotificationPermission => {
  if ('Notification' in window) return Notification.permission;
  return 'denied';
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
};
