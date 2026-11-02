import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'orange' | 'green';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors select-none',
        {
          'bg-primary/10 text-primary border border-primary/20': variant === 'orange' || variant === 'default',
          'bg-secondary text-secondary-foreground border border-border/50': variant === 'secondary',
          'border border-border text-foreground': variant === 'outline',
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': variant === 'green',
        },
        className
      )}
      {...props}
    />
  );
}
