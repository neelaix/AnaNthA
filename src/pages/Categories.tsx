import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { Category } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CategoryForm from '../components/categories/CategoryForm';
import CategoryCard from '../components/categories/CategoryCard';
import DeleteCategoryDialog from '../components/categories/DeleteCategoryDialog';

const Categories: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const { getCategories, getTasks, deleteCategory } = useTasks();
  const categories = getCategories();
  const tasks = getTasks();

  const getCategoryTaskCount = (categoryId: string): number => {
    return tasks.filter((t) => t.category === categoryId).length;
  };

  const handleOpenForm = (category?: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  const handleDeleteClick = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.isCustom) {
      return; // Can't delete default categories
    }
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      setIsDeleting(true);
      try {
        deleteCategory(categoryToDelete.id);
        setDeleteConfirmOpen(false);
        setCategoryToDelete(undefined);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const defaultCategories = categories.filter((c) => !c.isCustom);
  const customCategories = categories.filter((c) => c.isCustom);

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
            Categories
          </h1>
          <p className="text-midnight-600 dark:text-midnight-400">
            Organize your tasks by category
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenForm()}
        >
          New Category
        </Button>
      </motion.div>

      {/* Default Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-xl font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
          Default Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {defaultCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              taskCount={getCategoryTaskCount(category.id)}
              onEdit={handleOpenForm}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </motion.div>

      {/* Custom Categories */}
      {customCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
            Your Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                taskCount={getCategoryTaskCount(category.id)}
                onEdit={handleOpenForm}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {customCategories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card variant="glass" className="p-12 text-center">
            <p className="text-midnight-600 dark:text-midnight-400 mb-6">
              No custom categories yet. Create one to organize your tasks better!
            </p>
            <Button
              variant="primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => handleOpenForm()}
            >
              Create Your First Category
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingCategory={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCategoryDialog
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setCategoryToDelete(undefined);
        }}
        categoryName={categoryToDelete?.name}
        taskCount={categoryToDelete ? getCategoryTaskCount(categoryToDelete.id) : 0}
        isLoading={isDeleting}
      />
    </motion.div>
  );
};

export default Categories;
