import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { generateId } from '../../utils/a11y';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = useMemo(() => id || generateId('input'), [id]);
    const errorId = useMemo(() => `${inputId}-error`, [inputId]);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-midnight-700 dark:text-midnight-300 mb-2">
            {label}
            {props.required && <span className="text-red-600 dark:text-red-400 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-midnight-500 dark:text-midnight-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-field',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
