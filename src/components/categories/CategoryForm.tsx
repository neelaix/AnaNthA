import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Category } from '../../types';
import { Button, Input } from '../ui';
import Modal from '../ui/Modal';
import { useTasks } from '../../hooks/useTasks';
import { Palette } from 'lucide-react';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category;
}

const COLORS = [
  '#9d88ff', // lavender
  '#7d5fff', // purple
  '#4c6ef5', // blue
  '#15aabf', // cyan
  '#51cf66', // green
  '#ffd43b', // yellow
  '#ff922b', // orange
  '#ff6b6b', // red
  '#ee5a6f', // pink
  '#a78bfa', // light purple
];

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  editingCategory,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addCategory, updateCategory } = useTasks();

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setColor(editingCategory.color);
    } else {
      setName('');
      setColor(COLORS[0]);
    }
    setErrors({});
  }, [editingCategory, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        updateCategory(editingCategory.id, {
          name: name.trim(),
          color,
        });
      } else {
        addCategory({
          name: name.trim(),
          color,
          isCustom: true,
        });
      }

      setName('');
      setColor(COLORS[0]);
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ submit: 'Failed to save category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : 'Create New Category'}
      description={editingCategory ? 'Update category details' : 'Add a new category'}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {editingCategory ? 'Update' : 'Create'} Category
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <Input
          label="Category Name"
          placeholder="e.g., Work, Personal, Study"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={50}
        />

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-midnight-700 dark:text-midnight-300 mb-3">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <motion.button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full aspect-square rounded-lg transition-all duration-200 ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-midnight-900 ring-lavender-400 shadow-lg' : ''
                }`}
                style={{ backgroundColor: c }}
                title={`Color ${COLORS.indexOf(c) + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-midnight-800/50 border border-midnight-700">
          <p className="text-xs text-midnight-400 mb-2">Preview:</p>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-midnight-50 font-medium">{name || 'Category Name'}</span>
          </div>
        </div>

        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm"
          >
            {errors.submit}
          </motion.div>
        )}
      </form>
    </Modal>
  );
};

export default CategoryForm;
