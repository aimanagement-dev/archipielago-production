import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCalendarClient } from '@/lib/google/calendar';
import { isUserAdmin } from '@/lib/constants';

/**
 * Endpoint para obtener la lista de calendarios disponibles
 * Retorna los calendarios del proyecto: ARCH-Producción y Archipielago AI Management
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = session.user?.email || '';
  const isAdmin = isUserAdmin(userEmail);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const calendar = getCalendarClient(session.accessToken);

    // Obtener lista de calendarios
    const calendarList = await calendar.calendarList.list({
      minAccessRole: 'writer', // Solo calendarios donde el usuario puede escribir
    });

    const calendars = calendarList.data.items || [];
    
    // Filtrar solo los calendarios del proyecto
    const projectCalendars = calendars
      .filter(c => {
        const summary = c.summary?.toLowerCase() || '';
        return (
          summary.includes('archipielago') ||
          summary.includes('arch-producción') ||
          summary.includes('arch produccion') ||
          summary.includes('ai management') ||
          c.id === 'ai.management@archipielagofilm.com'
        );
      })
      .map(c => ({
        id: c.id,
        summary: c.summary || 'Sin nombre',
        backgroundColor: c.backgroundColor || '#4285f4',
        foregroundColor: c.foregroundColor || '#ffffff',
        selected: c.selected,
        accessRole: c.accessRole,
      }));

    // Ordenar: ARCH-Producción primero, luego AI Management
    const sortedCalendars = projectCalendars.sort((a, b) => {
      const aSummary = a.summary.toLowerCase();
      const bSummary = b.summary.toLowerCase();
      
      if (aSummary.includes('producción') || aSummary.includes('produccion')) return -1;
      if (bSummary.includes('producción') || bSummary.includes('produccion')) return 1;
      if (aSummary.includes('ai management')) return 1;
      if (bSummary.includes('ai management')) return -1;
      return 0;
    });

    return NextResponse.json({ calendars: sortedCalendars });
  } catch (error) {
    console.error('[GET /api/calendars/list] Error:', error);
    return NextResponse.json({
      error: 'Failed to list calendars',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
