import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from '../notifications';
import { Moon, Sun, Settings, Menu } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  onOpenTaskForm?: () => void;
  onToggleMobileSidebar?: () => void;
  onNavigate?: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, onNavigate }) => {
  const { theme, setTheme, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-midnight-200 dark:border-midnight-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-midnight-500 hover:text-midnight-900 dark:hover:text-midnight-100 hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-2xl font-bold gradient-text">AnaNthA</h1>
          <p className="text-xs text-midnight-500 dark:text-midnight-400 ml-2">
            Plan. Progress. Become Infinite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell
            unreadCount={unreadCount}
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onRemove={removeNotification}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
            onNavigate={onNavigate}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            icon={isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          >
            {isDark ? 'Light' : 'Dark'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.('settings')}
            icon={<Settings className="w-4 h-4" />}
          >
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
