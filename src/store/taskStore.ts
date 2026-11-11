import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Category, Priority, RecurrenceFrequency } from '../types';
import { generateRecurrenceInstances } from '../utils/recurrence';

interface TaskState {
  tasks: Task[];
  categories: Category[];
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  getTasks: () => Task[];
  getTasksByCategory: (categoryId: string) => Task[];
  getTasksByPriority: (priority: Priority) => Task[];
  getCompletedTasks: () => Task[];
  getPendingTasks: () => Task[];
  getOverdueTasks: () => Task[];
  searchTasks: (query: string) => Task[];
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategories: () => Category[];
  
  // Utility
  importData: (tasks: Task[], categories: Category[]) => void;
  clearAll: () => void;
}

const defaultCategories: Category[] = [
  { id: 'my-day', name: 'My Day', color: '#9d88ff', icon: 'inbox', isCustom: false },
  { id: 'upcoming', name: 'Upcoming', color: '#7d5fff', icon: 'calendar', isCustom: false },
  { id: 'important', name: 'Important', color: '#ff6b6b', icon: 'star', isCustom: false },
  { id: 'work', name: 'Work', color: '#4c6ef5', icon: 'briefcase', isCustom: false },
  { id: 'personal', name: 'Personal', color: '#15aabf', icon: 'user', isCustom: false },
  { id: 'study', name: 'Study', color: '#a78bfa', icon: 'book', isCustom: false },
  { id: 'health', name: 'Health', color: '#51cf66', icon: 'heart', isCustom: false },
];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories,

      // Task actions
      addTask: (taskData) => {
        const id = `task-${Date.now()}`;
        const now = new Date();
        const newTask: Task = {
          ...taskData,
          id,
          createdAt: now,
          updatedAt: now,
          completed: false,
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: task.completed ? undefined : new Date(),
                  updatedAt: new Date(),
                }
              : task
          ),
        }));
      },

      getTasks: () => get().tasks,

      getTasksByCategory: (categoryId) => {
        return get().tasks.filter((task) => task.category === categoryId);
      },

      getTasksByPriority: (priority) => {
        return get().tasks.filter((task) => task.priority === priority);
      },

      getCompletedTasks: () => {
        return get().tasks.filter((task) => task.completed);
      },

      getPendingTasks: () => {
        return get().tasks.filter((task) => !task.completed);
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter(
          (task) =>
            !task.completed &&
            task.deadline &&
            new Date(task.deadline) < now
        );
      },

      searchTasks: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(lowerQuery) ||
            task.description?.toLowerCase().includes(lowerQuery) ||
            task.tags.some((tag) =>
              tag.toLowerCase().includes(lowerQuery)
            )
        );
      },

      // Category actions
      addCategory: (categoryData) => {
        const id = `cat-${Date.now()}`;
        const newCategory: Category = {
          ...categoryData,
          id,
        };

        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
          // Move tasks from deleted category to "Personal"
          tasks: state.tasks.map((task) =>
            task.category === id ? { ...task, category: 'personal' } : task
          ),
        }));
      },

      getCategories: () => get().categories,

      importData: (importedTasks, importedCategories) => {
        const existingCategoryIds = new Set(get().categories.map((c) => c.id));
        const newCategories = importedCategories.filter(
          (c) => c.id && !existingCategoryIds.has(c.id)
        );
        const mergedCategories = [...get().categories, ...newCategories];
        const validCategoryIds = new Set(mergedCategories.map((c) => c.id));

        const tasks = importedTasks.map((task, index) => ({
          ...task,
          id: task.id || `task-imported-${Date.now()}-${index}`,
          completed: Boolean(task.completed),
          tags: task.tags ?? [],
          category: validCategoryIds.has(task.category) ? task.category : 'personal',
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
          deadline: task.deadline ? new Date(task.deadline) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));

        set({ tasks, categories: mergedCategories });
      },

      clearAll: () => {
        set({
          tasks: [],
          categories: defaultCategories,
        });
      },
    }),
    {
      name: 'anantha-task-store',
      version: 1,
      migrate: (persistedState: any) => ({
        ...persistedState,
        tasks: [],
        categories: defaultCategories,
      }),
    }
  )
);
