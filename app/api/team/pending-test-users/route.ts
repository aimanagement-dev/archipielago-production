import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';

/**
 * Endpoint para obtener lista de usuarios que necesitan ser agregados como Test Users
 * Solo usuarios con accessGranted = true pero que aún no pueden acceder
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();

    // Obtener todos los miembros del equipo con accessGranted = true
    const team = await service.getTeam(spreadsheetId);
    const usersWithAccess = team
      .filter((m: any) => m.accessGranted === true && m.email)
      .map((m: any) => ({
        email: m.email,
        name: m.name,
      }));

    return NextResponse.json({ 
      pendingTestUsers: usersWithAccess,
      instructions: {
        title: 'Cómo agregar usuarios como Test Users',
        steps: [
          'Ve a https://console.cloud.google.com/',
          'APIs & Services > OAuth consent screen',
          'Sección "Test users" > "+ ADD USERS"',
          'Agrega los emails listados arriba',
          'Guarda los cambios',
        ],
        note: 'Sin esto, los usuarios serán bloqueados por Google al intentar hacer login.',
      },
    });
  } catch (error) {
    console.error('[GET /api/team/pending-test-users] Error:', error);
    return NextResponse.json({
      error: 'Failed to get pending test users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
