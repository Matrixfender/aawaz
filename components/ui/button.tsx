import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm':
              variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 shadow-sm':
              variant === 'secondary',
            'hover:bg-muted text-muted-foreground hover:text-foreground':
              variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm':
              variant === 'destructive',
            'border border-border bg-background hover:bg-muted text-foreground shadow-sm':
              variant === 'outline',
          },
          {
            'h-8 px-3 text-xs gap-1.5': size === 'sm',
            'h-9 px-4 text-sm gap-2': size === 'md',
            'h-11 px-6 text-base gap-2.5': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
