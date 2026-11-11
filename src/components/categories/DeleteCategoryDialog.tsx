import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  categoryName?: string;
  taskCount?: number;
  isLoading?: boolean;
}

const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  categoryName = 'this category',
  taskCount = 0,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Delete Category"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-midnight-50 mb-2">
            Are you sure you want to delete <strong>"{categoryName}"</strong>?
          </p>
          {taskCount > 0 && (
            <p className="text-sm text-midnight-400 mb-3">
              This category has <strong>{taskCount}</strong> {taskCount === 1 ? 'task' : 'tasks'}. 
              All tasks will be moved to "Personal".
            </p>
          )}
          <p className="text-sm text-midnight-400">
            This action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteCategoryDialog;
