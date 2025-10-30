import * as React from 'react';
import { clsx } from 'clsx';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={clsx(
          'flex h-12 w-full rounded-xl border-2 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium',
          'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-semibold',
          'placeholder:text-slate-400 placeholder:font-normal',
          'transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:bg-white',
          'hover:border-slate-400 hover:bg-white/90',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          error
            ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20 error-shake'
            : 'border-slate-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

