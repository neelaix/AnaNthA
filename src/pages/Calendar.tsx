import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { MonthlyCalendar, WeeklyCalendar, DailyCalendar } from '../components/calendar';
import { Card } from '../components/ui';
import Button from '../components/ui/Button';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import { Task } from '../types';
import DeleteConfirmDialog from '../components/tasks/DeleteConfirmDialog';
import { cn } from '../utils/cn';

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const { getTasks, deleteTask, completeTask } = useTasks();
  const allTasks = getTasks();

  const selectedDateTasks = allTasks.filter((task) => {
    if (!task.deadline) return false;
    return isSameDay(new Date(task.deadline), selectedDate);
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleOpenForm = (task?: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      setIsDeleting(true);
      try {
        deleteTask(taskToDelete.id);
        setDeleteConfirmOpen(false);
        setTaskToDelete(undefined);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
  };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-7xl mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-midnight-900 dark:text-midnight-50 mb-2 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-lavender-600" />
          Calendar
        </h1>
        <p className="text-midnight-600 dark:text-midnight-400">
          Visualize and manage your tasks by date
        </p>
      </motion.div>

      {/* View Switcher */}
      <motion.div
        className="mb-8 flex gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { view: 'month' as const, label: 'Month' },
          { view: 'week' as const, label: 'Week' },
          { view: 'day' as const, label: 'Day' },
        ].map((option) => (
          <motion.button
            key={option.view}
            onClick={() => setCalendarView(option.view)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200',
              calendarView === option.view
                ? 'bg-gradient-to-r from-lavender-600 to-midnight-700 text-white shadow-lg'
                : 'bg-midnight-100 dark:bg-midnight-800 text-midnight-700 dark:text-midnight-300 hover:bg-midnight-200 dark:hover:bg-midnight-700'
            )}
          >
            {option.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Calendar Views */}
      <motion.div
        key={calendarView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {calendarView === 'month' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MonthlyCalendar
                tasks={allTasks}
                onDateClick={handleDateClick}
                selectedDate={selectedDate}
              />
            </div>
            <div className="lg:col-span-1">
              <Card variant="glass" className="p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                {selectedDateTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-midnight-600 dark:text-midnight-400 text-sm">
                      No tasks for this date
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectedDateTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        className="p-3 rounded-lg bg-midnight-100 dark:bg-midnight-800/50 hover:bg-midnight-200 dark:hover:bg-midnight-700/50 transition-colors duration-200 cursor-pointer"
                        whileHover={{ x: 4 }}
                        onClick={() => handleOpenForm(task)}
                      >
                        <p className={cn(
                          'font-medium text-sm',
                          task.completed
                            ? 'line-through text-midnight-500 dark:text-midnight-500'
                            : 'text-midnight-900 dark:text-midnight-50'
                        )}>
                          {task.title}
                        </p>
                        {task.time && (
                          <p className="text-xs text-midnight-600 dark:text-midnight-400 mt-1">
                            {task.time}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </Card>
            </div>
          </div>
        )}

        {calendarView === 'week' && (
          <WeeklyCalendar
            tasks={allTasks}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        )}

        {calendarView === 'day' && (
          <DailyCalendar
            tasks={allTasks}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
          />
        )}
      </motion.div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingTask={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(undefined);
        }}
        taskTitle={taskToDelete?.title}
        isLoading={isDeleting}
      />
    </motion.div>
  );
};

export default Calendar;
