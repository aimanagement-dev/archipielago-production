import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';

/**
 * Endpoint para verificar si un usuario tiene acceso (accessGranted = true)
 * Usa las credenciales del admin para verificar, no requiere que el usuario tenga acceso al DB
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Usar las credenciales del admin para buscar el DB y verificar el acceso del usuario
    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();

    // Obtener el equipo completo
    const team = await service.getTeam(spreadsheetId);
    const member = team.find((m: any) => m.email?.toLowerCase() === userEmail.toLowerCase());

    if (member && member.accessGranted) {
      return NextResponse.json({ 
        hasAccess: true,
        member: {
          email: member.email,
          name: member.name,
          accessGranted: member.accessGranted
        }
      });
    } else {
      return NextResponse.json({ 
        hasAccess: false,
        reason: member ? 'accessGranted is false' : 'user not found in team'
      });
    }
  } catch (error) {
    console.error('[POST /api/auth/check-access] Error:', error);
    return NextResponse.json({
      error: 'Failed to check access',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
