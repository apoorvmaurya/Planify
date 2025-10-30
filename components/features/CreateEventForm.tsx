'use client';

/**
 * Create Event Form Component
 * Allows users to create new events within a group
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEvent } from '@/actions/events';

const eventSchema = z.object({
  groupId: z.string().min(1, 'Please select a group'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  activityType: z.string().optional(),
  mood: z.string().optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().min(15).max(1440).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
  groups: Array<{ id: string; name: string }>;
}

export function CreateEventForm({ groups }: CreateEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      durationMinutes: 120,
    },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createEvent({
        group_id: data.groupId,
        title: data.title,
        activity_type: data.activityType || null,
        mood: data.mood || null,
        scheduled_at: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
        duration_minutes: data.durationMinutes || 120,
      });

      // Redirect to the new event page
      router.push(`/dashboard/event/${result.id}`);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
      setIsSubmitting(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You need to be part of a group to create events.</p>
        <a
          href="/dashboard/create-group"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create a Group
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Group Selection */}
      <div>
        <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-2">
          Select Group *
        </label>
        <select
          id="groupId"
          {...register('groupId')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a group...</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {errors.groupId && (
          <p className="mt-1 text-sm text-red-600">{errors.groupId.message}</p>
        )}
      </div>

      {/* Event Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Event Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          placeholder="e.g., Dinner at Luigi's"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Activity Type */}
      <div>
        <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-2">
          Activity Type
        </label>
        <select
          id="activityType"
          {...register('activityType')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select activity type...</option>
          <option value="dining">Dining</option>
          <option value="entertainment">Entertainment</option>
          <option value="outdoor">Outdoor Activity</option>
          <option value="cultural">Cultural</option>
          <option value="sports">Sports</option>
          <option value="shopping">Shopping</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Mood */}
      <div>
        <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
          Mood / Vibe
        </label>
        <select
          id="mood"
          {...register('mood')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select mood...</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
          <option value="energetic">Energetic</option>
          <option value="relaxed">Relaxed</option>
          <option value="adventurous">Adventurous</option>
          <option value="romantic">Romantic</option>
        </select>
      </div>

      {/* Scheduled Date/Time */}
      <div>
        <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-2">
          Scheduled Date & Time
        </label>
        <input
          type="datetime-local"
          id="scheduledAt"
          {...register('scheduledAt')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Leave empty if you haven't decided yet
        </p>
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          id="durationMinutes"
          {...register('durationMinutes', { valueAsNumber: true })}
          min="15"
          max="1440"
          step="15"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.durationMinutes && (
          <p className="mt-1 text-sm text-red-600">{errors.durationMinutes.message}</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
        <a
          href="/dashboard"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

