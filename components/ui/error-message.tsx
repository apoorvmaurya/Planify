import * as React from 'react';
import { clsx } from 'clsx';

export interface ErrorMessageProps {
  message?: string;
  title?: string;
  className?: string;
  variant?: 'inline' | 'card';
}

export function ErrorMessage({ 
  message, 
  title = 'Error', 
  className,
  variant = 'inline' 
}: ErrorMessageProps) {
  if (!message) return null;

  if (variant === 'card') {
    return (
      <div
        className={clsx(
          'rounded-2xl bg-red-50/90 backdrop-blur-sm border-2 border-red-200 p-6 animate-fade-up',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-1">{title}</h3>
            <p className="text-sm text-red-700 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 animate-fade-in error-shake',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-5 h-5 text-red-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
    </div>
  );
}

