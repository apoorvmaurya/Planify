'use client';

import { useState } from 'react';
import { submitRsvp } from '@/actions/events';

type RsvpStatus = 'yes' | 'no' | 'maybe';

interface RsvpProps {
  eventId: string;
  userRsvp?: RsvpStatus;
  attendeeCounts?: {
    yes: number;
    no: number;
    maybe: number;
  };
}

export function RSVP({ eventId, userRsvp, attendeeCounts }: RsvpProps) {
  const [selectedStatus, setSelectedStatus] = useState<RsvpStatus | undefined>(userRsvp);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRsvp = async (status: RsvpStatus) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitRsvp(eventId, status);
      setSelectedStatus(status);
    } catch (error) {
      console.error('Failed to submit RSVP:', error);
      alert('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const options: { status: RsvpStatus; label: string; icon: string; color: string; bgColor: string; hoverColor: string }[] = [
    {
      status: 'yes',
      label: 'Going',
      icon: '✓',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      hoverColor: 'hover:bg-green-200',
    },
    {
      status: 'maybe',
      label: 'Maybe',
      icon: '?',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      hoverColor: 'hover:bg-yellow-200',
    },
    {
      status: 'no',
      label: 'Can\'t Go',
      icon: '✗',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      hoverColor: 'hover:bg-red-200',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your RSVP
        </h3>
        <p className="text-sm text-gray-600">
          Let everyone know if you can make it
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = selectedStatus === option.status;
          const count = attendeeCounts?.[option.status] || 0;

          return (
            <button
              key={option.status}
              onClick={() => handleRsvp(option.status)}
              disabled={isSubmitting}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? `${option.bgColor} border-current ${option.color}`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${!isSelected && `${option.hoverColor}`}
              `}
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2 text-xl font-bold
                  ${isSelected ? `${option.bgColor} ${option.color}` : 'bg-gray-100 text-gray-600'}
                `}
              >
                {option.icon}
              </div>
              
              <span
                className={`
                  font-medium text-sm
                  ${isSelected ? option.color : 'text-gray-700'}
                `}
              >
                {option.label}
              </span>

              {count > 0 && (
                <span
                  className={`
                    mt-1 text-xs
                    ${isSelected ? option.color : 'text-gray-500'}
                  `}
                >
                  {count} {count === 1 ? 'person' : 'people'}
                </span>
              )}

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className={`w-5 h-5 ${option.color}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedStatus && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {selectedStatus === 'yes' && 'Great! We\'ll see you there.'}
              {selectedStatus === 'maybe' && 'No worries, let us know when you decide!'}
              {selectedStatus === 'no' && 'Sorry you can\'t make it. Maybe next time!'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}



