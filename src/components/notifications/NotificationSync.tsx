import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNotificationStore } from '../../store/notificationStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

const NotificationSync = () => {
  const identity = useWorkspaceStore((state) => state.identity);
  const ready = useWorkspaceStore((state) => state.ready);

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
    useNotificationStore.getState().mergeRemote(
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
  }, [remote]);

  return null;
};

export default NotificationSync;
