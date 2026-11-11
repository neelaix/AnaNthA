import { Task, Category } from '../types';
import { formatDateTime } from './dateHelpers';

export const exportToJSON = (tasks: Task[], categories: Category[]): string => {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    tasks: tasks.map((task) => ({
      ...task,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : undefined,
      createdAt: new Date(task.createdAt).toISOString(),
      updatedAt: new Date(task.updatedAt).toISOString(),
      completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
    })),
    categories,
  };
  return JSON.stringify(data, null, 2);
};

export const exportToCSV = (tasks: Task[]): string => {
  const headers = ['Title', 'Description', 'Priority', 'Category', 'Tags', 'Deadline', 'Completed', 'Completed At'];
  const rows = tasks.map((task) => [
    `"${task.title.replace(/"/g, '""')}"`,
    `"${(task.description || '').replace(/"/g, '""')}"`,
    task.priority,
    task.category,
    `"${task.tags.join(', ')}"`,
    task.deadline ? formatDateTime(task.deadline, 'yyyy-MM-dd HH:mm') : '',
    task.completed ? 'Yes' : 'No',
    task.completedAt ? formatDateTime(task.completedAt, 'yyyy-MM-dd HH:mm') : '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const exportToICS = (tasks: Task[]): string => {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AnaNthA//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:AnaNthA Tasks
X-WR-TIMEZONE:UTC
`;

  tasks.forEach((task) => {
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const dtstart = formatICSDate(deadline);
      const dtstamp = formatICSDate(new Date());
      const uid = `${task.id}@anantha.local`;

      ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
SUMMARY:${task.title.replace(/"/g, '\\"')}
DESCRIPTION:${(task.description || '').replace(/"/g, '\\"')}
STATUS:${task.completed ? 'COMPLETED' : 'NEEDS-ACTION'}
PRIORITY:${getPriorityNumber(task.priority)}
END:VEVENT
`;
    }
  });

  ics += 'END:VCALENDAR';
  return ics;
};

const formatICSDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const getPriorityNumber = (priority: string): number => {
  switch (priority) {
    case 'urgent':
      return 1;
    case 'high':
      return 3;
    case 'medium':
      return 5;
    case 'low':
      return 9;
    default:
      return 5;
  }
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (jsonString: string): { tasks: Task[]; categories: Category[] } => {
  try {
    const data = JSON.parse(jsonString);
    return {
      tasks: (data.tasks || []).map((task: any) => ({
        ...task,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      })),
      categories: data.categories || [],
    };
  } catch (error) {
    throw new Error('Invalid JSON file');
  }
};
