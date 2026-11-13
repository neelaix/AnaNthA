import { api } from '../../convex/_generated/api';
import { convex, convexEnabled, VAPID_PUBLIC_KEY } from '../lib/convex';
import { useSettingsStore } from '../store/settingsStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { urlBase64ToUint8Array } from './crypto';

export type PushSupportState = {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  standalone: boolean;
  ios: boolean;
  convexReady: boolean;
  vapidConfigured: boolean;
};

export type PushActionResult = {
  ok: boolean;
  message: string;
};

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;
  return await registration.pushManager.getSubscription();
}

export async function getPushSupportState(): Promise<PushSupportState> {
  const supported = isPushSupported();
  const subscription = supported ? await getCurrentSubscription() : null;
  return {
    supported,
    permission: supported ? getPermission() : 'unsupported',
    subscribed: Boolean(subscription),
    standalone: isStandalone(),
    ios: isIOS(),
    convexReady: convexEnabled,
    vapidConfigured: Boolean(VAPID_PUBLIC_KEY),
  };
}

function ensureIdentity() {
  return useWorkspaceStore.getState().identity;
}

async function saveSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  if (!convexEnabled || !convex) return;
  const identity = ensureIdentity();
  if (!identity) throw new Error('Workspace is not ready yet. Please try again.');
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!p256dh || !auth) throw new Error('Browser did not provide valid push keys.');

  await convex.mutation(api.subscriptions.upsert, {
    workspaceId: identity.workspaceId,
    deviceId: identity.deviceId,
    token: identity.token,
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    userAgent: navigator.userAgent,
  });
}

export async function enablePush(): Promise<PushActionResult> {
  if (!isPushSupported()) {
    return {
      ok: false,
      message: 'This browser does not support Web Push. On iPhone, install ANAṆTHA to your Home Screen using Safari 16.4 or newer.',
    };
  }
  if (isIOS() && !isStandalone()) {
    return {
      ok: false,
      message: 'On iPhone, add ANAṆTHA to your Home Screen first (Share → Add to Home Screen), then open it and enable notifications.',
    };
  }
  if (!convexEnabled) {
    return { ok: false, message: 'The notification backend is not configured. Add VITE_CONVEX_URL to your environment.' };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, message: 'VAPID public key is missing. Add VITE_VAPID_PUBLIC_KEY to your environment.' };
  }

  await useWorkspaceStore.getState().ensure();
  if (!ensureIdentity()) {
    return { ok: false, message: 'Could not create a notification workspace. Check your connection and try again.' };
  }

  let permission = getPermission();
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return {
      ok: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked. Open your browser settings for this site and allow notifications, then try again.'
          : 'Notification permission was not granted.',
    };
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return { ok: false, message: 'Service worker is not ready yet. Reload the app and try again.' };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Could not create a push subscription. Check browser permissions and try again.',
      };
    }
  }

  try {
    await saveSubscriptionToBackend(subscription);
    useSettingsStore.getState().updateSettings({
      pushEnabled: true,
      browserNotificationsEnabled: true,
    });
    return { ok: true, message: 'Push notifications are enabled on this device.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not register this device for push notifications.',
    };
  }
}

export async function syncExistingPush(): Promise<boolean> {
  if (!isPushSupported() || getPermission() !== 'granted') return false;
  const subscription = await getCurrentSubscription();
  if (!subscription) return false;
  try {
    await saveSubscriptionToBackend(subscription);
    useSettingsStore.getState().updateSettings({ pushEnabled: true, browserNotificationsEnabled: true });
    return true;
  } catch {
    return false;
  }
}

export async function disablePush(): Promise<PushActionResult> {
  const subscription = await getCurrentSubscription();
  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch {
      // Ignore unsubscribe failures and still clear backend registrations.
    }
  }

  if (convexEnabled && convex) {
    const identity = ensureIdentity();
    if (identity) {
      try {
        await convex.mutation(api.subscriptions.removeDevice, {
          workspaceId: identity.workspaceId,
          deviceId: identity.deviceId,
          token: identity.token,
        });
      } catch {
        // Best effort; the subscription was already unsubscribed locally.
      }
    }
  }

  useSettingsStore.getState().updateSettings({ pushEnabled: false, browserNotificationsEnabled: false });
  return { ok: true, message: 'Push notifications are disabled on this device.' };
}

export async function sendTestPush(): Promise<PushActionResult> {
  if (!convexEnabled || !convex) {
    await showLocalNotification('ANAṆTHA test notification ∞', {
      body: 'Local notifications work. Connect the backend to test push delivery.',
    });
    return { ok: true, message: 'Local test notification sent.' };
  }

  await useWorkspaceStore.getState().ensure();
  const identity = ensureIdentity();
  if (!identity) return { ok: false, message: 'Workspace is not ready yet.' };

  try {
    const result = await convex.action(api.push.sendTest, {
      workspaceId: identity.workspaceId,
      deviceId: identity.deviceId,
      token: identity.token,
    });
    return {
      ok: true,
      message: `Test push delivered to ${result.delivered} subscription${result.delivered === 1 ? '' : 's'}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not send a test notification.',
    };
  }
}

export async function showLocalNotification(
  title: string,
  options: NotificationOptions = {},
): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const registration = await getServiceWorkerRegistration();
  if (registration) {
    await registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      ...options,
    });
    return;
  }
  new Notification(title, { icon: '/pwa-192x192.png', ...options });
}
