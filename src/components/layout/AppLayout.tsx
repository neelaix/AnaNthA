import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import FloatingActionButton from '../tasks/FloatingActionButton';
import TaskForm from '../tasks/TaskForm';
import NotificationSync from '../notifications/NotificationSync';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useReminderSync } from '../../hooks/useReminderSync';
import { convexEnabled } from '../../lib/convex';
import { NotificationManager } from '../../utils/notifications';

const Dashboard  = lazy(() => import('../../pages/Dashboard'));
const Tasks      = lazy(() => import('../../pages/Tasks'));
const Calendar   = lazy(() => import('../../pages/Calendar'));
const Analytics  = lazy(() => import('../../pages/Analytics'));
const FocusMode  = lazy(() => import('../../pages/FocusMode'));
const Categories = lazy(() => import('../../pages/Categories'));
const Settings   = lazy(() => import('../../pages/Settings'));
const NotificationSettings = lazy(() => import('../../pages/NotificationSettings'));

interface AppLayoutProps {
  children?: React.ReactNode;
}

const PageFallback = () => (
  <div className="flex items-center justify-center flex-1 h-full">
    <div className="w-8 h-8 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const renderPage = (page: string): React.ReactNode => {
  if (page.startsWith('category:')) {
    return <Tasks categoryId={page.slice('category:'.length)} />;
  }

  switch (page) {
    case 'upcoming':
      return <Calendar />;
    case 'important':
      return <Tasks filter="important" />;
    case 'all':
      return <Tasks />;
    case 'completed':
      return <Tasks filter="completed" />;
    case 'analytics':
      return <Analytics />;
    case 'focus':
      return <FocusMode />;
    case 'categories':
      return <Categories />;
    case 'settings':
      return <Settings />;
    case 'notifications-settings':
      return <NotificationSettings />;
    case 'today':
    default:
      return <Dashboard />;
  }
};

const AppLayout: React.FC<AppLayoutProps> = () => {
  const [currentPage, setCurrentPage] = useState('today');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const openTask = useUIStore((state) => state.openTask);

  useReminderSync();

  useEffect(() => {
    void useWorkspaceStore.getState().ensure();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('task');
    const page = params.get('page');
    if (taskId) {
      openTask(taskId);
      setCurrentPage('all');
    } else if (page) {
      setCurrentPage(page);
    }
    if (taskId || page) {
      const url = new URL(window.location.href);
      url.searchParams.delete('task');
      url.searchParams.delete('page');
      url.searchParams.delete('notification');
      window.history.replaceState({}, '', url.toString());
    }
  }, [openTask]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_TASK' && event.data.taskId) {
        openTask(event.data.taskId);
        setCurrentPage('all');
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [openTask]);

  useEffect(() => {
    if (sessionStorage.getItem('anantha-due-checked')) return;
    useTaskStore
      .getState()
      .tasks.filter((task) => !task.completed && task.deadline)
      .forEach((task) => NotificationManager.notifyTaskDue(task));
    sessionStorage.setItem('anantha-due-checked', '1');
  }, []);

  const handleOpenTaskForm = () => setIsTaskFormOpen(true);
  const handleCloseTaskForm = () => setIsTaskFormOpen(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setIsMobileSidebarOpen(false); // close mobile sidebar on navigation
  };

  const activePage = renderPage(currentPage);

  return (
    <div className="flex flex-col min-h-screen bg-midnight-50 dark:bg-midnight-950">
      {convexEnabled && <NotificationSync />}
      <Header
        onOpenTaskForm={handleOpenTaskForm}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((v) => !v)}
        onNavigate={handleNavigate}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar — always visible on md+, slide-in on mobile */}
        <div
          className={[
            'fixed inset-y-0 left-0 z-30 md:static md:z-auto md:flex',
            isMobileSidebarOpen ? 'flex' : 'hidden md:flex',
            // Push sidebar below header on mobile
            'flex-col pt-[73px] md:pt-0',
          ].join(' ')}
        >
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onNewTask={handleOpenTaskForm}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageFallback />}>
            {activePage}
          </Suspense>
        </main>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleOpenTaskForm} />

      {/* Task Form Modal */}
      <TaskForm isOpen={isTaskFormOpen} onClose={handleCloseTaskForm} />
    </div>
  );
};

export default AppLayout;
