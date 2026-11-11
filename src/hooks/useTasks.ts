import { useTaskStore } from '../store/taskStore';
import { Task, Priority } from '../types';

export const useTasks = () => {
  const store = useTaskStore();

  const todayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return store.getTasks().filter((task) => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline.getTime() === today.getTime();
    });
  };

  const upcomingTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return store
      .getTasks()
      .filter(
        (task) =>
          task.deadline &&
          !task.completed &&
          new Date(task.deadline) >= today
      )
      .sort(
        (a, b) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      );
  };

  const tasksByDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return store.getTasks().filter((task) => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline.getTime() === targetDate.getTime();
    });
  };

  const taskStats = () => {
    const tasks = store.getTasks();
    const completed = store.getCompletedTasks().length;
    const pending = store.getPendingTasks().length;
    const overdue = store.getOverdueTasks().length;

    return {
      total: tasks.length,
      completed,
      pending,
      overdue,
      completionPercentage: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
    };
  };

  const priorityStats = () => {
    const tasks = store.getTasks();
    const priorities: Record<Priority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    tasks.forEach((task) => {
      if (!task.completed) {
        priorities[task.priority]++;
      }
    });

    return priorities;
  };

  return {
    ...store,
    todayTasks,
    upcomingTasks,
    tasksByDate,
    taskStats,
    priorityStats,
  };
};
