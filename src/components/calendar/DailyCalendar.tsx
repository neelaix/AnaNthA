import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  addDays,
  subDays,
  isToday,
  isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Button from '../ui/Button';
import { Task } from '../../types';
import { cn } from '../../utils/cn';
import { getTimeRemaining, isOverdue } from '../../utils/dateHelpers';

interface DailyCalendarProps {
  tasks: Task[];
  selectedDate: Date;
  onDateClick: (date: Date) => void;
}

const DailyCalendar: React.FC<DailyCalendarProps> = ({
  tasks,
  selectedDate,
  onDateClick,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, date);
    });
  };

  const dayTasks = getTasksForDate(currentDate);
  const pendingTasks = dayTasks.filter((t) => !t.completed);
  const completedTasks = dayTasks.filter((t) => t.completed);

  const goToPreviousDay = () => {
    const newDate = subDays(currentDate, 1);
    setCurrentDate(newDate);
    onDateClick(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    onDateClick(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateClick(today);
  };

  const isTodayDate = isToday(currentDate);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'from-red-500 to-red-600';
      case 'high':
        return 'from-orange-500 to-orange-600';
      case 'medium':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-green-500 to-green-600';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'bg-green-100 dark:bg-green-900/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-midnight-900 rounded-2xl shadow-glass border border-midnight-200 dark:border-midnight-800 p-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={goToPreviousDay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        </motion.button>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CalendarIcon className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
            <h2 className="text-2xl font-bold text-midnight-900 dark:text-midnight-50">
              {format(currentDate, 'MMMM d')}
            </h2>
          </div>
          <p className="text-sm text-midnight-600 dark:text-midnight-400">
            {format(currentDate, 'EEEE, yyyy')}
          </p>
          {isTodayDate && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-400">
              Today
            </span>
          )}
        </div>

        <motion.button
          onClick={goToNextDay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        </motion.button>
      </div>

      {/* Today Button */}
      {!isTodayDate && (
        <div className="flex justify-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
          >
            Go to Today
          </Button>
        </div>
      )}

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 pb-6 border-b border-midnight-200 dark:border-midnight-800">
        <div className="text-center">
          <p className="text-3xl font-bold text-midnight-900 dark:text-midnight-50">
            {dayTasks.length}
          </p>
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mt-1">
            Total Tasks
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {pendingTasks.length}
          </p>
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mt-1">
            Pending
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {completedTasks.length}
          </p>
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mt-1">
            Completed
          </p>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-6">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold text-midnight-900 dark:text-midnight-50 mb-4 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-amber-500" />
              Pending Tasks ({pendingTasks.length})
            </h3>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={cn(
                    'p-4 rounded-xl border-l-4 transition-all duration-200',
                    getPriorityBgColor(task.priority),
                    task.priority === 'urgent'
                      ? 'border-l-red-500'
                      : task.priority === 'high'
                      ? 'border-l-orange-500'
                      : task.priority === 'medium'
                      ? 'border-l-blue-500'
                      : 'border-l-green-500'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-midnight-900 dark:text-midnight-50 mb-1">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-midnight-600 dark:text-midnight-400 line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          task.priority === 'urgent'
                            ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                            : task.priority === 'high'
                            ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400'
                            : task.priority === 'medium'
                            ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                            : 'bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                        )}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {task.time && (
                          <span className="text-xs text-midnight-600 dark:text-midnight-400 font-medium">
                            {task.time}
                          </span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs bg-midnight-200 dark:bg-midnight-700 text-midnight-700 dark:text-midnight-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="text-xs text-midnight-600 dark:text-midnight-400">
                                +{task.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-midnight-900 dark:text-midnight-50 mb-4 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-500" />
              Completed Tasks ({completedTasks.length})
            </h3>
            <div className="space-y-3">
              {completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 opacity-70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-midnight-900 dark:text-midnight-50 line-through mb-1">
                        {task.title}
                      </h4>
                      {task.completedAt && (
                        <p className="text-xs text-midnight-500 dark:text-midnight-400">
                          Completed at {format(new Date(task.completedAt), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {dayTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-block p-4 rounded-full bg-lavender-100 dark:bg-lavender-900/30 mb-4">
              <CalendarIcon className="w-8 h-8 text-lavender-600 dark:text-lavender-400" />
            </div>
            <p className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-2">
              No tasks for this day
            </p>
            <p className="text-sm text-midnight-600 dark:text-midnight-400">
              {isTodayDate ? 'Great! Your day is clear.' : 'Consider adding some tasks.'}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DailyCalendar;
