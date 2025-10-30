'use client';

import { useState } from 'react';
import { submitFeedback } from '@/actions/feedback';

export function EventFeedback({ eventId }: { eventId: string }) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating > 0 && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await submitFeedback(eventId, rating, []);
        setSubmitted(true);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        alert('Failed to submit feedback. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-800">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h4 className="text-lg font-semibold mb-3">How was it?</h4>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl transition-all ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:scale-110`}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          rating > 0 && !isSubmitting
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
      {rating > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {rating === 5 && "Outstanding! 🌟"}
          {rating === 4 && "Great experience! 😊"}
          {rating === 3 && "It was okay 👌"}
          {rating === 2 && "Could be better 😕"}
          {rating === 1 && "Not great 😞"}
        </p>
      )}
    </div>
  );
}

