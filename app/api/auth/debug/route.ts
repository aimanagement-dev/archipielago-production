import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const nextauthUrl = process.env.NEXTAUTH_URL || '';
  const nextauthSecret = process.env.NEXTAUTH_SECRET || '';

  return NextResponse.json({
    config: {
      GOOGLE_CLIENT_ID: {
        exists: !!clientId,
        length: clientId.length,
        prefix: clientId.substring(0, 20) + '...',
        endsWithApps: clientId.endsWith('.apps.googleusercontent.com'),
      },
      GOOGLE_CLIENT_SECRET: {
        exists: !!clientSecret,
        length: clientSecret.length,
        prefix: clientSecret.substring(0, 5) + '...',
      },
      NEXTAUTH_URL: {
        exists: !!nextauthUrl,
        value: nextauthUrl, // Safe to show the URL
      },
      NEXTAUTH_SECRET: {
        exists: !!nextauthSecret,
        length: nextauthSecret.length,
      },
    },
    expectedCallbackUrl: `${nextauthUrl}/api/auth/callback/google`,
    timestamp: new Date().toISOString(),
  });
}
