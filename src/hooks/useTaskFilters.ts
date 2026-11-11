import { useMemo, useState, useCallback } from 'react';
import { Task, Priority } from '../types';

interface UseTaskFiltersProps {
  tasks: Task[];
}

export const useTaskFilters = ({ tasks }: UseTaskFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created' | 'completed'>('deadline');

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks;

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery) ||
          task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Priority filter
    if (priority !== 'all') {
      result = result.filter((task) => task.priority === priority);
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter((task) => task.category === category);
    }

    // Status filter
    if (status === 'pending') {
      result = result.filter((task) => !task.completed);
    } else if (status === 'completed') {
      result = result.filter((task) => task.completed);
    }

    // Sorting (copy so we never mutate the store array)
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (a.deadline && b.deadline) {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          } else if (a.deadline) {
            return -1;
          } else if (b.deadline) {
            return 1;
          }
          return 0;

        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        case 'completed':
          if (a.completedAt && b.completedAt) {
            return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
          } else if (a.completedAt) {
            return -1;
          } else if (b.completedAt) {
            return 1;
          }
          return 0;

        default:
          return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, priority, category, status, sortBy]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setPriority('all');
    setCategory('all');
    setStatus('all');
    setSortBy('deadline');
  }, []);

  return {
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
  };
};
