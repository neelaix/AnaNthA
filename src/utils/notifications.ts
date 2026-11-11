/**
 * Notification & Reminders System
 * Handles browser notifications, in-app alerts, and reminder scheduling
 */

import { Task } from '../types';

export interface Notification {
  id: string;
  type: 'task-due' | 'reminder' | 'overdue' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  taskId?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export class NotificationManager {
  private static notifications: Notification[] = [];
  private static listeners: ((notifications: Notification[]) => void)[] = [];
  private static reminders: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private static requestedPermission = false;

  /**
   * Initialize notification system and request browser permission
   */
  static initialize(): void {
    if ('Notification' in window && !this.requestedPermission) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      this.requestedPermission = true;
    }
  }

  /**
   * Add an in-app notification
   */
  static addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.push(newNotification);
    this.notifyListeners();

    // Auto-remove info notifications after 5 seconds
    if (notification.type === 'info' || notification.type === 'success') {
      setTimeout(() => this.removeNotification(newNotification.id), 5000);
    }

    return newNotification;
  }

  /**
   * Send a browser notification
   */
  static sendBrowserNotification(title: string, options: NotificationOptions = {}): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        tag: options.tag || 'anantha-task',
        ...options,
      });
    }
  }

  /**
   * Create a task-due notification
   */
  static notifyTaskDue(task: Task): void {
    const isDueToday = this.isDueToday(task.deadline);
    const isOverdue = this.isOverdue(task.deadline);

    if (isOverdue) {
      this.addNotification({
        type: 'overdue',
        title: 'Overdue Task',
        message: `"${task.title}" is overdue! Complete it now.`,
        taskId: task.id,
      });

      this.sendBrowserNotification('Overdue Task', {
        body: `"${task.title}" is overdue! Complete it now.`,
        tag: `task-${task.id}-overdue`,
        requireInteraction: true,
      });
    } else if (isDueToday) {
      this.addNotification({
        type: 'task-due',
        title: 'Task Due Today',
        message: `"${task.title}" is due today${task.time ? ` at ${task.time}` : ''}.`,
        taskId: task.id,
      });

      this.sendBrowserNotification('Task Due Today', {
        body: `"${task.title}" is due today${task.time ? ` at ${task.time}` : ''}.`,
        tag: `task-${task.id}-today`,
      });
    }
  }

  /**
   * Create a custom reminder
   */
  static setReminder(task: Task, reminderTime: Date): void {
    const reminderId = `reminder-${task.id}`;
    const now = new Date();

    // Clear existing reminder for this task
    if (this.reminders.has(reminderId)) {
      clearTimeout(this.reminders.get(reminderId));
    }

    // Don't set reminders for past times
    if (reminderTime <= now) {
      return;
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      this.addNotification({
        type: 'reminder',
        title: 'Task Reminder',
        message: `Reminder: "${task.title}"${task.description ? `: ${task.description}` : ''}`,
        taskId: task.id,
      });

      this.sendBrowserNotification('Task Reminder', {
        body: `Reminder: "${task.title}"`,
        tag: `task-${task.id}-reminder`,
      });

      this.reminders.delete(reminderId);
    }, timeUntilReminder);

    this.reminders.set(reminderId, timeout);
  }

  /**
   * Create reminders for a specific time before deadline
   */
  static setDeadlineReminder(task: Task, minutesBefore: number = 30): void {
    if (!task.deadline) return;

    const deadline = new Date(task.deadline);
    const reminderTime = new Date(deadline.getTime() - minutesBefore * 60000);

    this.setReminder(task, reminderTime);
  }

  /**
   * Clear a reminder for a task
   */
  static clearReminder(taskId: string): void {
    const reminderId = `reminder-${taskId}`;
    if (this.reminders.has(reminderId)) {
      clearTimeout(this.reminders.get(reminderId));
      this.reminders.delete(reminderId);
    }
  }

  /**
   * Clear all reminders
   */
  static clearAllReminders(): void {
    this.reminders.forEach((timeout) => clearTimeout(timeout));
    this.reminders.clear();
  }

  /**
   * Get all notifications
   */
  static getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications count
   */
  static getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all as read
   */
  static markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.notifyListeners();
  }

  /**
   * Remove a notification
   */
  static removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  static clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to notification changes
   */
  static subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all subscribers of changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  /**
   * Check if task is due today
   */
  private static isDueToday(deadline?: Date | string): boolean {
    if (!deadline) return false;

    const deadline_date = new Date(deadline);
    const today = new Date();

    return (
      deadline_date.getDate() === today.getDate() &&
      deadline_date.getMonth() === today.getMonth() &&
      deadline_date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Check if task is overdue
   */
  private static isOverdue(deadline?: Date | string): boolean {
    if (!deadline) return false;

    const deadline_date = new Date(deadline);
    const today = new Date();

    return deadline_date < today && !this.isDueToday(deadline);
  }

  /**
   * Get time until deadline
   */
  static getTimeUntilDeadline(deadline: Date | string): { days: number; hours: number; minutes: number } {
    const now = new Date();
    const deadline_date = new Date(deadline);
    const diff = deadline_date.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return { days, hours, minutes };
  }
}

/**
 * Get notifications permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }
  }
  return 'denied';
};
