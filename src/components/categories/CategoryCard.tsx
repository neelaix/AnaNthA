import React from 'react';
import { motion } from 'framer-motion';
import { Category } from '../../types';
import { Edit2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

interface CategoryCardProps {
  category: Category;
  taskCount?: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  taskCount = 0,
  onEdit,
  onDelete,
  isSelected,
  onClick,
}) => {
  const isDefault = !category.isCustom;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer',
        isSelected
          ? 'border-lavender-600 bg-lavender-500/10 dark:bg-lavender-900/20'
          : 'border-midnight-200 dark:border-midnight-800 hover:border-lavender-500/50 dark:hover:border-lavender-600/50 bg-white dark:bg-midnight-900'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg"
            style={{ backgroundColor: category.color }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-midnight-900 dark:text-midnight-50 truncate">
              {category.name}
            </h3>
            {isDefault && (
              <p className="text-xs text-midnight-500 dark:text-midnight-500">Default</p>
            )}
          </div>
        </div>

        {!isDefault && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-midnight-600 dark:text-midnight-400" />
            </motion.button>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category.id);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Task Count */}
      <div className="pt-3 border-t border-midnight-200 dark:border-midnight-800">
        <p className="text-sm text-midnight-600 dark:text-midnight-400">
          <span className="font-semibold text-midnight-900 dark:text-midnight-50">
            {taskCount}
          </span>{' '}
          {taskCount === 1 ? 'task' : 'tasks'}
        </p>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
