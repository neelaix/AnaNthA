import React from 'react';
import { motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { useAnalytics } from '../hooks/useAnalytics';
import { ProgressRing } from '../components/ui';
import LiveClock from '../components/widgets/LiveClock';
import StatCard from '../components/widgets/StatCard';
import QuoteWidget from '../components/widgets/QuoteWidget';
import PriorityTasksList from '../components/widgets/PriorityTasksList';
import UpcomingDeadlines from '../components/widgets/UpcomingDeadlines';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const tasks = useTasks();
  const analytics = useAnalytics();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const stats = tasks.taskStats();

  return (
    <motion.div
      className="p-6 md:p-8 max-w-7xl mx-auto w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Live Clock & Greeting */}
      <motion.div variants={itemVariants}>
        <LiveClock />
      </motion.div>

      {/* Stats Cards Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={<Calendar />}
          label="Today's Tasks"
          value={tasks.todayTasks().length}
          color="lavender"
          subtext={`${tasks.todayTasks().filter(t => t.completed).length} completed`}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Completed"
          value={stats.completed}
          color="green"
          subtext={`${Math.round(stats.completionPercentage)}% completion`}
        />
        <StatCard
          icon={<AlertCircle />}
          label="Pending"
          value={stats.pending}
          color="amber"
          subtext={`${stats.overdue} overdue`}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Productivity"
          value={`${Math.round(analytics.dailyCompletion)}%`}
          color="blue"
          subtext={`Streak: ${analytics.currentStreak} days`}
        />
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
      >
        {/* Left: Progress Ring + Quote */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Progress Ring */}
          <motion.div
            className="flex-shrink-0"
            variants={itemVariants}
          >
            <div className="bg-white dark:bg-midnight-900 rounded-2xl p-8 shadow-glass flex flex-col items-center justify-center">
              <ProgressRing
                percentage={stats.completionPercentage}
                size={140}
                label="Daily Progress"
                subLabel={`${stats.completed} of ${stats.total} tasks`}
                color="#9d88ff"
              />
            </div>
          </motion.div>

          {/* Quote Widget */}
          <motion.div variants={itemVariants} className="flex-1">
            <QuoteWidget />
          </motion.div>
        </div>

        {/* Right: Priority Tasks + Upcoming */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <motion.div variants={itemVariants} className="flex-1">
            <PriorityTasksList tasks={tasks.getTasks()} title="🔥 Priority Tasks" />
          </motion.div>

          <motion.div variants={itemVariants} className="flex-1">
            <UpcomingDeadlines tasks={tasks.upcomingTasks()} limit={5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Analytics Overview Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <StatCard
          icon={<TrendingUp />}
          label="Best Productive Day"
          value={analytics.bestProductiveDay}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Current Streak"
          value={`${analytics.currentStreak} days`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Total Completed"
          value={analytics.completedTasks}
          color="lavender"
          subtext="all time"
        />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
