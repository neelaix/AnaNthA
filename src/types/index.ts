export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ReminderPriority = 'low' | 'normal' | 'high';
export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';
export type NotificationSound = 'default' | 'soft' | 'urgent' | 'silent';
export type NotificationCategory =
  | 'task-reminder'
  | 'deadline-alert'
  | 'daily-motivation'
  | 'system';

export interface ReminderConfig {
  enabled: boolean;
  /** Optional explicit reminder date (yyyy-MM-dd). */
  date?: string;
  /** Optional reminder time-of-day (HH:mm). */
  time?: string;
  /** Minutes before the deadline to remind, e.g. [10, 30, 60]. */
  offsets: number[];
  /** Also notify exactly at the deadline. */
  notifyAtDeadline: boolean;
  priority: ReminderPriority;
  repeat: ReminderRepeat;
  /** Custom notification message. Falls back to a generated message. */
  message?: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  maxOccurrences?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: string;
  tags: string[];
  deadline?: Date;
  time?: string; // HH:mm format
  completed: boolean;
  completedAt?: Date;
  recurrence?: RecurrenceRule;
  createdAt: Date;
  updatedAt: Date;
  reminderTime?: 'on-time' | '1hour-before' | '1day-before' | 'custom';
  reminderCustomMinutes?: number;
  reminder?: ReminderConfig;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isCustom: boolean;
  taskCount?: number;
}

export interface Reminder {
  id: string;
  taskId: string;
  type: 'deadline' | 'overdue';
  scheduledAt: Date;
  dismissed: boolean;
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  dailyCompletion: number; // percentage
  weeklyCompletion: number[]; // 7 days
  monthlyCompletion: number[]; // 30 days
  currentStreak: number;
  longestStreak: number;
  bestProductiveDay: string;
  categoryStats: Array<{
    categoryId: string;
    categoryName: string;
    completedCount: number;
    totalCount: number;
    percentage: number;
  }>;
}

export interface Settings {
  theme: ThemeMode;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  defaultPriority: Priority;
  defaultCategory: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;

  // Push notification preferences
  pushEnabled: boolean;
  taskReminders: boolean;
  deadlineAlerts: boolean;
  dailyMotivation: boolean;
  recurringReminders: boolean;
  notificationSound: NotificationSound;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  urgentBypassQuietHours: boolean;
  dailyMotivationTime: string;
  defaultReminderMinutes: number;
}

export interface AppState {
  tasks: Task[];
  categories: Category[];
  reminders: Reminder[];
  settings: Settings;
  lastSyncAt?: Date;
}

export interface DailyStats {
  date: Date;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}
