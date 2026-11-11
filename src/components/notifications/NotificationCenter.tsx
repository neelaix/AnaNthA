import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';
import { Notification } from '../../utils/notifications';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';

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
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'task-due':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-midnight-500" />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'task-due':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'overdue':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'reminder':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-midnight-50 dark:bg-midnight-800/20 border-midnight-200 dark:border-midnight-800';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="text-center py-8 text-midnight-600 dark:text-midnight-400"
          >
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </motion.div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {/* Header */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-midnight-900 dark:bg-midnight-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-lavender-400" />
                  <span className="text-sm font-semibold text-midnight-50">
                    Notifications ({notifications.length})
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-lavender-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="flex gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllAsRead}
                        className="text-xs text-lavender-400 hover:text-lavender-300 transition-colors"
                        title="Mark all as read"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={onClearAll}
                      className="text-xs text-midnight-400 hover:text-midnight-300 transition-colors"
                      title="Clear all"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notifications List */}
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
                className={cn(
                  'p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-lg',
                  getBgColor(notification.type),
                  !notification.read && 'opacity-100',
                  notification.read && 'opacity-75'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-midnight-900 dark:text-midnight-50">
                      {notification.title}
                    </h3>
                    <p className="text-xs text-midnight-600 dark:text-midnight-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-midnight-500 dark:text-midnight-500">
                        {formatTime(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 rounded-full bg-lavender-500" />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(notification.id);
                    }}
                    className="flex-shrink-0 text-midnight-400 hover:text-midnight-600 dark:hover:text-midnight-300 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export default NotificationCenter;
