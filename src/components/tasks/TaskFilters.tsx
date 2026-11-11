import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Priority } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useTasks } from '../../hooks/useTasks';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priority: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  category: string;
  onCategoryChange: (category: string) => void;
  status: 'all' | 'pending' | 'completed';
  onStatusChange: (status: 'all' | 'pending' | 'completed') => void;
  sortBy: 'deadline' | 'priority' | 'created' | 'completed';
  onSortChange: (sort: 'deadline' | 'priority' | 'created' | 'completed') => void;
  onClearFilters: () => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  onSearchChange,
  priority,
  onPriorityChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sortBy,
  onSortChange,
  onClearFilters,
}) => {
  const { getCategories } = useTasks();
  const categories = getCategories();

  const hasActiveFilters =
    searchQuery !== '' ||
    priority !== 'all' ||
    category !== 'all' ||
    status !== 'all' ||
    sortBy !== 'deadline';

  return (
    <motion.div
      className="bg-white dark:bg-midnight-900 rounded-2xl shadow-glass border border-midnight-200 dark:border-midnight-800 p-6 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search tasks by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
          options={[
            { value: 'all', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />

        <Select
          label="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={[
            { value: 'all', label: 'All Categories' },
            ...categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            })),
          ]}
        />

        <Select
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as 'all' | 'pending' | 'completed')}
          options={[
            { value: 'all', label: 'All Tasks' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ]}
        />

        <Select
          label="Sort By"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'deadline' | 'priority' | 'created' | 'completed')}
          options={[
            { value: 'deadline', label: 'Deadline' },
            { value: 'priority', label: 'Priority' },
            { value: 'created', label: 'Created' },
            { value: 'completed', label: 'Completed' },
          ]}
        />

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              fullWidth
              icon={<X className="w-4 h-4" />}
              onClick={onClearFilters}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          className="text-sm text-midnight-600 dark:text-midnight-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>
            {searchQuery && `📝 Search: "${searchQuery}"`}
            {priority !== 'all' && ` • 🎯 Priority: ${priority}`}
            {category !== 'all' && ` • 📂 Category: ${categories.find((c) => c.id === category)?.name}`}
            {status !== 'all' && ` • ✓ Status: ${status}`}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TaskFilters;
