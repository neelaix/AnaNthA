import { format, isToday, isTomorrow, isThisWeek, isThisMonth, isPast, isFuture } from 'date-fns';

export const formatDate = (date: Date | string, formatStr = 'MMM d, yyyy'): string => {
  return format(new Date(date), formatStr);
};

export const formatTime = (date: Date | string, formatStr = 'HH:mm'): string => {
  return format(new Date(date), formatStr);
};

export const formatDateTime = (date: Date | string, formatStr = 'MMM d, yyyy HH:mm'): string => {
  return format(new Date(date), formatStr);
};

export const getDateLabel = (date: Date | string): string => {
  const dateObj = new Date(date);
  if (isToday(dateObj)) return 'Today';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  if (isThisWeek(dateObj)) return format(dateObj, 'EEEE');
  if (isThisMonth(dateObj)) return format(dateObj, 'MMM d');
  return format(dateObj, 'MMM d, yyyy');
};

export const isOverdue = (deadline: Date | string): boolean => {
  return isPast(new Date(deadline)) && !isToday(new Date(deadline));
};

export const isDueToday = (deadline: Date | string): boolean => {
  return isToday(new Date(deadline));
};

export const isDueTomorrow = (deadline: Date | string): boolean => {
  return isTomorrow(new Date(deadline));
};

export const isDueSoon = (deadline: Date | string): boolean => {
  const date = new Date(deadline);
  return (date.getTime() - new Date().getTime()) <= 24 * 60 * 60 * 1000 && isFuture(date);
};

export const getTimeRemaining = (deadline: Date | string): string => {
  const now = new Date();
  const deadline_date = new Date(deadline);
  const diff = deadline_date.getTime() - now.getTime();

  if (diff < 0) return 'Overdue';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  if (minutes > 0) return `${minutes}m remaining`;
  return 'Due soon';
};

export const getStartOfDay = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const getEndOfDay = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = getStartOfDay(new Date(date1));
  const d2 = getStartOfDay(new Date(date2));
  return d1.getTime() === d2.getTime();
};
