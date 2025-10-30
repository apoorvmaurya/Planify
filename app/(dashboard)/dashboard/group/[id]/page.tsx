import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function GroupPage({ 
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

  // Fetch group details
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (groupError || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h1>
          <p className="text-gray-600 mb-4">This group doesn't exist or you don't have access.</p>
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

  // Check if user is a member
  const { data: membership } = await supabase
    .from('users_groups')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not a member of this group.</p>
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

  // Fetch group members
  const { data: members } = await supabase
    .from('users_groups')
    .select(`
      user_id,
      joined_at,
      user_profiles (
        id,
        email,
        full_name
      )
    `)
    .eq('group_id', id)
    .order('joined_at', { ascending: true });

  const isOwner = group.owner_id === user.id;
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${group.invite_token}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-gray-600">{group.description}</p>
              )}
            </div>
            {isOwner && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Owner
              </span>
            )}
          </div>

          {/* Invite Link Section */}
          {isOwner && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Invite Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert('Invite link copied!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Link expires on {new Date(group.invite_expires_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Members ({members?.length || 0})
            </h2>
          </div>

          {members && members.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {members.map((member: any) => {
                const profile = member.user_profiles;
                const isMemberOwner = member.user_id === group.owner_id;
                
                return (
                  <div
                    key={member.user_id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {profile.full_name || profile.email}
                        {member.user_id === user.id && (
                          <span className="ml-2 text-sm text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{profile.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isMemberOwner && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No members yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

