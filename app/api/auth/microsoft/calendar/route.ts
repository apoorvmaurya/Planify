import { NextRequest, NextResponse } from 'next/server';
import { PublicClientApplication } from '@azure/msal-node';

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
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const authCodeUrlParameters = {
    scopes: ["calendars.read"],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
    state: userId,
  };

  try {
    const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Microsoft auth URL generation error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}

