import { create } from 'zustand';

interface UIState {
  pendingTaskId?: string;
  openTask: (taskId: string) => void;
  consumePendingTask: () => string | undefined;
}

export const useUIStore = create<UIState>((set, get) => ({
  pendingTaskId: undefined,
  openTask: (taskId) => set({ pendingTaskId: taskId }),
  consumePendingTask: () => {
    const taskId = get().pendingTaskId;
    if (taskId) set({ pendingTaskId: undefined });
    return taskId;
  },
}));
