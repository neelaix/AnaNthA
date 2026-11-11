import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', size = 'md', icon, className, children, ...props }, ref) => {
    const variantStyles = {
      primary: 'badge-primary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    };

    const sizeStyles = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
    };

    return (
      <span
        ref={ref}
        className={cn('badge inline-flex items-center gap-1.5 whitespace-nowrap', variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
