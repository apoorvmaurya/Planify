import * as React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  label 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <div
          className={clsx(
            'animate-spin rounded-full border-4 border-slate-200',
            sizeClasses[size]
          )}
        />
        <div
          className={clsx(
            'absolute top-0 left-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600',
            sizeClasses[size]
          )}
        />
      </div>
      {label && (
        <p className="text-sm font-medium text-slate-600 animate-pulse">{label}</p>
      )}
    </div>
  );
}

