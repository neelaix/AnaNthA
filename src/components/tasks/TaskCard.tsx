import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, CheckCircle2, Circle, Flag } from 'lucide-react';
import { Task, Priority } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { isOverdue, getDateLabel, getTimeRemaining } from '../../utils/dateHelpers';
import { cn } from '../../utils/cn';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

const priorityConfig: Record<Priority, { color: string; icon: React.ReactNode }> = {
  low: { color: 'info', icon: null },
  medium: { color: 'warning', icon: null },
  high: { color: 'danger', icon: <Flag className="w-3 h-3" /> },
  urgent: { color: 'danger', icon: <Flag className="w-3 h-3" /> },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onComplete,
}) => {
  const overdue = task.deadline ? isOverdue(task.deadline) : false;
  const dateLabel = task.deadline ? getDateLabel(task.deadline) : null;
  const timeRemaining = task.deadline ? getTimeRemaining(task.deadline) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={cn(
        'p-4 rounded-xl border transition-all duration-200',
        task.completed
          ? 'bg-midnight-100 dark:bg-midnight-800/50 border-midnight-200 dark:border-midnight-700'
          : 'bg-white dark:bg-midnight-900 border-midnight-200 dark:border-midnight-800 hover:border-lavender-500/50 dark:hover:border-lavender-600/50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <motion.button
          onClick={() => onComplete(task.id)}
          className="flex-shrink-0 mt-1 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-midnight-300 dark:text-midnight-600 hover:text-lavender-600 dark:hover:text-lavender-400" />
          )}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.p
            className={cn(
              'font-medium transition-all duration-200',
              task.completed
                ? 'line-through text-midnight-500 dark:text-midnight-500'
                : 'text-midnight-900 dark:text-midnight-50'
            )}
          >
            {task.title}
          </motion.p>

          {task.description && (
            <p className="text-sm text-midnight-600 dark:text-midnight-400 line-clamp-2 mt-1">
              {task.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <Badge
              variant={priorityConfig[task.priority].color as any}
              size="sm"
              icon={priorityConfig[task.priority].icon}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            {overdue && (
              <Badge variant="danger" size="sm">
                Overdue
              </Badge>
            )}

            {dateLabel && !overdue && (
              <Badge variant="info" size="sm">
                {dateLabel}
              </Badge>
            )}

            {task.tags.map((tag, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            onClick={() => onEdit(task)}
            className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors duration-200 text-midnight-600 dark:text-midnight-400 hover:text-midnight-900 dark:hover:text-midnight-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={() => onDelete(task.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-200 text-midnight-600 dark:text-midnight-400 hover:text-red-600 dark:hover:text-red-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
