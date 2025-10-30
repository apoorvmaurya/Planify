import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, home_location')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist, create it
      if (!profile) {
        await supabase.from('user_profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          },
        ]);
        
        // Redirect to profile completion
        return NextResponse.redirect(`${origin}/profile/complete`);
      }

      // If profile exists but no home location, redirect to profile completion
      if (!profile.home_location) {
        return NextResponse.redirect(`${origin}/profile/complete`);
      }

      // Profile is complete, redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If no code or something went wrong, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}

