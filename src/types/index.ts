export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type ThemeMode = 'light' | 'dark' | 'system';

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
