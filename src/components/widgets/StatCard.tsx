import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color = 'lavender',
  subtext,
}) => {
  const colorMap = {
    lavender: 'text-lavender-600 dark:text-lavender-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <Card variant="glass" className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400 mb-2">
              {label}
            </p>
            <p className="text-3xl font-bold text-midnight-900 dark:text-midnight-50">
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-midnight-500 dark:text-midnight-500 mt-2">
                {subtext}
              </p>
            )}
          </div>
          <motion.div
            className={`text-5xl opacity-70 ${colorMap[color as keyof typeof colorMap]}`}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {icon}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
