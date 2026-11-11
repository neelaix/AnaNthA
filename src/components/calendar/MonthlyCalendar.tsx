import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { Task } from '../../types';
import { cn } from '../../utils/cn';

interface MonthlyCalendarProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
  selectedDate?: Date;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  tasks,
  onDateClick,
  selectedDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

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

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          onClick={goToPreviousMonth}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        </motion.button>

        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-midnight-900 dark:text-midnight-50">
            {format(currentMonth, 'MMMM')}
          </h2>
          <p className="text-sm text-midnight-600 dark:text-midnight-400 mt-1">
            {format(currentMonth, 'yyyy')}
          </p>
        </div>

        <motion.button
          onClick={goToNextMonth}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-midnight-700 dark:text-midnight-300" />
        </motion.button>
      </div>

      {/* Today Button */}
      <div className="flex justify-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-midnight-600 dark:text-midnight-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <motion.div
            key={weekIndex}
            className="grid grid-cols-7 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: weekIndex * 0.05 }}
          >
            {week.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const pendingTasks = getPendingTasksForDate(day);
              const completedTasks = getCompletedTasksForDate(day);
              const totalTasks = pendingTasks + completedTasks;

              return (
                <motion.button
                  key={day.toISOString()}
                  onClick={() => onDateClick(day)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'aspect-square rounded-lg p-2 transition-all duration-200 flex flex-col items-center justify-start text-xs font-medium relative',
                    isSelectedDay
                      ? 'bg-gradient-to-br from-lavender-600 to-midnight-700 text-white ring-2 ring-lavender-400'
                      : isCurrentMonth
                      ? isTodayDate
                        ? 'bg-midnight-100 dark:bg-midnight-800 text-midnight-900 dark:text-midnight-50 border-2 border-lavender-600'
                        : 'bg-midnight-100 dark:bg-midnight-800 text-midnight-900 dark:text-midnight-50 hover:bg-midnight-200 dark:hover:bg-midnight-700'
                      : 'bg-transparent text-midnight-300 dark:text-midnight-700'
                  )}
                >
                  {/* Date Number */}
                  <span className="font-semibold">{format(day, 'd')}</span>

                  {/* Task Indicators */}
                  {isCurrentMonth && totalTasks > 0 && (
                    <div className="mt-1 flex gap-0.5">
                      {pendingTasks > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${pendingTasks} pending`} />
                      )}
                      {completedTasks > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title={`${completedTasks} completed`} />
                      )}
                    </div>
                  )}

                  {/* Task Count Badge */}
                  {isCurrentMonth && totalTasks > 0 && (
                    <span className="text-xs mt-1 px-1.5 py-0.5 rounded bg-midnight-200 dark:bg-midnight-700 text-midnight-700 dark:text-midnight-200 font-semibold">
                      {totalTasks}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        ))}
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

export default MonthlyCalendar;
