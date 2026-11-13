import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <p className="font-medium text-midnight-900 dark:text-midnight-50">{label}</p>
          )}
          {description && (
            <p className="text-sm text-midnight-600 dark:text-midnight-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed',
          checked
            ? 'bg-gradient-to-r from-lavender-500 to-midnight-600 shadow-glow'
            : 'bg-midnight-200 dark:bg-midnight-700',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full bg-white shadow-md',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  );
};

export default Toggle;
