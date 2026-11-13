'use node';

import * as webpush from 'web-push';
import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { authArgs } from './lib/auth';
import {
  DEFAULT_PREFERENCES,
  MAX_ATTEMPTS,
  MOTIVATION_MESSAGES,
  RETRY_DELAYS_MS,
} from './lib/defaults';
import {
  isWithinQuietHours,
  localTime,
  nextLocalTime,
  toMinutes,
} from './lib/time';

type SendOutcome = {
  endpoint: string;
  ok: boolean;
  statusCode?: number;
  message?: string;
};

function configureWebPush(): { publicKey: string; privateKey: string; subject: string } {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@anantha.app';

  if (!publicKey || !privateKey) {
    throw new Error(
      'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your Convex deployment environment.',
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { publicKey, privateKey, subject };
}

async function deliver(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  payload: string,
  urgency: 'very-low' | 'low' | 'normal' | 'high',
): Promise<SendOutcome[]> {
  return await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 60 * 60, urgency },
        );
        return { endpoint: subscription.endpoint, ok: true };
      } catch (error) {
        const typed = error as { statusCode?: number; body?: string; message?: string };
        return {
          endpoint: subscription.endpoint,
          ok: false,
          statusCode: typed.statusCode,
          message: typed.body || typed.message || 'Push delivery failed',
        };
      }
    }),
  );
}

function isExpired(statusCode?: number): boolean {
  return statusCode === 404 || statusCode === 410;
}

function isPermanent(statusCode?: number): boolean {
  return statusCode === 400 || statusCode === 401 || statusCode === 403;
}

export const sendDue = internalAction({
  args: {},
  handler: async (ctx) => {
    configureWebPush();
    const now = Date.now();
    const claimed = (await ctx.runMutation(internal.reminders.claimDue, { now })) as Array<{
      _id: any;
      workspaceId: string;
      taskId: string;
      occurrenceId: string;
      category: 'task-reminder' | 'deadline-alert';
      title: string;
      body: string;
      fireAt: number;
      timezone: string;
      priority: 'low' | 'normal' | 'high';
      repeat: string;
      attempts: number;
    }>;

    let sent = 0;
    let failed = 0;
    let suppressed = 0;
    let deferred = 0;

    for (const reminder of claimed) {
      const preferences = await ctx.runQuery(internal.preferences.getForWorkspace, {
        workspaceId: reminder.workspaceId,
      });
      const prefs = preferences ?? DEFAULT_PREFERENCES;
      const attempts = reminder.attempts + 1;

      if (!prefs.pushEnabled) {
        await ctx.runMutation(internal.reminders.suppress, {
          reminderId: reminder._id,
          reason: 'Push notifications are disabled',
        });
        suppressed += 1;
        continue;
      }

      if (reminder.category === 'task-reminder' && !prefs.taskReminders) {
        await ctx.runMutation(internal.reminders.suppress, {
          reminderId: reminder._id,
          reason: 'Task reminders are disabled',
        });
        suppressed += 1;
        continue;
      }

      if (reminder.category === 'deadline-alert' && !prefs.deadlineAlerts) {
        await ctx.runMutation(internal.reminders.suppress, {
          reminderId: reminder._id,
          reason: 'Deadline alerts are disabled',
        });
        suppressed += 1;
        continue;
      }

      if (
        reminder.category === 'task-reminder' &&
        reminder.repeat &&
        reminder.repeat !== 'none' &&
        !prefs.recurringReminders
      ) {
        await ctx.runMutation(internal.reminders.suppress, {
          reminderId: reminder._id,
          reason: 'Recurring reminders are disabled',
        });
        suppressed += 1;
        continue;
      }

      const timezone = reminder.timezone || prefs.timezone || 'UTC';
      const quiet = isWithinQuietHours(
        now,
        timezone,
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        prefs.quietHoursEnabled,
      );
      const urgentBypass = prefs.urgentBypassQuietHours && reminder.priority === 'high';

      if (quiet && !urgentBypass) {
        await ctx.runMutation(internal.reminders.defer, {
          reminderId: reminder._id,
          fireAt: nextLocalTime(now, timezone, prefs.quietHoursEnd),
          reason: 'Deferred during quiet hours',
        });
        deferred += 1;
        continue;
      }

      const subscriptions = await ctx.runQuery(internal.subscriptions.listForWorkspace, {
        workspaceId: reminder.workspaceId,
      });

      if (subscriptions.length === 0) {
        await ctx.runMutation(internal.reminders.markResult, {
          reminderId: reminder._id,
          sent: false,
          attempts,
          error: 'No active push subscriptions for this workspace',
          removeEndpoints: [],
        });
        failed += 1;
        continue;
      }

      const payload = JSON.stringify({
        title: reminder.title,
        body: reminder.body,
        category: reminder.category,
        taskId: reminder.taskId,
        reminderId: reminder._id,
        tag: reminder.occurrenceId,
        priority: reminder.priority,
        sound: prefs.sound,
        timestamp: now,
        url: `/?task=${encodeURIComponent(reminder.taskId)}&notification=${reminder._id}`,
        actions: [
          { action: 'open', title: 'Open task' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });

      const outcomes = await deliver(
        subscriptions.map((subscription: { endpoint: string; p256dh: string; auth: string }) => ({
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        })),
        payload,
        reminder.priority === 'high'
          ? 'high'
          : reminder.priority === 'low'
            ? 'low'
            : 'normal',
      );

      const removeEndpoints = outcomes
        .filter((outcome) => !outcome.ok && isExpired(outcome.statusCode))
        .map((outcome) => outcome.endpoint);
      const successes = outcomes.filter((outcome) => outcome.ok).length;

      if (successes > 0) {
        await ctx.runMutation(internal.reminders.markResult, {
          reminderId: reminder._id,
          sent: true,
          attempts,
          removeEndpoints,
          notification: {
            title: reminder.title,
            body: reminder.body,
            category: reminder.category,
            taskId: reminder.taskId,
          },
        });
        sent += 1;
        continue;
      }

      const permanent = outcomes.every((outcome) => isPermanent(outcome.statusCode));
      const retryable = !permanent && attempts < MAX_ATTEMPTS;
      const nextRetryAt = retryable
        ? now + RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)]
        : undefined;

      await ctx.runMutation(internal.reminders.markResult, {
        reminderId: reminder._id,
        sent: false,
        attempts,
        error: outcomes[0]?.message || 'All push deliveries failed',
        removeEndpoints,
        nextRetryAt,
      });
      failed += 1;
    }

    return { claimed: claimed.length, sent, failed, suppressed, deferred };
  },
});

export const sendDailyMotivation = internalAction({
  args: {},
  handler: async (ctx) => {
    configureWebPush();
    const now = Date.now();
    const preferences = await ctx.runQuery(internal.preferences.listWithDailyMotivation, {});
    let sent = 0;

    for (const prefs of preferences) {
      const timezone = prefs.timezone || 'UTC';
      const local = localTime(now, timezone);
      const target = toMinutes(prefs.dailyMotivationTime);
      if (local.minutesOfDay < target || local.minutesOfDay >= target + 60) continue;

      if (
        isWithinQuietHours(
          now,
          timezone,
          prefs.quietHoursStart,
          prefs.quietHoursEnd,
          prefs.quietHoursEnabled,
        )
      ) {
        continue;
      }

      const dateKey = local.dateKey;
      const alreadySent = await ctx.runQuery(internal.motivation.alreadySent, {
        workspaceId: prefs.workspaceId,
        dateKey,
      });
      if (alreadySent) continue;

      const subscriptions = await ctx.runQuery(internal.subscriptions.listForWorkspace, {
        workspaceId: prefs.workspaceId,
      });
      if (subscriptions.length === 0) continue;

      const dayNumber = Math.floor(
        new Date(`${dateKey}T00:00:00Z`).getTime() / (24 * 60 * 60 * 1000),
      );
      const message =
        MOTIVATION_MESSAGES[Math.abs(dayNumber) % MOTIVATION_MESSAGES.length];

      const payload = JSON.stringify({
        title: 'Your daily ANAṆTHA ∞',
        body: message,
        category: 'daily-motivation',
        tag: `daily-motivation-${dateKey}`,
        priority: 'low',
        sound: prefs.sound === 'silent' ? 'silent' : prefs.sound,
        timestamp: now,
        url: '/?page=today',
        actions: [{ action: 'open', title: 'Open ANAṆTHA' }],
      });

      const outcomes = await deliver(
        subscriptions.map((subscription: { endpoint: string; p256dh: string; auth: string }) => ({
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        })),
        payload,
        'low',
      );

      const removeEndpoints = outcomes
        .filter((outcome) => !outcome.ok && isExpired(outcome.statusCode))
        .map((outcome) => outcome.endpoint);

      if (outcomes.some((outcome) => outcome.ok)) {
        await ctx.runMutation(internal.motivation.record, {
          workspaceId: prefs.workspaceId,
          dateKey,
          title: 'Your daily ANAṆTHA ∞',
          body: message,
        });
        sent += 1;
      }

      if (removeEndpoints.length > 0) {
        await ctx.runMutation(internal.subscriptions.pruneEndpoints, {
          endpoints: removeEndpoints,
        });
      }
    }

    return { sent };
  },
});

export const sendTest = action({
  args: { ...authArgs },
  handler: async (ctx, args) => {
    configureWebPush();
    const { workspaceId } = await ctx.runMutation(internal.subscriptions.authorizeTest, args);
    const subscriptions = await ctx.runQuery(internal.subscriptions.listForWorkspace, {
      workspaceId,
    });

    if (subscriptions.length === 0) {
      throw new Error('No push subscription found. Enable notifications on this device first.');
    }

    const payload = JSON.stringify({
      title: 'ANAṆTHA test notification ∞',
      body: 'Push notifications are working. Your goals will never go unnoticed.',
      category: 'system',
      tag: `test-${Date.now()}`,
      priority: 'normal',
      sound: 'default',
      timestamp: Date.now(),
      url: '/?page=notifications-settings',
      actions: [{ action: 'open', title: 'Open settings' }],
    });

    const outcomes = await deliver(
      subscriptions.map((subscription: { endpoint: string; p256dh: string; auth: string }) => ({
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      })),
      payload,
      'normal',
    );

    const removeEndpoints = outcomes
      .filter((outcome) => !outcome.ok && isExpired(outcome.statusCode))
      .map((outcome) => outcome.endpoint);
    if (removeEndpoints.length > 0) {
      await ctx.runMutation(internal.subscriptions.pruneEndpoints, { endpoints: removeEndpoints });
    }

    const delivered = outcomes.filter((outcome) => outcome.ok).length;
    if (delivered === 0) {
      throw new Error(
        outcomes[0]?.message ||
          'Could not deliver the test notification. Check your browser and OS notification settings.',
      );
    }

    await ctx.runMutation(internal.notifications.insert, {
      workspaceId,
      title: 'Test notification',
      body: 'Push delivery verified on this device.',
      category: 'system',
    });

    return { delivered, failed: outcomes.length - delivered };
  },
});
