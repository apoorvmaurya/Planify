import { NextRequest, NextResponse } from 'next/server';
import { PublicClientApplication } from '@azure/msal-node';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: "https://login.microsoftonline.com/common",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  }
};
const pca = new PublicClientApplication(msalConfig);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains the userId

  if (!code || !state) {
    return NextResponse.json({ error: 'Invalid request: code or state missing' }, { status: 400 });
  }

  const tokenRequest = {
    code,
    scopes: ["calendars.read"],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
  };

  try {
    const response = await pca.acquireTokenByCode(tokenRequest);
    const { accessToken, refreshToken, expiresOn } = response;

    if (!accessToken) {
      throw new Error('Failed to retrieve access token from Microsoft.');
    }

    const supabase = createClient();
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

    const { error } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: state,
        provider: 'microsoft',
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        expires_at: expiresOn ? expiresOn.toISOString() : null,
      }, { onConflict: 'user_id, provider' });

    if (error) throw error;

    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

