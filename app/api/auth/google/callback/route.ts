import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains the userId

  if (!code || !state) {
    return NextResponse.json({ error: 'Invalid request: code or state missing' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token) {
      throw new Error('Failed to retrieve access token from Google.');
    }

    const supabase = createClient();
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

    const { error } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: state,
        provider: 'google',
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        expires_at: expiry_date ? new Date(expiry_date).toISOString() : null,
      }, { onConflict: 'user_id, provider' });

    if (error) throw error;

    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

