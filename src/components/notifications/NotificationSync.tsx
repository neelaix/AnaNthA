import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNotificationStore } from '../../store/notificationStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToastStore } from '../../store/toastStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { showLocalNotification } from '../../utils/push';

const NotificationSync = () => {
  const identity = useWorkspaceStore((state) => state.identity);
  const ready = useWorkspaceStore((state) => state.ready);
  const primedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());

  const args =
    identity && ready
      ? {
          workspaceId: identity.workspaceId,
          deviceId: identity.deviceId,
          token: identity.token,
          limit: 100,
        }
      : 'skip';

  const remote = useQuery(api.notifications.list, args as never) as
    | Array<{
        id: string;
        title: string;
        body: string;
        category: 'task-reminder' | 'deadline-alert' | 'daily-motivation' | 'system';
        taskId?: string;
        createdAt: number;
        read: boolean;
      }>
    | undefined;

  useEffect(() => {
    if (!Array.isArray(remote)) return;

    const store = useNotificationStore.getState();
    const fresh = remote.filter(
      (item) =>
        !store.isKnown(item.id) &&
        !item.read &&
        item.createdAt >= mountedAtRef.current - 60_000,
    );

    store.mergeRemote(
      remote.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.body,
        category: item.category,
        timestamp: item.createdAt,
        read: item.read,
        taskId: item.taskId,
      })),
    );

    if (!primedRef.current) {
      primedRef.current = true;
      return;
    }

    if (fresh.length === 0) return;

    const sound = useSettingsStore.getState().notificationSound;
    const visible = typeof document !== 'undefined' && document.visibilityState === 'visible';

    for (const item of fresh) {
      useToastStore.getState().pushToast({
        title: item.title,
        message: item.body,
        category: item.category,
        taskId: item.taskId,
      });

      if (visible) {
        void showLocalNotification(item.title, {
          body: item.body,
          tag: `anantha-${item.id}`,
          silent: sound === 'silent',
          data: {
            taskId: item.taskId,
            notificationId: item.id,
            url: item.taskId ? `/?task=${encodeURIComponent(item.taskId)}` : '/?page=today',
          },
        });
      }
    }
  }, [remote]);

  return null;
};

export default NotificationSync;
