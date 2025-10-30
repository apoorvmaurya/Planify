import * as React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glass' | 'premium';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group';
    
    const variantStyles = {
      default: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl focus-visible:ring-blue-500/50 active:scale-[0.98]',
      destructive: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl focus-visible:ring-red-500/50 active:scale-[0.98]',
      outline: 'border-2 border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-blue-500 hover:text-blue-700 focus-visible:ring-blue-500/50 active:scale-[0.98]',
      secondary: 'bg-slate-100/80 backdrop-blur-sm text-slate-900 hover:bg-slate-200/90 focus-visible:ring-slate-500/50 active:scale-[0.98]',
      ghost: 'hover:bg-white/50 backdrop-blur-sm hover:text-slate-900 focus-visible:ring-slate-500/50',
      link: 'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500/50 hover:text-blue-700',
      glass: 'bg-white/70 backdrop-blur-md text-slate-900 border border-white/20 shadow-glass hover:bg-white/90 hover:shadow-glass-lg focus-visible:ring-blue-500/50 active:scale-[0.98]',
      premium: 'bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02] focus-visible:ring-purple-500/50 active:scale-[0.98]',
    };

    const sizeStyles = {
      default: 'h-11 px-6 py-2.5 text-sm',
      sm: 'h-9 px-4 py-2 text-sm rounded-lg',
      lg: 'h-14 px-8 py-3.5 text-base rounded-2xl',
      icon: 'h-11 w-11',
    };

    return (
      <button
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

