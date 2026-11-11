import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Task, Priority, RecurrenceRule } from '../../types';
import { Button, Input, Textarea, Select, Checkbox } from '../ui';
import Modal from '../ui/Modal';
import RecurrenceSelector from './RecurrenceSelector';
import { useTasks } from '../../hooks/useTasks';
import { useSettings } from '../../hooks/useSettings';
import { NotificationManager } from '../../utils/notifications';

const pad = (value: number) => String(value).padStart(2, '0');

const toDateInputValue = (value?: Date | string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseLocalDeadline = (dateValue: string, timeValue: string): Date | undefined => {
  if (!dateValue) return undefined;
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue ? timeValue.split(':').map(Number) : [0, 0];
  return new Date(year, month - 1, day, hours || 0, minutes || 0);
};

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: Task;
}

const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, editingTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('personal');
  const [tags, setTags] = useState('');
  const [deadline, setDeadline] = useState('');
  const [time, setTime] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>();
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [enableReminder, setEnableReminder] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addTask, updateTask, getCategories } = useTasks();
  const { defaultPriority, defaultCategory } = useSettings();
  const categories = getCategories();

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setTags(editingTask.tags.join(', '));
      setDeadline(toDateInputValue(editingTask.deadline));
      setTime(editingTask.time || '');
      setRecurrence(editingTask.recurrence);
      setEnableReminder(Boolean(editingTask.reminderTime));
      setReminderMinutes(editingTask.reminderCustomMinutes ?? 30);
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setPriority(defaultPriority);
      setCategory(defaultCategory);
      setTags('');
      setDeadline('');
      setTime('');
      setRecurrence(undefined);
      setEnableReminder(false);
      setReminderMinutes(30);
    }
    setErrors({});
  }, [editingTask, isOpen, defaultPriority, defaultCategory]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (title.trim().length < 3) {
      newErrors.title = 'Task title must be at least 3 characters';
    }

    if (title.trim().length > 100) {
      newErrors.title = 'Task title must be less than 100 characters';
    }

    if (deadline && time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      newErrors.time = 'Invalid time format (HH:mm)';
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
      const parsedDeadline = parseLocalDeadline(deadline, time);
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        deadline: parsedDeadline,
        time: time || undefined,
        recurrence: recurrence,
        reminderTime: enableReminder ? ('custom' as const) : undefined,
        reminderCustomMinutes: enableReminder ? reminderMinutes : undefined,
      };

      if (editingTask) {
        updateTask(editingTask.id, taskData);
      } else {
        addTask({
          ...taskData,
          completed: false,
        } as any);
      }

      if (parsedDeadline) {
        if (enableReminder) {
          NotificationManager.setDeadlineReminder(
            {
              ...taskData,
              id: editingTask?.id ?? 'new-task',
              completed: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Task,
            reminderMinutes
          );
        } else if (editingTask) {
          NotificationManager.clearReminder(editingTask.id);
        }
      }

      // Reset and close
      setTitle('');
      setDescription('');
      setPriority(defaultPriority);
      setCategory(defaultCategory);
      setTags('');
      setDeadline('');
      setTime('');
      setRecurrence(undefined);
      setEnableReminder(false);
      setReminderMinutes(30);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: 'Failed to save task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Edit Task' : 'Create New Task'}
      description={editingTask ? 'Update task details' : 'Add a new task to your list'}
      size="lg"
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
            {editingTask ? 'Update' : 'Create'} Task
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Task Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          maxLength={100}
        />

        {/* Description */}
        <Textarea
          label="Description (Optional)"
          placeholder="Add more details about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        {/* Priority and Category Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
          />
        </div>

        {/* Deadline and Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Deadline (Optional)"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <Input
            label="Time (Optional)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            error={errors.time}
          />
        </div>

        {/* Recurrence */}
        <RecurrenceSelector
          value={recurrence}
          onChange={setRecurrence}
        />

        {/* Reminder Settings */}
        {deadline && (
          <div className="p-4 rounded-lg bg-lavender-50 dark:bg-midnight-800/50 border border-lavender-200 dark:border-midnight-700 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-reminder"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="w-4 h-4 rounded border-midnight-300 dark:border-midnight-600 text-lavender-600 focus:ring-lavender-500"
              />
              <label htmlFor="enable-reminder" className="text-sm font-medium text-midnight-900 dark:text-midnight-50">
                Set Reminder
              </label>
            </div>

            {enableReminder && (
              <div className="flex items-center gap-2 ml-6">
                <label htmlFor="reminder-time" className="text-xs text-midnight-600 dark:text-midnight-400">
                  Remind me
                </label>
                <Input
                  id="reminder-time"
                  type="number"
                  min="1"
                  max="1440"
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Math.max(1, parseInt(e.target.value) || 30))}
                  className="w-20 text-sm"
                />
                <span className="text-xs text-midnight-600 dark:text-midnight-400">
                  minutes before
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <Input
          label="Tags (Optional)"
          placeholder="e.g., work, important, urgent (separated by commas)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

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

export default TaskForm;
