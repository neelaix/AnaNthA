import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getShortcutDescription } from '../../utils/a11y';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  showLabel?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label = 'New Task',
  showLabel = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const shortcutKey = typeof window !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl';

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onClick();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClick]);

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-40"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Tooltip */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={isHovered ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-midnight-900 dark:bg-midnight-950 rounded-lg whitespace-nowrap text-white text-sm font-medium pointer-events-none"
        >
          <p>{label}</p>
          <p className="text-xs text-midnight-400 mt-0.5">{shortcutKey} + N</p>
        </motion.div>
      )}

      {/* Button */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-lavender-600 to-midnight-700 text-white shadow-lg hover:shadow-2xl shadow-lavender-500/50 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-500 group"
        title={`${label} (${shortcutKey} + N)`}
        aria-label={`${label} (${shortcutKey} + N)`}
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </motion.button>

      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-lavender-600 opacity-0"
        animate={isHovered ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{ pointerEvents: 'none' }}
      />
    </motion.div>
  );
};

export default FloatingActionButton;
