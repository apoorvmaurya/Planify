'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const profileSchema = z.object({
  homeLocation: z.string().min(3, 'Home location is required'),
  workLocation: z.string().optional(),
  defaultTravelMode: z.enum(['driving', 'transit', 'walking', 'bicycling'], {
    required_error: 'Please select a travel mode',
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileCompletePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      defaultTravelMode: 'driving',
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there');
      } else {
        // If no user is logged in, redirect to login
        router.push('/login');
      }
    };

    fetchUser();
  }, [supabase, router]);

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      return { lat: data.latitude, lng: data.longitude };
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to complete your profile');
        return;
      }

      // Geocode home location
      const homeCoords = await geocodeAddress(data.homeLocation);
      if (!homeCoords) {
        setError('Could not find your home location. Please try a different address.');
        return;
      }

      // Geocode work location if provided
      let workCoords = null;
      if (data.workLocation && data.workLocation.trim() !== '') {
        workCoords = await geocodeAddress(data.workLocation);
        if (!workCoords) {
          setError('Could not find your work location. Please try a different address.');
          return;
        }
      }

      // Update user profile with location data
      const updateData: any = {
        home_location: `POINT(${homeCoords.lng} ${homeCoords.lat})`,
        default_travel_mode: data.defaultTravelMode,
      };

      if (workCoords) {
        updateData.work_location = `POINT(${workCoords.lng} ${workCoords.lat})`;
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Planora, {userName}!
            </h1>
            <p className="text-gray-600">
              Let's set up your profile so we can help you plan better
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="homeLocation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Home Location <span className="text-red-500">*</span>
              </label>
              <input
                id="homeLocation"
                type="text"
                {...register('homeLocation')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="123 Main St, City, State"
                disabled={isLoading}
              />
              {errors.homeLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.homeLocation.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                We'll use this to suggest places near you
              </p>
            </div>

            <div>
              <label
                htmlFor="workLocation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Work Location <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="workLocation"
                type="text"
                {...register('workLocation')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="456 Office Blvd, City, State"
                disabled={isLoading}
              />
              {errors.workLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.workLocation.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Help us find convenient meeting spots
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Default Travel Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    {...register('defaultTravelMode')}
                    value="driving"
                    className="mr-3"
                    disabled={isLoading}
                  />
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                      />
                    </svg>
                    <span className="font-medium">Driving</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    {...register('defaultTravelMode')}
                    value="transit"
                    className="mr-3"
                    disabled={isLoading}
                  />
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    <span className="font-medium">Transit</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    {...register('defaultTravelMode')}
                    value="walking"
                    className="mr-3"
                    disabled={isLoading}
                  />
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">Walking</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    {...register('defaultTravelMode')}
                    value="bicycling"
                    className="mr-3"
                    disabled={isLoading}
                  />
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                      />
                    </svg>
                    <span className="font-medium">Bicycling</span>
                  </div>
                </label>
              </div>
              {errors.defaultTravelMode && (
                <p className="mt-2 text-sm text-red-600">{errors.defaultTravelMode.message}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You can update these settings anytime in your profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

