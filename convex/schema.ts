import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const reminderCategory = v.union(
  v.literal('task-reminder'),
  v.literal('deadline-alert'),
  v.literal('daily-motivation'),
  v.literal('system'),
);

export const reminderPriority = v.union(v.literal('low'), v.literal('normal'), v.literal('high'));

export const reminderStatus = v.union(
  v.literal('pending'),
  v.literal('sending'),
  v.literal('sent'),
  v.literal('failed'),
  v.literal('cancelled'),
  v.literal('suppressed'),
);

export const notificationSound = v.union(
  v.literal('default'),
  v.literal('soft'),
  v.literal('urgent'),
  v.literal('silent'),
);

export default defineSchema({
  workspaces: defineTable({
    workspaceId: v.string(),
    pairCode: v.string(),
    pairCodeExpiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_workspace_id', ['workspaceId'])
    .index('by_pair_code', ['pairCode']),

  devices: defineTable({
    workspaceId: v.string(),
    deviceId: v.string(),
    name: v.string(),
    tokenHash: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    lastTestAt: v.optional(v.number()),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_device', ['workspaceId', 'deviceId']),

  subscriptions: defineTable({
    workspaceId: v.string(),
    deviceId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_device', ['workspaceId', 'deviceId'])
    .index('by_endpoint', ['endpoint']),

  reminders: defineTable({
    workspaceId: v.string(),
    taskId: v.string(),
    occurrenceId: v.string(),
    category: reminderCategory,
    title: v.string(),
    body: v.string(),
    fireAt: v.number(),
    timezone: v.string(),
    priority: reminderPriority,
    repeat: v.string(),
    status: reminderStatus,
    attempts: v.number(),
    lastError: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_status_fireAt', ['status', 'fireAt'])
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_task', ['workspaceId', 'taskId'])
    .index('by_dedupe', ['workspaceId', 'occurrenceId']),

  notifications: defineTable({
    workspaceId: v.string(),
    title: v.string(),
    body: v.string(),
    category: reminderCategory,
    taskId: v.optional(v.string()),
    reminderId: v.optional(v.string()),
    createdAt: v.number(),
    read: v.boolean(),
  })
    .index('by_workspace_created', ['workspaceId', 'createdAt'])
    .index('by_reminder', ['reminderId']),

  preferences: defineTable({
    workspaceId: v.string(),
    pushEnabled: v.boolean(),
    taskReminders: v.boolean(),
    deadlineAlerts: v.boolean(),
    dailyMotivation: v.boolean(),
    recurringReminders: v.boolean(),
    sound: notificationSound,
    quietHoursEnabled: v.boolean(),
    quietHoursStart: v.string(),
    quietHoursEnd: v.string(),
    urgentBypassQuietHours: v.boolean(),
    dailyMotivationTime: v.string(),
    timezone: v.string(),
    defaultReminderMinutes: v.number(),
    updatedAt: v.number(),
  }).index('by_workspace', ['workspaceId']),

  motivationSends: defineTable({
    workspaceId: v.string(),
    dateKey: v.string(),
    sentAt: v.number(),
  }).index('by_workspace_date', ['workspaceId', 'dateKey']),
});
