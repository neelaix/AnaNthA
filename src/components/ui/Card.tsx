import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'dark';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = true, className, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl overflow-hidden transition-all duration-300';

    const variantStyles = {
      default: 'bg-white dark:bg-midnight-900 border border-midnight-200 dark:border-midnight-800 shadow-glass',
      glass: 'backdrop-blur-md bg-white/70 dark:bg-midnight-900/70 border border-white/20 dark:border-midnight-700/50 shadow-glass',
      dark: 'backdrop-blur-md bg-midnight-900/80 border border-midnight-700/50 shadow-glass',
    };

    const hoverStyles = hover ? 'hover:shadow-glass-lg hover:-translate-y-1' : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
