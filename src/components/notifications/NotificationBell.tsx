import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, CalendarClock, Sparkles, BellRing } from 'lucide-react';
import type { NotificationCategory } from '../../types';
import { Notification } from '../../utils/notifications';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../utils/cn';

interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll?: () => void;
  onNavigate?: (page: string) => void;
}

type Filter = 'all' | NotificationCategory;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'task-reminder', label: 'Tasks' },
  { id: 'deadline-alert', label: 'Deadlines' },
  { id: 'daily-motivation', label: 'Motivation' },
];

function iconFor(category: NotificationCategory) {
  switch (category) {
    case 'deadline-alert':
      return <CalendarClock className="w-4 h-4 text-amber-400" />;
    case 'daily-motivation':
      return <Sparkles className="w-4 h-4 text-lavender-300" />;
    case 'task-reminder':
      return <BellRing className="w-4 h-4 text-lavender-400" />;
    default:
      return <Bell className="w-4 h-4 text-midnight-300" />;
  }
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  notifications,
  onMarkAsRead,
  onRemove,
  onMarkAllAsRead,
  onClearAll,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const openTask = useUIStore((state) => state.openTask);

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? notifications
        : notifications.filter((notification) => notification.category === filter),
    [filter, notifications],
  );

  const handleOpen = (notification: Notification) => {
    if (!notification.read) onMarkAsRead(notification.id);
    if (notification.taskId) {
      openTask(notification.taskId);
      onNavigate?.('all');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative p-2 rounded-xl hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        title="Notifications"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gradient-to-r from-lavender-500 to-midnight-600 text-white text-[10px] font-bold flex items-center justify-center shadow-glow"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed md:absolute left-3 right-3 md:left-auto md:right-0 top-[72px] md:top-full md:mt-2 md:w-[390px] z-50 rounded-2xl overflow-hidden border border-white/10 dark:border-midnight-700/60 bg-white/95 dark:bg-midnight-900/95 backdrop-blur-xl shadow-glass-lg"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-midnight-200/70 dark:border-midnight-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-gradient-to-br from-lavender-500/20 to-midnight-600/20">
                    <Bell className="w-4 h-4 text-lavender-500" />
                  </span>
                  <span className="text-sm font-semibold text-midnight-900 dark:text-midnight-50">
                    Notification Center
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lavender-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-midnight-500 hover:text-midnight-800 dark:hover:text-midnight-200 hover:bg-midnight-100 dark:hover:bg-midnight-800"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-midnight-200/70 dark:border-midnight-800">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                      filter === item.id
                        ? 'bg-gradient-to-r from-lavender-600 to-midnight-700 text-white shadow-glow'
                        : 'text-midnight-600 dark:text-midnight-300 hover:bg-midnight-100 dark:hover:bg-midnight-800',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="max-h-[62vh] md:max-h-[420px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-midnight-500 dark:text-midnight-400">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No notifications here yet</p>
                    <p className="text-xs mt-1">Reminders will appear even while the app was closed.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-midnight-200/70 dark:divide-midnight-800">
                    {filtered.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleOpen(notification)}
                        className={cn(
                          'p-3.5 flex gap-3 cursor-pointer transition-colors hover:bg-midnight-50 dark:hover:bg-midnight-800/60',
                          !notification.read && 'bg-lavender-50/60 dark:bg-lavender-900/10',
                          notification.taskId && 'cursor-pointer',
                        )}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-midnight-100 dark:bg-midnight-800 flex items-center justify-center">
                          {iconFor(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-midnight-900 dark:text-midnight-50 line-clamp-1">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-lavender-500 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-midnight-600 dark:text-midnight-400 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-midnight-500 dark:text-midnight-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            {notification.taskId && (
                              <span className="text-[10px] font-semibold text-lavender-600 dark:text-lavender-400">
                                Open task →
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onRemove(notification.id);
                          }}
                          className="self-start flex-shrink-0 p-1 rounded-md text-midnight-400 hover:text-red-500 hover:bg-red-500/10"
                          aria-label="Delete notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-midnight-200/70 dark:border-midnight-800 bg-midnight-50/70 dark:bg-midnight-900/60">
                  <button
                    onClick={onMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-lavender-600 dark:text-lavender-400 disabled:opacity-40"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                  <button
                    onClick={() => {
                      onClearAll?.();
                      setIsOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-midnight-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear all
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
