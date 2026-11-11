import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only"
            {...props}
          />
          <motion.div
            className={cn(
              'w-5 h-5 rounded-lg border-2 border-midnight-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 transition-all duration-200 cursor-pointer',
              props.checked && 'border-lavender-600 bg-gradient-to-r from-lavender-600 to-midnight-700'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {props.checked && (
              <Check className="w-3.5 h-3.5 text-white absolute inset-1" />
            )}
          </motion.div>
        </div>
        {label && (
          <label className="ml-3 text-sm text-midnight-900 dark:text-midnight-100 cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
