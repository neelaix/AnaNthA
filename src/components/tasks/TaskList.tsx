import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types';
import TaskCard from './TaskCard';
import Card from '../ui/Card';
import { CheckCircle2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  emptyMessage?: string;
  groupByStatus?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  emptyMessage = 'No tasks yet. Create one to get started!',
  groupByStatus = false,
}) => {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (tasks.length === 0) {
    return (
      <Card variant="glass" className="p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-lavender-500 mx-auto mb-4 opacity-50" />
        <p className="text-midnight-600 dark:text-midnight-400">{emptyMessage}</p>
      </Card>
    );
  }

  if (groupByStatus) {
    return (
      <motion.div className="space-y-8">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
              Active Tasks
            </h3>
            <motion.div className="space-y-3">
              <AnimatePresence mode="sync">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onComplete={onComplete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
              Completed ({completedTasks.length})
            </h3>
            <motion.div className="space-y-3">
              <AnimatePresence mode="sync">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onComplete={onComplete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Simple list without grouping
  return (
    <motion.div className="space-y-3">
      <AnimatePresence mode="sync">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskList;
