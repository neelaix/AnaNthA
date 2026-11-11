import { RecurrenceRule, Task } from '../types';
import { addDays, addWeeks, addMonths, addYears, getDate, getMonth, getDayOfYear } from 'date-fns';

/**
 * Advanced recurrence engine for generating task instances
 * Supports daily, weekly, monthly, yearly, and custom patterns
 */

interface RecurrenceContext {
  rule: RecurrenceRule;
  originalDate: Date;
  startDate: Date;
  endDate: Date;
}

export const generateRecurrenceInstances = (
  task: Task,
  startDate: Date,
  endDate: Date
): Task[] => {
  if (!task.recurrence || !task.deadline) return [task];

  const instances: Task[] = [];
  const rule = task.recurrence;
  const originalDate = new Date(task.deadline);

  // Start from the original task date if it's before startDate
  let currentDate = new Date(originalDate);
  if (currentDate < startDate) {
    currentDate = getNextOccurrence(currentDate, rule, startDate);
  }

  let occurrenceCount = 0;

  while (currentDate <= endDate) {
    // Check end date constraint
    if (rule.endDate && currentDate > rule.endDate) break;

    // Check max occurrences constraint
    if (rule.maxOccurrences && occurrenceCount >= rule.maxOccurrences) break;

    // Check if current date matches recurrence pattern
    if (matchesRecurrencePattern(currentDate, rule, originalDate)) {
      const instance: Task = {
        ...task,
        id: `${task.id}-${currentDate.getTime()}`,
        deadline: new Date(currentDate),
        completed: false,
        completedAt: undefined, // Clear completed info for new instances
      };
      instances.push(instance);
      occurrenceCount++;
    }

    // Move to next potential date
    currentDate = getNextRecurrenceDate(currentDate, rule);
  }

  return instances;
};

/**
 * Determines if a date matches the recurrence pattern
 */
const matchesRecurrencePattern = (
  date: Date,
  rule: RecurrenceRule,
  originalDate: Date
): boolean => {
  // Calculate days since original date
  const daysSinceOriginal = Math.floor(
    (date.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check interval constraint
  const interval = rule.interval || 1;
  if (daysSinceOriginal % (interval * getIntervalDays(rule.frequency)) !== 0) {
    return false;
  }

  switch (rule.frequency) {
    case 'daily':
      return true;

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        return rule.daysOfWeek.includes(date.getDay());
      }
      return date.getDay() === originalDate.getDay();

    case 'monthly':
      // Match same day of month
      return getDate(date) === getDate(originalDate);

    case 'yearly':
      // Match same day and month
      return (
        getDate(date) === getDate(originalDate) &&
        getMonth(date) === getMonth(originalDate)
      );

    case 'custom':
      // Custom patterns can be handled by external rules
      return true;

    default:
      return false;
  }
};

/**
 * Gets the number of days in an interval unit
 */
const getIntervalDays = (frequency: string): number => {
  switch (frequency) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30; // Approximate
    case 'yearly':
      return 365; // Approximate
    default:
      return 1;
  }
};

/**
 * Calculates the next recurrence date
 */
const getNextRecurrenceDate = (date: Date, rule: RecurrenceRule): Date => {
  const interval = rule.interval || 1;
  let nextDate = new Date(date);

  switch (rule.frequency) {
    case 'daily':
      nextDate = addDays(nextDate, interval);
      break;

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Find the next matching day of the week
        let daysToAdd = 1;
        const maxDaysToCheck = 7 * interval;

        while (daysToAdd < maxDaysToCheck) {
          const checkDate = addDays(date, daysToAdd);
          if (rule.daysOfWeek.includes(checkDate.getDay())) {
            return checkDate;
          }
          daysToAdd++;
        }

        // If no matching day found in this interval, advance by full interval
        nextDate = addWeeks(date, interval);
      } else {
        nextDate = addWeeks(nextDate, interval);
      }
      break;

    case 'monthly':
      nextDate = addMonths(nextDate, interval);
      break;

    case 'yearly':
      nextDate = addYears(nextDate, interval);
      break;

    case 'custom':
      // Default to daily increment for custom patterns
      nextDate = addDays(nextDate, interval);
      break;
  }

  return nextDate;
};

/**
 * Finds the next occurrence of a recurring task after a given date
 */
export const getNextOccurrence = (
  originalDate: Date,
  rule: RecurrenceRule,
  afterDate: Date
): Date => {
  let currentDate = new Date(originalDate);

  // If original date is already after the target, move forward
  if (currentDate < afterDate) {
    currentDate = new Date(afterDate);

    // Adjust to match the recurrence pattern
    if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      while (!rule.daysOfWeek.includes(currentDate.getDay())) {
        currentDate = addDays(currentDate, 1);
      }
    }
  }

  return currentDate;
};

/**
 * Generates upcoming recurrences of a task
 */
export const getUpcomingRecurrences = (
  task: Task,
  count: number = 5
): Task[] => {
  if (!task.recurrence) return [];

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setFullYear(futureDate.getFullYear() + 1); // Look ahead 1 year

  const instances = generateRecurrenceInstances(task, now, futureDate);
  return instances.slice(0, count);
};

/**
 * Gets tasks that repeat on a specific date (useful for displaying recurring tasks)
 */
export const getRecurringTasksOnDate = (
  task: Task,
  targetDate: Date
): boolean => {
  if (!task.recurrence || !task.deadline) return false;

  const rule = task.recurrence;
  const originalDate = new Date(task.deadline);

  // Check if target date is before original date
  if (targetDate < originalDate) return false;

  // Check end date constraint
  if (rule.endDate && targetDate > rule.endDate) return false;

  // Check pattern match
  return matchesRecurrencePattern(targetDate, rule, originalDate);
};

/**
 * Calculates the next recurrence date for display purposes
 */
export const getNextRecurrenceDisplay = (task: Task): Date | null => {
  if (!task.recurrence || !task.deadline) return null;

  const now = new Date();
  const rule = task.recurrence;
  const originalDate = new Date(task.deadline);

  // If original date is in the future, return it
  if (originalDate > now) return originalDate;

  // Find next occurrence
  let currentDate = new Date(originalDate);

  for (let i = 0; i < 365 * 10; i++) {
    currentDate = getNextRecurrenceDate(currentDate, rule);

    if (currentDate > now) {
      if (rule.endDate && currentDate > rule.endDate) return null;
      if (rule.maxOccurrences && i >= rule.maxOccurrences) return null;
      return currentDate;
    }

    // Safety check
    if (i > 10000) return null;
  }

  return null;
};
