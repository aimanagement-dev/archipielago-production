import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';

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

    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();

    // Compartir el DB con el usuario
    const shared = await service.shareDatabaseWithUser(spreadsheetId, userEmail, 'reader');

    if (shared) {
      return NextResponse.json({ 
        success: true, 
        message: `Archipielago_DB compartido con ${userEmail}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo compartir el DB. Verifica los permisos.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[POST /api/team/share-db] Error:', error);
    return NextResponse.json({
      error: 'Failed to share database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
