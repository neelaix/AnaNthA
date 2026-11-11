import { useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { AnalyticsData, DailyStats } from '../types';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const useAnalytics = (): AnalyticsData => {
  const tasks = useTaskStore((state) => state.getTasks());
  const categories = useTaskStore((state) => state.getCategories());

  return useMemo(() => {
    const completedTasks = tasks.filter((t) => t.completed);
    const pendingTasks = tasks.filter((t) => !t.completed);
    const overdueTasks = pendingTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date()
    );

    // Daily completion rate
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todayTasks = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) >= todayStart && new Date(t.deadline) <= todayEnd
    );
    const todayCompleted = completedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= todayStart && new Date(t.completedAt) <= todayEnd
    );
    const dailyCompletion = todayTasks.length > 0 ? (todayCompleted.length / todayTasks.length) * 100 : 0;

    // Weekly completion (last 7 days)
    const weeklyCompletion: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayTasks = tasks.filter(
        (t) => t.deadline && new Date(t.deadline) >= dayStart && new Date(t.deadline) <= dayEnd
      );
      const dayCompleted = completedTasks.filter(
        (t) => t.completedAt && new Date(t.completedAt) >= dayStart && new Date(t.completedAt) <= dayEnd
      );
      weeklyCompletion.push(dayTasks.length > 0 ? (dayCompleted.length / dayTasks.length) * 100 : 0);
    }

    // Monthly completion (last 30 days)
    const monthlyCompletion: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayTasks = tasks.filter(
        (t) => t.deadline && new Date(t.deadline) >= dayStart && new Date(t.deadline) <= dayEnd
      );
      const dayCompleted = completedTasks.filter(
        (t) => t.completedAt && new Date(t.completedAt) >= dayStart && new Date(t.completedAt) <= dayEnd
      );
      monthlyCompletion.push(dayTasks.length > 0 ? (dayCompleted.length / dayTasks.length) * 100 : 0);
    }

    // Streak calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayTasks = tasks.filter(
        (t) => t.deadline && new Date(t.deadline) >= dayStart && new Date(t.deadline) <= dayEnd
      );
      const dayCompleted = completedTasks.filter(
        (t) => t.completedAt && new Date(t.completedAt) >= dayStart && new Date(t.completedAt) <= dayEnd
      );

      if (dayTasks.length > 0 && dayCompleted.length === dayTasks.length) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Best productive day
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats: Record<string, { completed: number; total: number }> = {};
    for (const day of dayMap) {
      dayStats[day] = { completed: 0, total: 0 };
    }

    tasks.forEach((task) => {
      if (task.deadline) {
        const day = dayMap[new Date(task.deadline).getDay()];
        dayStats[day].total++;
        if (task.completed) {
          dayStats[day].completed++;
        }
      }
    });

    let bestDay = 'Monday';
    let bestPercentage = 0;
    Object.entries(dayStats).forEach(([day, stats]) => {
      const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      if (percentage > bestPercentage) {
        bestPercentage = percentage;
        bestDay = day;
      }
    });

    // Category stats
    const categoryStats = categories
      .filter((c) => !c.isCustom || c.name !== 'Completed')
      .map((cat) => {
        const catTasks = tasks.filter((t) => t.category === cat.id);
        const catCompleted = catTasks.filter((t) => t.completed).length;
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          completedCount: catCompleted,
          totalCount: catTasks.length,
          percentage: catTasks.length > 0 ? (catCompleted / catTasks.length) * 100 : 0,
        };
      });

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      dailyCompletion,
      weeklyCompletion,
      monthlyCompletion,
      currentStreak,
      longestStreak,
      bestProductiveDay: bestDay,
      categoryStats,
    };
  }, [tasks, categories]);
};
