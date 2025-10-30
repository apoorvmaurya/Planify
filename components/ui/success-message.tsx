import * as React from 'react';
import { clsx } from 'clsx';

export interface SuccessMessageProps {
  message?: string;
  title?: string;
  className?: string;
  variant?: 'inline' | 'card';
}

export function SuccessMessage({ 
  message, 
  title = 'Success', 
  className,
  variant = 'inline' 
}: SuccessMessageProps) {
  if (!message) return null;

  if (variant === 'card') {
    return (
      <div
        className={clsx(
          'rounded-2xl bg-green-50/90 backdrop-blur-sm border-2 border-green-200 p-6 animate-fade-up',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center success-pulse">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-1">{title}</h3>
            <p className="text-sm text-green-700 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl bg-green-50/80 backdrop-blur-sm border border-green-200 p-4 animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-5 h-5 text-green-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p className="text-sm font-medium text-green-700">{message}</p>
      </div>
    </div>
  );
}

