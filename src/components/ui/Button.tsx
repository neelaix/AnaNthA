import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    className,
    children,
    disabled,
    ariaLabel,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lavender-500';

    const variantStyles = {
      primary: 'bg-gradient-to-r from-lavender-600 to-midnight-700 text-white hover:shadow-lg hover:shadow-lavender-500/50 active:scale-95',
      secondary: 'bg-midnight-100 dark:bg-midnight-800 text-midnight-900 dark:text-midnight-50 hover:bg-midnight-200 dark:hover:bg-midnight-700 active:scale-95',
      ghost: 'text-midnight-700 dark:text-midnight-300 hover:bg-midnight-100 dark:hover:bg-midnight-800 active:scale-95',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/50 active:scale-95',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const widthStyles = fullWidth ? 'w-full' : '';
    const isIconOnly = icon && !children;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={ariaLabel || (isIconOnly ? 'Button' : undefined)}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyles,
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />}
        {icon && iconPosition === 'left' && !isLoading && (
          <span aria-hidden="true" className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && !isLoading && (
          <span aria-hidden="true" className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
