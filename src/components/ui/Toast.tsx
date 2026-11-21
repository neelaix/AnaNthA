import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, CalendarClock, Sparkles, X } from 'lucide-react';
import type { NotificationCategory } from '../../types';
import { useToastStore, type ToastItem } from '../../store/toastStore';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../utils/cn';

const AUTO_DISMISS_MS = 8000;

function iconFor(category?: NotificationCategory) {
  switch (category) {
    case 'deadline-alert':
      return <CalendarClock className="w-4 h-4 text-amber-400" />;
    case 'daily-motivation':
      return <Sparkles className="w-4 h-4 text-lavender-300" />;
    case 'task-reminder':
      return <BellRing className="w-4 h-4 text-lavender-400" />;
    default:
      return <Bell className="w-4 h-4 text-lavender-400" />;
  }
}

const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
  onOpenTask?: (taskId: string) => void;
}> = ({ toast, onDismiss, onOpenTask }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        if (toast.taskId) onOpenTask?.(toast.taskId);
        onDismiss(toast.id);
      }}
      className={cn(
        'pointer-events-auto w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden border',
        'border-white/10 dark:border-midnight-700/60 bg-white/95 dark:bg-midnight-900/95 backdrop-blur-xl shadow-glass-lg',
        toast.taskId && 'cursor-pointer',
      )}
      role="status"
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-500/25 to-midnight-600/20 flex items-center justify-center">
          {iconFor(toast.category)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-midnight-900 dark:text-midnight-50 line-clamp-1">
            {toast.title}
          </h4>
          <p className="text-xs text-midnight-600 dark:text-midnight-400 line-clamp-2 mt-0.5">
            {toast.message}
          </p>
          {toast.taskId && (
            <span className="inline-block mt-1.5 text-[10px] font-semibold text-lavender-600 dark:text-lavender-400">
              Open task →
            </span>
          )}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDismiss(toast.id);
          }}
          className="flex-shrink-0 p-1 rounded-md text-midnight-400 hover:text-midnight-700 dark:hover:text-midnight-200"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastHostProps {
  onNavigate?: (page: string) => void;
}

const ToastHost: React.FC<ToastHostProps> = ({ onNavigate }) => {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const openTask = useUIStore((state) => state.openTask);

  const handleOpenTask = (taskId: string) => {
    openTask(taskId);
    onNavigate?.('all');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
            onOpenTask={handleOpenTask}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastHost;
