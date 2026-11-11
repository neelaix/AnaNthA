import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Task } from '../../types';
import { getDateLabel, getTimeRemaining, isOverdue } from '../../utils/dateHelpers';

interface UpcomingDeadlinesProps {
  tasks: Task[];
  limit?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ tasks, limit = 5 }) => {
  const upcomingTasks = tasks
    .filter((t) => t.deadline && !t.completed)
    .sort((a, b) => {
      const aDate = new Date(a.deadline!).getTime();
      const bDate = new Date(b.deadline!).getTime();
      return aDate - bDate;
    })
    .slice(0, limit);

  if (upcomingTasks.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <Calendar className="w-12 h-12 text-lavender-500 mx-auto mb-3 opacity-50" />
        <p className="text-midnight-600 dark:text-midnight-400">
          No upcoming deadlines. You're all set!
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <div className="p-6 border-b border-midnight-200 dark:border-midnight-800">
        <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50">
          Upcoming Deadlines
        </h3>
      </div>

      <motion.div
        className="divide-y divide-midnight-200 dark:divide-midnight-800"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {upcomingTasks.map((task) => {
          const timeRemaining = getTimeRemaining(task.deadline!);
          const overdue = isOverdue(task.deadline!) || timeRemaining === 'Overdue';
          const dateLabel = getDateLabel(task.deadline!);

          return (
            <motion.div
              key={task.id}
              className="p-4 hover:bg-midnight-100 dark:hover:bg-midnight-800/50 transition-colors duration-200 flex items-center justify-between gap-4"
              variants={itemVariants}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-midnight-900 dark:text-midnight-50 truncate">
                  {task.title}
                </p>
                <p className="text-sm text-midnight-600 dark:text-midnight-400 mt-1">
                  {dateLabel}
                  {task.time && ` at ${task.time}`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {overdue ? (
                  <Badge variant="danger" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
                    Overdue
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    {timeRemaining}
                  </Badge>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
};

export default UpcomingDeadlines;
