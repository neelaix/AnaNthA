import React from 'react';
import NotificationBell from './NotificationBell';
import { Notification } from '../../utils/notifications';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onRemove,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  return (
    <NotificationBell
      unreadCount={unreadCount}
      notifications={notifications}
      onMarkAsRead={onMarkAsRead}
      onRemove={onRemove}
      onMarkAllAsRead={onMarkAllAsRead}
      onClearAll={onClearAll}
    />
  );
};

export default NotificationCenter;
