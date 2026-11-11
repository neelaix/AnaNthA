import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  subLabel,
  color = '#9d88ff',
}) => {
  const normalizedPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-midnight-200 dark:text-midnight-800"
          />
        </svg>

        {/* Progress circle */}
        <motion.svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="drop-shadow-lg"
          />
        </motion.svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-midnight-900 dark:text-midnight-50">
            {normalizedPercentage}%
          </span>
          {label && (
            <span className="text-xs text-midnight-600 dark:text-midnight-400 mt-1">
              {label}
            </span>
          )}
        </div>
      </div>

      {subLabel && (
        <p className="mt-4 text-sm text-midnight-600 dark:text-midnight-400">{subLabel}</p>
      )}
    </div>
  );
};

export default ProgressRing;
