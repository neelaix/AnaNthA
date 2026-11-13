import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Link2,
  MonitorSmartphone,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Volume2,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { convex, convexEnabled } from '../lib/convex';
import { usePush } from '../hooks/usePush';
import { useSettings } from '../hooks/useSettings';
import { useSettingsStore } from '../store/settingsStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { disablePush, enablePush } from '../utils/push';
import { pushPreferences } from '../utils/preferences';
import type { NotificationSound, Settings } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Toggle from '../components/ui/Toggle';
import { cn } from '../utils/cn';

type DeviceInfo = {
  deviceId: string;
  name: string;
  createdAt: number;
  lastSeenAt: number;
  isCurrent: boolean;
  subscriptions: Array<{
    id: string;
    userAgent: string;
    createdAt: number;
    lastSeenAt: number;
  }>;
};

type Message = { type: 'success' | 'error' | 'info'; text: string } | null;

const MessageCard: React.FC<{ message: Message }> = ({ message }) => {
  if (!message) return null;
  const Icon = message.type === 'success' ? CheckCircle2 : message.type === 'error' ? AlertCircle : Info;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border text-sm',
        message.type === 'success' &&
          'bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-300',
        message.type === 'error' && 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300',
        message.type === 'info' && 'bg-lavender-500/10 border-lavender-500/40 text-midnight-700 dark:text-lavender-200',
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message.text}</span>
    </motion.div>
  );
};

const Section: React.FC<{
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <Card variant="glass" hover={false}>
    <div className="p-5 border-b border-midnight-200/70 dark:border-midnight-800">
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-lg bg-gradient-to-br from-lavender-500/20 to-midnight-600/10">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50">{title}</h2>
          {description && (
            <p className="text-xs text-midnight-600 dark:text-midnight-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </Card>
);

const NotificationSettings: React.FC = () => {
  const push = usePush();
  const { updateSettings } = useSettings();
  const identity = useWorkspaceStore((state) => state.identity);
  const ready = useWorkspaceStore((state) => state.ready);
  const pairCode = useWorkspaceStore((state) => state.pairCode);
  const pairCodeExpiresAt = useWorkspaceStore((state) => state.pairCodeExpiresAt);
  const refreshPairCode = useWorkspaceStore((state) => state.refreshPairCode);
  const joinWorkspace = useWorkspaceStore((state) => state.join);

  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [pairBusy, setPairBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const settings = useSettings();

  const auth = identity
    ? { workspaceId: identity.workspaceId, deviceId: identity.deviceId, token: identity.token }
    : null;

  const save = (patch: Partial<Settings>) => {
    updateSettings(patch);
    void pushPreferences(patch);
  };

  const fetchDevices = useCallback(async () => {
    if (!auth || !convexEnabled || !convex) return;
    try {
      const result = await convex.query(api.subscriptions.listDevices, auth);
      setDevices(result.devices as DeviceInfo[]);
    } catch {
      setDevices([]);
    }
  }, [auth?.workspaceId, auth?.deviceId, auth?.token]);

  useEffect(() => {
    if (!ready) return;
    void fetchDevices();
  }, [ready, fetchDevices]);

  useEffect(() => {
    if (!ready || !auth || !convexEnabled || !convex) return;
    let cancelled = false;
    void (async () => {
      try {
        const remote = await convex.query(api.preferences.get, auth);
        if (cancelled) return;
        if (remote && remote.updatedAt > 0) {
          updateSettings({
            pushEnabled: remote.pushEnabled,
            taskReminders: remote.taskReminders,
            deadlineAlerts: remote.deadlineAlerts,
            dailyMotivation: remote.dailyMotivation,
            recurringReminders: remote.recurringReminders,
            notificationSound: remote.sound as NotificationSound,
            quietHoursEnabled: remote.quietHoursEnabled,
            quietHoursStart: remote.quietHoursStart,
            quietHoursEnd: remote.quietHoursEnd,
            urgentBypassQuietHours: remote.urgentBypassQuietHours,
            dailyMotivationTime: remote.dailyMotivationTime,
            defaultReminderMinutes: remote.defaultReminderMinutes,
          });
        } else {
          await pushPreferences(useSettingsStore.getState());
        }
      } catch {
        // Local settings stay authoritative when the backend is offline.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, auth?.workspaceId, auth?.deviceId, auth?.token, updateSettings]);

  const handlePushToggle = async (next: boolean) => {
    if (next) {
      const result = await push.enable();
      if (result.ok) {
        updateSettings({ pushEnabled: true });
        void pushPreferences({ pushEnabled: true });
        setMessage({ type: 'success', text: result.message });
      } else {
        updateSettings({ pushEnabled: false });
        setMessage({ type: 'error', text: result.message });
      }
    } else {
      await push.disable();
      updateSettings({ pushEnabled: false });
      void pushPreferences({ pushEnabled: false });
      setMessage({ type: 'info', text: 'Push notifications are disabled on this device.' });
    }
    void fetchDevices();
  };

  const handleTest = async () => {
    const result = await push.test();
    setMessage({
      type: result.ok ? 'success' : 'error',
      text: result.message,
    });
  };

  const handleRefreshPairCode = async () => {
    const result = await refreshPairCode();
    setMessage(
      result.ok
        ? { type: 'success', text: 'New pairing code generated. Enter it on your other device.' }
        : { type: 'error', text: result.message ?? 'Could not generate a pairing code.' },
    );
  };

  const handleJoin = async () => {
    setPairBusy(true);
    try {
      await disablePush();
      const result = await joinWorkspace(joinCode);
      if (result.ok) {
        const enabled = await enablePush();
        setMessage({
          type: enabled.ok ? 'success' : 'info',
          text: enabled.ok
            ? 'Device linked and push notifications enabled.'
            : 'Device linked. Enable notifications on this device when you are ready.',
        });
        setJoinCode('');
        void fetchDevices();
      } else {
        setMessage({ type: 'error', text: result.message ?? 'Could not join this workspace.' });
      }
    } finally {
      setPairBusy(false);
    }
  };

  const handleRemoveSubscription = async (subscriptionId: string) => {
    if (!auth || !convexEnabled || !convex) return;
    try {
      await convex.mutation(api.subscriptions.remove, {
        ...auth,
        subscriptionId: subscriptionId as Id<'subscriptions'>,
      });
      const device = devices.find((item) =>
        item.subscriptions.some((subscription) => subscription.id === subscriptionId),
      );
      if (device?.isCurrent) {
        await disablePush();
        updateSettings({ pushEnabled: false, browserNotificationsEnabled: false });
      }
      setMessage({ type: 'success', text: 'Device subscription removed.' });
      void fetchDevices();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not remove this device.',
      });
    }
  };

  const permission = push.state?.permission ?? 'unsupported';
  const standalone = push.state?.standalone ?? false;
  const ios = push.state?.ios ?? false;
  const supported = push.state?.supported ?? false;

  return (
    <motion.div
      className="p-5 md:p-8 max-w-4xl mx-auto w-full space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-midnight-900 dark:text-midnight-50 mb-2">
          Notifications
        </h1>
        <p className="text-midnight-600 dark:text-midnight-400">
          Your goals should never go unnoticed — even when ANAṆTHA is closed.
        </p>
      </div>

      <MessageCard message={message ?? push.message} />

      <Section
        title="Permission status"
        description="Push notifications are requested only when you tap enable."
        icon={<ShieldCheck className="w-5 h-5 text-lavender-500" />}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-midnight-50/70 dark:bg-midnight-800/50 border border-midnight-200/70 dark:border-midnight-700">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                permission === 'granted' && 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]',
                permission === 'denied' && 'bg-red-500',
                permission === 'default' && 'bg-amber-400',
                permission === 'unsupported' && 'bg-midnight-400',
              )}
            />
            <div>
              <p className="text-sm font-semibold text-midnight-900 dark:text-midnight-50">
                {permission === 'granted' && 'Notifications allowed'}
                {permission === 'denied' && 'Notifications blocked'}
                {permission === 'default' && 'Permission not requested yet'}
                {permission === 'unsupported' && 'Push not supported in this browser'}
              </p>
              <p className="text-xs text-midnight-600 dark:text-midnight-400">
                {push.state?.subscribed
                  ? 'This device has an active push subscription.'
                  : 'No active push subscription on this device.'}
              </p>
            </div>
          </div>
          <Toggle checked={Boolean(push.state?.subscribed)} onChange={handlePushToggle} disabled={push.busy || !supported} />
        </div>

        {permission === 'denied' && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-sm text-midnight-700 dark:text-midnight-300 space-y-1.5">
            <p className="font-semibold text-red-600 dark:text-red-300">How to unblock notifications</p>
            <p>Android Chrome: ⋮ → Settings → Site settings → Notifications → find this site → Allow.</p>
            <p>iPhone: Settings → Notifications → ANAṆTHA → Allow Notifications.</p>
            <p>Desktop: click the lock icon in the address bar → Site settings → Notifications → Allow.</p>
          </div>
        )}

        {ios && !standalone && (
          <div className="p-4 rounded-xl border border-lavender-400/40 bg-lavender-500/10 text-sm text-midnight-700 dark:text-midnight-300">
            <p className="font-semibold text-lavender-700 dark:text-lavender-300">Install on iPhone first</p>
            <p className="mt-1">
              Open ANAṆTHA in Safari, tap Share → Add to Home Screen, then open the installed app and
              enable notifications. iOS 16.4+ is required.
            </p>
          </div>
        )}

        {!standalone && (
          <div className="p-4 rounded-xl border border-midnight-200 dark:border-midnight-700 bg-midnight-50/60 dark:bg-midnight-800/40 text-sm text-midnight-600 dark:text-midnight-400">
            <p className="font-semibold text-midnight-800 dark:text-midnight-200">Install ANAṆTHA</p>
            <p className="mt-1">
              Android Chrome: menu → Install app. iPhone Safari: Share → Add to Home Screen. Installed
              apps receive the most reliable background reminders.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            isLoading={push.busy}
            icon={<Send className="w-4 h-4" />}
          >
            Send test notification
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void push.refresh()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh status
          </Button>
        </div>

        {(!push.state?.convexReady || !push.state?.vapidConfigured) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Backend not configured yet. Set VITE_CONVEX_URL and VITE_VAPID_PUBLIC_KEY, then run the
            Convex setup steps in SETUP.md.
          </p>
        )}
      </Section>

      <Section
        title="Preferences"
        description="Control what ANAṆTHA is allowed to send."
        icon={<Bell className="w-5 h-5 text-lavender-500" />}
      >
        <Toggle
          checked={settings.taskReminders}
          onChange={(value) => save({ taskReminders: value })}
          label="Task reminders"
          description="Reminders you schedule on tasks"
        />
        <Toggle
          checked={settings.deadlineAlerts}
          onChange={(value) => save({ deadlineAlerts: value })}
          label="Deadline alerts"
          description="10 minutes, 30 minutes, 1 hour before deadlines"
        />
        <Toggle
          checked={settings.dailyMotivation}
          onChange={(value) => save({ dailyMotivation: value })}
          label="Daily motivation"
          description="One gentle, inspiring message per day"
        />
        <Toggle
          checked={settings.recurringReminders}
          onChange={(value) => save({ recurringReminders: value })}
          label="Recurring reminders"
          description="Keep reminders for repeating tasks"
        />
        <Toggle
          checked={settings.urgentBypassQuietHours}
          onChange={(value) => save({ urgentBypassQuietHours: value })}
          label="Urgent reminders bypass quiet hours"
          description="High-priority reminders can still arrive at night"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Select
            label="Preferred notification sound"
            value={settings.notificationSound}
            onChange={(event) =>
              save({ notificationSound: event.target.value as NotificationSound })
            }
            options={[
              { value: 'default', label: 'Default' },
              { value: 'soft', label: 'Soft' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'silent', label: 'Silent' },
            ]}
          />
          <Input
            label="Default reminder (minutes before)"
            type="number"
            min={1}
            max={10080}
            value={settings.defaultReminderMinutes}
            onChange={(event) =>
              save({
                defaultReminderMinutes: Math.max(1, Math.min(10080, Number(event.target.value) || 30)),
              })
            }
          />
        </div>
        <p className="flex items-center gap-2 text-xs text-midnight-500 dark:text-midnight-400">
          <Volume2 className="w-3.5 h-3.5" />
          Final sound and vibration are controlled by your phone's OS. Web apps can request silent or
          vibrate modes, but cannot force a custom audio file.
        </p>

        <div className="pt-3 border-t border-midnight-200/70 dark:border-midnight-800 space-y-4">
          <Toggle
            checked={settings.quietHoursEnabled}
            onChange={(value) => save({ quietHoursEnabled: value })}
            label="Quiet hours"
            description="Suppress or defer non-urgent reminders during this window"
          />
          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quiet hours start"
                type="time"
                value={settings.quietHoursStart}
                onChange={(event) => save({ quietHoursStart: event.target.value })}
              />
              <Input
                label="Quiet hours end"
                type="time"
                value={settings.quietHoursEnd}
                onChange={(event) => save({ quietHoursEnd: event.target.value })}
              />
            </div>
          )}
          <Input
            label="Daily motivation time"
            type="time"
            value={settings.dailyMotivationTime}
            onChange={(event) => save({ dailyMotivationTime: event.target.value })}
          />
        </div>
      </Section>

      <Section
        title="Devices"
        description="Every device linked to this workspace receives reminders."
        icon={<MonitorSmartphone className="w-5 h-5 text-lavender-500" />}
      >
        {devices.length === 0 ? (
          <p className="text-sm text-midnight-600 dark:text-midnight-400">
            No linked devices yet. Enable notifications above to register this device.
          </p>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="p-3.5 rounded-xl border border-midnight-200/70 dark:border-midnight-700 bg-midnight-50/50 dark:bg-midnight-800/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Smartphone className="w-4 h-4 text-lavender-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-midnight-900 dark:text-midnight-50 truncate">
                      {device.name}
                    </span>
                    {device.isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-lavender-600 text-white font-bold">
                        This device
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-midnight-500 dark:text-midnight-400">
                    {device.subscriptions.length} subscription{device.subscriptions.length === 1 ? '' : 's'}
                  </span>
                </div>
                {device.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between gap-2 mt-2 pl-6">
                    <span className="text-xs text-midnight-500 dark:text-midnight-400 truncate">
                      {subscription.userAgent}
                    </span>
                    <button
                      onClick={() => void handleRemoveSubscription(subscription.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Link another device"
        description="Pair a second phone or tablet to the same notification workspace."
        icon={<Link2 className="w-5 h-5 text-lavender-500" />}
      >
        <div className="p-4 rounded-xl border border-lavender-400/30 bg-lavender-500/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-midnight-500 dark:text-midnight-400">
                Pairing code
              </p>
              <p className="text-2xl font-mono font-bold tracking-[0.25em] text-midnight-900 dark:text-lavender-200">
                {pairCode ?? '——————'}
              </p>
              {pairCodeExpiresAt && (
                <p className="text-xs text-midnight-500 dark:text-midnight-400 mt-1">
                  Expires {new Date(pairCodeExpiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleRefreshPairCode()}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {pairCode ? 'New code' : 'Generate code'}
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter pairing code from another device"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            maxLength={12}
          />
          <Button
            variant="primary"
            onClick={() => void handleJoin()}
            isLoading={pairBusy}
            disabled={joinCode.trim().length < 6}
            className="sm:w-auto"
          >
            Link device
          </Button>
        </div>
        <p className="text-xs text-midnight-500 dark:text-midnight-400">
          Pairing uses a short-lived code and a private workspace token stored only on your devices.
          Server credentials and VAPID private keys never reach the browser.
        </p>
      </Section>
    </motion.div>
  );
};

export default NotificationSettings;
