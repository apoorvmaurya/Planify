import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PlanPalChat } from '@/components/features/PlanPalChat';

export default async function EventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch event details with group info
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      groups (
        id,
        name,
        owner_id
      )
    `)
    .eq('id', id)
    .single();

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
          <p className="text-gray-600 mb-4">This event doesn't exist or you don't have access.</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check if user is a member of the group
  const { data: membership } = await supabase
    .from('users_groups')
    .select('*')
    .eq('group_id', event.group_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not a member of this event's group.</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Fetch RSVPs
  const { data: rsvps } = await supabase
    .from('rsvps')
    .select(`
      status,
      user_profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('event_id', id);

  // Fetch polls for this event
  const { data: polls } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (
        id,
        details,
        poll_results (
          total_votes,
          emoji_counts
        )
      )
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <a
            href={`/dashboard/group/${event.group_id}`}
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
            Back to {event.groups?.name || 'Group'}
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {event.scheduled_at && (
                  <div>
                    <span className="font-semibold text-gray-700">Date & Time:</span>
                    <p className="text-gray-600">
                      {new Date(event.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {event.activity_type && (
                  <div>
                    <span className="font-semibold text-gray-700">Activity:</span>
                    <p className="text-gray-600">{event.activity_type}</p>
                  </div>
                )}
                
                {event.mood && (
                  <div>
                    <span className="font-semibold text-gray-700">Mood:</span>
                    <p className="text-gray-600">{event.mood}</p>
                  </div>
                )}
                
                {event.duration_minutes && (
                  <div>
                    <span className="font-semibold text-gray-700">Duration:</span>
                    <p className="text-gray-600">{event.duration_minutes} minutes</p>
                  </div>
                )}
              </div>

              {event.final_place_details && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    📍 Finalized Location
                  </h3>
                  <p className="text-green-800">{event.final_place_details.name}</p>
                  {event.final_place_details.address && (
                    <p className="text-sm text-green-700">{event.final_place_details.address}</p>
                  )}
                </div>
              )}
            </div>

            {/* RSVPs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">RSVPs</h2>
              
              {rsvps && rsvps.length > 0 ? (
                <div className="space-y-3">
                  {['yes', 'maybe', 'no'].map((status) => {
                    const statusRsvps = rsvps.filter((r) => r.status === status);
                    if (statusRsvps.length === 0) return null;

                    return (
                      <div key={status}>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                          {status === 'yes' ? '✅ Going' : status === 'maybe' ? '❓ Maybe' : '❌ Not Going'}
                          {' '}({statusRsvps.length})
                        </h3>
                        <div className="pl-4 space-y-1">
                          {statusRsvps.map((rsvp: any, idx: number) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {rsvp.user_profiles?.full_name || rsvp.user_profiles?.email}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No RSVPs yet</p>
              )}
            </div>

            {/* Polls */}
            {polls && polls.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Polls</h2>
                <div className="space-y-4">
                  {polls.map((poll: any) => (
                    <div key={poll.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {poll.type} Poll
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          poll.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {poll.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {poll.poll_options?.map((option: any) => (
                          <div key={option.id} className="p-3 bg-gray-50 rounded">
                            <p className="font-medium text-gray-900">
                              {option.details?.name || 'Option'}
                            </p>
                            {option.details?.address && (
                              <p className="text-xs text-gray-600">{option.details.address}</p>
                            )}
                            <p className="text-sm text-gray-700 mt-1">
                              Votes: {option.poll_results?.[0]?.total_votes || 0}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - PlanPal Chat */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8" style={{ height: 'calc(100vh - 4rem)' }}>
              <PlanPalChat eventId={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

