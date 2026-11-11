import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Notification } from '../../utils/notifications';
import { cn } from '../../utils/cn';

interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  notifications,
  onMarkAsRead,
  onRemove,
  onMarkAllAsRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'task-due':
        return 'text-blue-600 dark:text-blue-400';
      case 'overdue':
        return 'text-red-600 dark:text-red-400';
      case 'reminder':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-midnight-600 dark:text-midnight-400';
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-lavender-600 text-white text-xs font-bold flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-midnight-900 rounded-xl shadow-xl border border-midnight-200 dark:border-midnight-800 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-midnight-50 dark:bg-midnight-800 border-b border-midnight-200 dark:border-midnight-700">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-lavender-600" />
                  <span className="text-sm font-semibold text-midnight-900 dark:text-midnight-50">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-lavender-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-midnight-500 hover:text-midnight-700 dark:hover:text-midnight-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-midnight-600 dark:text-midnight-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-midnight-200 dark:divide-midnight-800">
                    {notifications.map((notif, idx) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          if (!notif.read) onMarkAsRead(notif.id);
                        }}
                        className={cn(
                          'p-3 hover:bg-midnight-50 dark:hover:bg-midnight-800/50 transition-colors cursor-pointer flex gap-3',
                          !notif.read && 'bg-lavender-50/50 dark:bg-midnight-800/30'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-midnight-900 dark:text-midnight-50 line-clamp-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-midnight-600 dark:text-midnight-400 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <span className="text-xs text-midnight-500 dark:text-midnight-500 mt-1 block">
                            {formatTime(notif.timestamp)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(notif.id);
                          }}
                          className="flex-shrink-0 text-midnight-400 hover:text-midnight-600 dark:hover:text-midnight-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {!notif.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-lavender-500 mt-2" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 bg-midnight-50 dark:bg-midnight-800 border-t border-midnight-200 dark:border-midnight-700 flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        onMarkAllAsRead();
                        setIsOpen(false);
                      }}
                      className="flex-1 text-xs font-semibold text-lavender-600 hover:text-lavender-700 dark:hover:text-lavender-400 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
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

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

export default NotificationBell;
