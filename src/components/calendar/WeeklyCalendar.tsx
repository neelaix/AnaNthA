import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { Task } from '../../types';
import { cn } from '../../utils/cn';

interface WeeklyCalendarProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
  selectedDate?: Date;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  tasks,
  onDateClick,
  selectedDate,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  });

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, date);
    });
  };

  const getPendingTasksForDate = (date: Date): number => {
    return getTasksForDate(date).filter((t) => !t.completed).length;
  };

  const getCompletedTasksForDate = (date: Date): number => {
    return getTasksForDate(date).filter((t) => t.completed).length;
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToThisWeek = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
          onClick={goToPreviousWeek}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        </motion.button>

        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-midnight-900 dark:text-midnight-50">
            Week of {format(currentWeekStart, 'MMM d')}
          </h2>
          <p className="text-sm text-midnight-600 dark:text-midnight-400 mt-1">
            {format(currentWeekStart, 'yyyy')}
          </p>
        </div>

        <motion.button
          onClick={goToNextWeek}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        </motion.button>
      </div>

      {/* This Week Button */}
      <div className="flex justify-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToThisWeek}
        >
          This Week
        </Button>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day, dayIndex) => {
          const isTodayDate = isToday(day);
          const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
          const dayTasks = getTasksForDate(day);
          const pendingTasks = dayTasks.filter((t) => !t.completed).length;
          const completedTasks = dayTasks.filter((t) => t.completed).length;

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className={cn(
                'rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer flex flex-col',
                isSelectedDay
                  ? 'border-lavender-600 bg-lavender-50 dark:bg-midnight-800'
                  : isTodayDate
                  ? 'border-lavender-400 bg-midnight-50 dark:bg-midnight-800 shadow-lg'
                  : 'border-midnight-200 dark:border-midnight-700 bg-midnight-100 dark:bg-midnight-800/50 hover:border-lavender-300 dark:hover:border-lavender-500'
              )}
              onClick={() => onDateClick(day)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Day Header */}
              <div className="mb-3 pb-3 border-b border-midnight-200 dark:border-midnight-700">
                <p className="text-xs font-semibold text-midnight-600 dark:text-midnight-400 uppercase tracking-wider">
                  {dayNames[dayIndex]}
                </p>
                <p className={cn(
                  'text-lg font-bold mt-1',
                  isTodayDate
                    ? 'text-lavender-600 dark:text-lavender-400'
                    : 'text-midnight-900 dark:text-midnight-50'
                )}>
                  {format(day, 'd')}
                </p>
              </div>

              {/* Task Summary */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-midnight-500 dark:text-midnight-500 text-center py-4">
                      No tasks
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <motion.div
                          key={task.id}
                          className={cn(
                            'text-xs px-2 py-1 rounded truncate',
                            task.completed
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through'
                              : task.priority === 'urgent'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold'
                              : task.priority === 'high'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          )}
                          title={task.title}
                        >
                          {task.title}
                        </motion.div>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-midnight-500 dark:text-midnight-400 px-2 py-1">
                          +{dayTasks.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Count Badge */}
                {dayTasks.length > 0 && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-midnight-200 dark:border-midnight-700">
                    {pendingTasks > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-midnight-700 dark:text-midnight-300">
                          {pendingTasks}
                        </span>
                      </div>
                    )}
                    {completedTasks > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-semibold text-midnight-700 dark:text-midnight-300">
                          {completedTasks}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-midnight-200 dark:border-midnight-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-midnight-600 dark:text-midnight-400">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-midnight-600 dark:text-midnight-400">Completed</span>
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyCalendar;
