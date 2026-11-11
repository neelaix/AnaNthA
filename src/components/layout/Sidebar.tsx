import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import {
  Inbox,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  ChevronLeft,
  Plus,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react';
import Button from '../ui/Button';
import { useTaskStore } from '../../store/taskStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  color?: string;
  href: string;
}

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onNewTask?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage = 'today', onNavigate, onNewTask }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const categories = useTaskStore((state) => state.categories);
  const taskCategories = categories.filter(
    (cat) => cat.isCustom || ['work', 'personal', 'study', 'health'].includes(cat.id)
  );

  const mainNav: NavItem[] = [
    { id: 'today', label: 'My Day', icon: <Inbox className="w-5 h-5" />, href: '/today' },
    { id: 'upcoming', label: 'Upcoming', icon: <Calendar className="w-5 h-5" />, href: '/upcoming' },
    { id: 'important', label: 'Important', icon: <Star className="w-5 h-5" />, href: '/important' },
    { id: 'all', label: 'All Tasks', icon: <CheckCircle2 className="w-5 h-5" />, href: '/tasks' },
    { id: 'completed', label: 'Completed', icon: <Clock className="w-5 h-5" />, href: '/completed' },
  ];

  const analyticsNav: NavItem[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/analytics' },
    { id: 'focus', label: 'Focus Mode', icon: <Zap className="w-5 h-5" />, href: '/focus' },
  ];

  const NavLink = ({ item, isActive }: { item: NavItem; isActive?: boolean }) => (
    <motion.button
      onClick={() => onNavigate?.(item.id)}
      whileHover={{ x: 4 }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left',
        isActive
          ? 'bg-gradient-to-r from-lavender-600/20 to-midnight-700/20 text-lavender-600 dark:text-lavender-400 font-semibold'
          : 'text-midnight-600 dark:text-midnight-400 hover:text-midnight-900 dark:hover:text-midnight-200 hover:bg-midnight-100 dark:hover:bg-midnight-800'
      )}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {isExpanded && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-lavender-500/20 text-lavender-600 dark:text-lavender-400">
              {item.badge}
            </span>
          )}
        </>
      )}
    </motion.button>
  );

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'glass-dark border-r border-midnight-800 flex flex-col transition-all duration-300',
        isExpanded ? 'w-64' : 'w-20'
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-midnight-700/50 flex items-center justify-between">
        {isExpanded && (
          <h2 className="font-semibold text-midnight-50">Menu</h2>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-midnight-400 hover:text-midnight-200 transition-colors"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', !isExpanded && 'rotate-180')} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Quick Add Button */}
        <Button
          variant="primary"
          size="md"
          fullWidth={isExpanded}
          icon={<Plus className="w-4 h-4" />}
          onClick={onNewTask}
          className={cn(!isExpanded && 'w-12 h-12 p-0')}
        >
          {isExpanded && 'New Task'}
        </Button>

        <div className="pt-4 space-y-1">
          {mainNav.map((item) => (
            <NavLink key={item.id} item={item} isActive={currentPage === item.id} />
          ))}
        </div>

        {/* Categories Section */}
        {isExpanded && (
          <div className="pt-6 mt-6 border-t border-midnight-700/50">
            <h3 className="text-xs font-semibold text-midnight-400 uppercase px-4 mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {taskCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => onNavigate?.(`category:${cat.id}`)}
                  whileHover={{ x: 4 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200',
                    currentPage === `category:${cat.id}`
                      ? 'bg-lavender-600/20 text-lavender-600 dark:text-lavender-400 font-semibold'
                      : 'text-midnight-400 hover:text-midnight-200 hover:bg-midnight-700/50'
                  )}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate text-sm">{cat.name}</span>
                </motion.button>
              ))}
              <motion.button
                onClick={() => onNavigate?.('categories')}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-midnight-400 hover:text-midnight-200 hover:bg-midnight-700/50 transition-all duration-200 text-sm"
              >
                <span className="pl-1">Manage categories</span>
              </motion.button>
            </div>
          </div>
        )}
      </nav>

      {/* Analytics & Settings */}
      <nav className="p-4 space-y-1 border-t border-midnight-700/50">
        {analyticsNav.map((item) => (
          <NavLink key={item.id} item={item} isActive={currentPage === item.id} />
        ))}
        <motion.button
          onClick={() => onNavigate?.('settings')}
          whileHover={{ x: 4 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-midnight-600 dark:text-midnight-400 hover:text-midnight-900 dark:hover:text-midnight-200 hover:bg-midnight-100 dark:hover:bg-midnight-800 transition-all duration-200"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span>Settings</span>}
        </motion.button>
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
