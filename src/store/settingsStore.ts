import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, Priority, ThemeMode } from '../types';

interface SettingsState extends Settings {
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  theme: 'system',
  soundEnabled: true,
  notificationsEnabled: true,
  browserNotificationsEnabled: false,
  defaultPriority: 'medium',
  defaultCategory: 'personal',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          ...state,
          ...updates,
        }));
      },

      resetSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'anantha-settings-store',
    }
  )
);
