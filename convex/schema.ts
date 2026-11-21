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

export const taskPriority = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('urgent'),
);

export const devicePlatform = v.union(v.literal('web'), v.literal('android'), v.literal('ios'));

export const recurrence = v.object({
  frequency: v.union(
    v.literal('daily'),
    v.literal('weekly'),
    v.literal('monthly'),
    v.literal('yearly'),
  ),
  interval: v.number(),
  daysOfWeek: v.optional(v.array(v.number())),
  endAt: v.optional(v.number()),
  count: v.optional(v.number()),
});

export const reminderConfig = v.object({
  enabled: v.boolean(),
  offsets: v.array(v.number()),
  time: v.optional(v.string()),
  date: v.optional(v.string()),
  notifyAtDeadline: v.boolean(),
  priority: v.union(v.literal('low'), v.literal('normal'), v.literal('high')),
  repeat: v.optional(v.string()),
  message: v.optional(v.string()),
});

export default defineSchema({
  workspaces: defineTable({
    workspaceId: v.string(),
    pairCode: v.string(),
    pairCodeExpiresAt: v.number(),
    createdAt: v.number(),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
    recoveryCodeHash: v.optional(v.string()),
    recoveryCodeCreatedAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    ownerUserId: v.optional(v.string()),
  })
    .index('by_workspace_id', ['workspaceId'])
    .index('by_pair_code', ['pairCode']),

  devices: defineTable({
    workspaceId: v.string(),
    deviceId: v.string(),
    name: v.string(),
    tokenHash: v.string(),
    userAgent: v.optional(v.string()),
    platform: v.optional(devicePlatform),
    appVersion: v.optional(v.string()),
    fcmToken: v.optional(v.string()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    lastTestAt: v.optional(v.number()),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_device', ['workspaceId', 'deviceId'])
    .index('by_workspace_platform', ['workspaceId', 'platform']),

  fcmTokens: defineTable({
    workspaceId: v.string(),
    deviceId: v.string(),
    token: v.string(),
    platform: devicePlatform,
    createdAt: v.number(),
    lastSeenAt: v.number(),
    lastError: v.optional(v.string()),
  })
    .index('by_token', ['token'])
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_device', ['workspaceId', 'deviceId']),

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

  tasks: defineTable({
    workspaceId: v.string(),
    taskId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: taskPriority,
    categoryId: v.string(),
    tags: v.array(v.string()),
    deadline: v.optional(v.number()),
    startAt: v.optional(v.number()),
    timezone: v.string(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    recurrence: v.optional(recurrence),
    reminder: v.optional(reminderConfig),
    parentTaskId: v.optional(v.string()),
    occurrenceKey: v.optional(v.string()),
    isRecurringInstance: v.optional(v.boolean()),
    seq: v.number(),
    version: v.number(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdByDeviceId: v.optional(v.string()),
    updatedByDeviceId: v.optional(v.string()),
  })
    .index('by_workspace_task', ['workspaceId', 'taskId'])
    .index('by_workspace_seq', ['workspaceId', 'seq'])
    .index('by_workspace_deadline', ['workspaceId', 'deadline'])
    .index('by_workspace_completed', ['workspaceId', 'completed']),

  categories: defineTable({
    workspaceId: v.string(),
    categoryId: v.string(),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    isCustom: v.boolean(),
    order: v.number(),
    seq: v.number(),
    version: v.number(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace_category', ['workspaceId', 'categoryId'])
    .index('by_workspace_seq', ['workspaceId', 'seq']),

  focusSessions: defineTable({
    workspaceId: v.string(),
    sessionId: v.string(),
    taskId: v.optional(v.string()),
    kind: v.union(v.literal('focus'), v.literal('short-break'), v.literal('long-break')),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    plannedMinutes: v.number(),
    completed: v.boolean(),
    timezone: v.string(),
    seq: v.number(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace_session', ['workspaceId', 'sessionId'])
    .index('by_workspace_seq', ['workspaceId', 'seq'])
    .index('by_workspace_started', ['workspaceId', 'startedAt']),

  dailyStats: defineTable({
    workspaceId: v.string(),
    dateKey: v.string(),
    completed: v.number(),
    created: v.number(),
    focusMinutes: v.number(),
    overdue: v.number(),
    seq: v.number(),
    updatedAt: v.number(),
  }).index('by_workspace_date', ['workspaceId', 'dateKey']),

  syncState: defineTable({
    workspaceId: v.string(),
    lastSeq: v.number(),
    updatedAt: v.number(),
  }).index('by_workspace', ['workspaceId']),

  syncOps: defineTable({
    workspaceId: v.string(),
    opId: v.string(),
    appliedAt: v.number(),
  }).index('by_workspace_op', ['workspaceId', 'opId']),

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
    source: v.optional(v.union(v.literal('legacy'), v.literal('server'))),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    webSentCount: v.optional(v.number()),
    fcmSentCount: v.optional(v.number()),
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
    dedupeKey: v.optional(v.string()),
    createdAt: v.number(),
    read: v.boolean(),
    readAt: v.optional(v.number()),
  })
    .index('by_workspace_created', ['workspaceId', 'createdAt'])
    .index('by_reminder', ['reminderId'])
    .index('by_workspace_dedupe', ['workspaceId', 'dedupeKey']),

  preferences: defineTable({
    workspaceId: v.string(),
    pushEnabled: v.boolean(),
    taskReminders: v.boolean(),
    deadlineAlerts: v.boolean(),
    dailyMotivation: v.boolean(),
    recurringReminders: v.boolean(),
    sound: notificationSound,
    vibration: v.optional(v.boolean()),
    quietHoursEnabled: v.boolean(),
    quietHoursStart: v.string(),
    quietHoursEnd: v.string(),
    urgentBypassQuietHours: v.boolean(),
    dailyMotivationTime: v.string(),
    timezone: v.string(),
    defaultReminderMinutes: v.number(),
    focusMinutes: v.optional(v.number()),
    shortBreakMinutes: v.optional(v.number()),
    longBreakMinutes: v.optional(v.number()),
    updatedAt: v.number(),
  }).index('by_workspace', ['workspaceId']),

  motivationSends: defineTable({
    workspaceId: v.string(),
    dateKey: v.string(),
    sentAt: v.number(),
  }).index('by_workspace_date', ['workspaceId', 'dateKey']),
});
