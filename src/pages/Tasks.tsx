import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useTaskStore } from '../store/taskStore';
import { useUIStore } from '../store/uiStore';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { Task } from '../types';
import Button from '../components/ui/Button';
import TaskForm from '../components/tasks/TaskForm';
import TaskList from '../components/tasks/TaskList';
import TaskFilters from '../components/tasks/TaskFilters';
import DeleteConfirmDialog from '../components/tasks/DeleteConfirmDialog';

interface TasksProps {
  filter?: 'important' | 'completed';
  categoryId?: string;
}

const Tasks: React.FC<TasksProps> = ({ filter, categoryId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const { getTasks, getCategories, deleteTask, completeTask } = useTasks();
  const rawTasks = getTasks();
  const pendingTaskId = useUIStore((state) => state.pendingTaskId);
  const consumePendingTask = useUIStore((state) => state.consumePendingTask);

  useEffect(() => {
    if (!pendingTaskId) return;
    const task = useTaskStore.getState().tasks.find((t) => t.id === pendingTaskId);
    consumePendingTask();
    if (task) {
      setEditingTask(task);
      setIsFormOpen(true);
    }
  }, [pendingTaskId, consumePendingTask]);
  const activeCategory = categoryId
    ? getCategories().find((c) => c.id === categoryId)
    : undefined;

  // Apply sidebar filter before passing to useTaskFilters
  const allTasks = filter === 'important'
    ? rawTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent')
    : filter === 'completed'
    ? rawTasks.filter((t) => t.completed)
    : categoryId
    ? rawTasks.filter((t) => t.category === categoryId)
    : rawTasks;

  const pageTitle = activeCategory
    ? activeCategory.name
    : filter === 'important'
    ? 'Important'
    : filter === 'completed'
    ? 'Completed'
    : 'All Tasks';

  const pageSubtitle = activeCategory
    ? `Tasks in the ${activeCategory.name} category`
    : filter === 'important'
    ? 'High-priority tasks that need your attention'
    : filter === 'completed'
    ? 'Tasks you have already finished'
    : 'Manage your tasks and stay productive';

  const {
    searchQuery,
    setSearchQuery,
    priority,
    setPriority,
    category,
    setCategory,
    status,
    setStatus,
    sortBy,
    setSortBy,
    filteredAndSortedTasks,
    clearFilters,
  } = useTaskFilters({ tasks: allTasks });

  const handleOpenForm = (task?: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const handleDeleteClick = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setDeleteConfirmOpen(true);
    }
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
      className="p-6 md:p-8 max-w-6xl mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-midnight-900 dark:text-midnight-50 mb-2">
            {pageTitle}
          </h1>
          <p className="text-midnight-600 dark:text-midnight-400">
            {pageSubtitle}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenForm()}
        >
          New Task
        </Button>
      </motion.div>

      {/* Task Stats */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white dark:bg-midnight-900 rounded-lg p-4 border border-midnight-200 dark:border-midnight-800">
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-midnight-900 dark:text-midnight-50">
            {allTasks.length}
          </p>
        </div>
        <div className="bg-white dark:bg-midnight-900 rounded-lg p-4 border border-midnight-200 dark:border-midnight-800">
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {allTasks.filter((t) => !t.completed).length}
          </p>
        </div>
        <div className="bg-white dark:bg-midnight-900 rounded-lg p-4 border border-midnight-200 dark:border-midnight-800">
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {allTasks.filter((t) => t.completed).length}
          </p>
        </div>
        <div className="bg-white dark:bg-midnight-900 rounded-lg p-4 border border-midnight-200 dark:border-midnight-800">
          <p className="text-xs text-midnight-600 dark:text-midnight-400 mb-1">Completion</p>
          <p className="text-2xl font-bold text-lavender-600">
            {allTasks.length > 0
              ? Math.round((allTasks.filter((t) => t.completed).length / allTasks.length) * 100)
              : 0}
            %
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <TaskFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priority={priority}
        onPriorityChange={setPriority}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
      />

      {/* Filtered Task List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <TaskList
          tasks={filteredAndSortedTasks}
          onEdit={handleOpenForm}
          onDelete={handleDeleteClick}
          onComplete={handleCompleteTask}
          groupByStatus={false}
          emptyMessage={searchQuery || priority !== 'all' || category !== 'all' || status !== 'all'
            ? 'No tasks match your filters. Try adjusting your search criteria.'
            : 'No tasks yet. Create your first task to get started!'}
        />
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

export default Tasks;
