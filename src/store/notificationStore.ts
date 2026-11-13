import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationCategory } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: number;
  read: boolean;
  taskId?: string;
  source?: 'local' | 'server';
}

interface NotificationState {
  notifications: AppNotification[];
  addLocal: (
    input: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'source'> & {
      timestamp?: number;
    },
  ) => AppNotification;
  mergeRemote: (items: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  isKnown: (id: string) => boolean;
}

const MAX_STORED = 200;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addLocal: (input) => {
        const notification: AppNotification = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: input.title,
          message: input.message,
          category: input.category,
          timestamp: input.timestamp ?? Date.now(),
          read: false,
          taskId: input.taskId,
          source: 'local',
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_STORED),
        }));
        return notification;
      },

      mergeRemote: (items) => {
        set((state) => {
          const byId = new Map<string, AppNotification>();
          for (const existing of state.notifications) byId.set(existing.id, existing);
          for (const remote of items) {
            const existing = byId.get(remote.id);
            byId.set(
              remote.id,
              existing
                ? {
                    ...existing,
                    ...remote,
                    read: remote.read || existing.read,
                    source: 'server',
                  }
                : { ...remote, source: 'server' },
            );
          }
          return {
            notifications: Array.from(byId.values())
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, MAX_STORED),
          };
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        }));
      },

      remove: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }));
      },

      clearAll: () => set({ notifications: [] }),

      isKnown: (id) => get().notifications.some((notification) => notification.id === id),
    }),
    {
      name: 'anantha-notifications-v2',
      version: 2,
    },
  ),
);
