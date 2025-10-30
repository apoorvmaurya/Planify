import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's groups
  const { data: userGroups } = await supabase
    .from('users_groups')
    .select(`
      group_id,
      joined_at,
      groups (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-black text-slate-900 mb-3">
                Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'there'}</span>
              </h1>
              <p className="text-xl text-slate-600">Ready to plan your next adventure?</p>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 shadow-glass">
                <p className="text-sm text-slate-600 mb-1">Your Groups</p>
                <p className="text-3xl font-black gradient-text">{userGroups?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/dashboard/create-group" className="group">
              <Card variant="glass" className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2 group-hover:gradient-text transition-all">
                        Create New Group
                      </CardTitle>
                      <CardDescription className="text-base">
                        Start a new group and invite friends to plan together
                      </CardDescription>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/dashboard/create-event" className="group">
              <Card variant="glass" className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2 group-hover:gradient-text transition-all">
                        Create New Event
                      </CardTitle>
                      <CardDescription className="text-base">
                        Plan a new event with AI-powered recommendations
                      </CardDescription>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Groups List */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-slate-900">Your Groups</h2>
            {userGroups && userGroups.length > 0 && (
              <Link href="/dashboard/create-group">
                <Button variant="glass" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Group
                </Button>
              </Link>
            )}
          </div>

          {userGroups && userGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGroups.map((ug: any) => {
                const group = ug.groups;
                return (
                  <Link key={group.id} href={`/dashboard/group/${group.id}`} className="group">
                    <Card variant="glass">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl mb-2 truncate group-hover:gradient-text transition-all">
                              {group.name}
                            </CardTitle>
                            {group.description && (
                              <CardDescription className="line-clamp-2 text-sm mb-3">
                                {group.description}
                              </CardDescription>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">
                                Joined {new Date(ug.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card variant="glass">
              <CardHeader className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-50">
                  <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl mb-3">No groups yet</CardTitle>
                <CardDescription className="text-base mb-6 max-w-md mx-auto">
                  Create your first group or join one using an invite link to start planning amazing events together.
                </CardDescription>
                <Link href="/dashboard/create-group">
                  <Button variant="premium" size="lg">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Group
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="mt-12 text-center">
          <form action="/api/auth/signout" method="post">
            <Button variant="ghost" type="submit" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
