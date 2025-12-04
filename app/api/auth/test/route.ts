import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';

/**
 * Endpoint de prueba para verificar la configuración de OAuth
 * Útil para diagnosticar problemas de autenticación
 */
export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return NextResponse.json({
      status: 'ok',
      config: {
        hasClientId: !!clientId,
        clientIdPrefix: clientId ? clientId.substring(0, 30) + '...' : 'NO_CONFIGURADO',
        hasClientSecret,
        hasNextAuthSecret,
        nextAuthUrl,
        redirectUri: `${nextAuthUrl}/api/auth/callback/google`,
        signInUrl: `${nextAuthUrl}/api/auth/signin/google`,
      },
      authOptions: {
        hasProviders: authOptions.providers.length > 0,
        providerType: authOptions.providers[0]?.id || 'none',
        hasCustomPages: !!authOptions.pages?.signIn,
        customSignInPage: authOptions.pages?.signIn || 'default',
      },
      checks: {
        allEnvVarsPresent: !!(clientId && hasClientSecret && hasNextAuthSecret),
        redirectUriFormat: `${nextAuthUrl}/api/auth/callback/google`,
      },
      recommendations: [
        !clientId && 'GOOGLE_CLIENT_ID no está configurado',
        !hasClientSecret && 'GOOGLE_CLIENT_SECRET no está configurado',
        !hasNextAuthSecret && 'NEXTAUTH_SECRET no está configurado',
        clientId && !clientId.includes('.apps.googleusercontent.com') && 'Client ID no tiene el formato correcto',
      ].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

