/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { VAPID_PUBLIC_KEY, convexSiteUrl } from './lib/convex';
import { urlBase64ToUint8Array } from './utils/crypto';
import { loadPushIdentity } from './utils/idb';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null }>;
};

type PushPayload = {
  title?: string;
  body?: string;
  category?: string;
  taskId?: string;
  notificationId?: string;
  tag?: string;
  priority?: 'low' | 'normal' | 'high';
  sound?: 'default' | 'soft' | 'urgent' | 'silent';
  url?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/push\//],
  }),
);

setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const cached = await caches.match('/offline.html');
    if (cached) return cached;
  }
  return Response.error();
});

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload: PushPayload = {
    title: 'ANAṆTHA',
    body: 'You have a reminder waiting.',
    tag: 'anantha-reminder',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...(event.data.json() as PushPayload) };
    } catch {
      payload.body = event.data.text();
    }
  }

  const sound = payload.sound ?? 'default';
  const options = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: payload.tag || `anantha-${Date.now()}`,
    renotify: payload.priority === 'high',
    requireInteraction: payload.priority === 'high',
    silent: sound === 'silent',
    vibrate:
      sound === 'urgent'
        ? [200, 100, 200, 100, 200]
        : sound === 'soft'
          ? [80]
          : [160, 60, 160],
    data: {
      url: payload.url || (payload.taskId ? `/?task=${encodeURIComponent(payload.taskId)}` : '/'),
      taskId: payload.taskId,
      notificationId: payload.notificationId,
      category: payload.category,
    },
    actions: payload.actions ?? [
      { action: 'open', title: 'Open ANAṆTHA' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  } as NotificationOptions;

  event.waitUntil(
    self.registration.showNotification(payload.title || 'ANAṆTHA', {
      ...options,
      ...(sound === 'silent' ? { silent: true } : {}),
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const data = (event.notification.data ?? {}) as {
    url?: string;
    taskId?: string;
    notificationId?: string;
  };
  const targetUrl =
    data.url || (data.taskId ? `/?task=${encodeURIComponent(data.taskId)}` : '/');

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({
            type: 'OPEN_TASK',
            taskId: data.taskId,
            notificationId: data.notificationId,
          });
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  const changeEvent = event as ExtendableEvent & {
    newSubscription?: PushSubscription | null;
  };

  changeEvent.waitUntil(
    (async () => {
      const identity = await loadPushIdentity();
      if (!identity || !VAPID_PUBLIC_KEY || !convexSiteUrl) return;

      let subscription = changeEvent.newSubscription ?? null;
      if (!subscription) {
        subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = subscription.toJSON();
      await fetch(`${convexSiteUrl}/push/resubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: identity.workspaceId,
          deviceId: identity.deviceId,
          token: identity.token,
          subscription: {
            endpoint: subscription.endpoint,
            keys: json.keys,
          },
          userAgent: self.navigator.userAgent,
        }),
      });
    })(),
  );
});
