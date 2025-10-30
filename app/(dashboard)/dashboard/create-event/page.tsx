import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreateEventForm } from '@/components/features/CreateEventForm';

export default async function CreateEventPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's groups for the dropdown
  const { data: userGroups } = await supabase
    .from('users_groups')
    .select(`
      group_id,
      groups (
        id,
        name
      )
    `)
    .eq('user_id', user.id);

  const groups = userGroups?.map((ug: any) => ug.groups) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600 mb-6">
            Plan a new event for your group and get AI-powered suggestions!
          </p>

          <CreateEventForm groups={groups} />
        </div>
      </div>
    </div>
  );
}

