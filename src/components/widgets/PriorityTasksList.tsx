import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Task, Priority } from '../../types';
import { isOverdue, isDueToday, getTimeRemaining } from '../../utils/dateHelpers';

interface PriorityTasksListProps {
  tasks: Task[];
  title?: string;
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  low: { color: 'info', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'danger', label: 'High' },
  urgent: { color: 'danger', label: 'Urgent' },
};

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

const PriorityTasksList: React.FC<PriorityTasksListProps> = ({
  tasks,
  title = 'Priority Tasks',
}) => {
  const priorityTasks = tasks
    .filter((t) => !t.completed && (t.priority === 'high' || t.priority === 'urgent'))
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);

  if (priorityTasks.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
        <p className="text-midnight-600 dark:text-midnight-400">
          No high-priority tasks. Great job!
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <div className="p-6 border-b border-midnight-200 dark:border-midnight-800">
        <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50">
          {title}
        </h3>
      </div>
      <motion.div
        className="divide-y divide-midnight-200 dark:divide-midnight-800"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {priorityTasks.map((task) => {
          const overdue = isOverdue(task.deadline!);
          const dueToday = isDueToday(task.deadline!);
          const timeRemaining = task.deadline ? getTimeRemaining(task.deadline) : '';

          return (
            <motion.div
              key={task.id}
              className="p-4 hover:bg-midnight-100 dark:hover:bg-midnight-800/50 transition-colors duration-200"
              variants={itemVariants}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1.5 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-lavender-600 to-midnight-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-midnight-900 dark:text-midnight-50 truncate">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-midnight-600 dark:text-midnight-400 line-clamp-1 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tags and Badges */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge
                      variant={priorityConfig[task.priority].color as any}
                      size="sm"
                      icon={
                        task.priority === 'urgent' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : undefined
                      }
                    >
                      {priorityConfig[task.priority].label}
                    </Badge>

                    {overdue && (
                      <Badge variant="danger" size="sm">
                        Overdue
                      </Badge>
                    )}

                    {dueToday && (
                      <Badge variant="warning" size="sm">
                        Due Today
                      </Badge>
                    )}

                    {task.deadline && !overdue && !dueToday && (
                      <Badge variant="info" size="sm" icon={<Clock className="w-3 h-3" />}>
                        {timeRemaining}
                      </Badge>
                    )}

                    {task.tags.length > 0 && (
                      <Badge variant="primary" size="sm">
                        {task.tags[0]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
};

export default PriorityTasksList;
