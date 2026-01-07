import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { getCalendarClient } from '@/lib/google/calendar';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { response } = await req.json();
    const taskId = params.id;
    const userEmail = session.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    if (!['accepted', 'declined', 'tentative'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response. Must be accepted, declined, or tentative' }, { status: 400 });
    }

    // Obtener la tarea actual
    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();
    const tasks = await service.getTasks(spreadsheetId);
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Actualizar respuestas de attendees
    const currentResponses = task.attendeeResponses || [];
    const updatedResponses = currentResponses.filter(r => r.email.toLowerCase() !== userEmail.toLowerCase());
    updatedResponses.push({ email: userEmail, response: response as 'accepted' | 'declined' | 'tentative' });

    // Guardar en Sheets
    const updatedTask = {
      ...task,
      attendeeResponses: updatedResponses,
    };
    await service.updateTask(spreadsheetId, updatedTask);

    // Actualizar respuesta en Google Calendar si la tarea tiene evento
    if (task.scheduledDate && task.meetLink) {
      try {
        const calendar = getCalendarClient(session.accessToken);
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'ai.management@archipielagofilm.com';
        const eventId = taskId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        
        // Obtener evento actual
        const event = await calendar.events.get({
          calendarId,
          eventId,
        });

        if (event.data.attendees) {
          // Actualizar respuesta del attendee
          const updatedAttendees = event.data.attendees.map((attendee: any) => {
            if (attendee.email?.toLowerCase() === userEmail.toLowerCase()) {
              return {
                ...attendee,
                responseStatus: response === 'accepted' ? 'accepted' :
                               response === 'declined' ? 'declined' :
                               'tentative',
              };
            }
            return attendee;
          });

          // Si el usuario no está en attendees, agregarlo
          const userInAttendees = updatedAttendees.some((a: any) => a.email?.toLowerCase() === userEmail.toLowerCase());
          if (!userInAttendees) {
            updatedAttendees.push({
              email: userEmail,
              responseStatus: response === 'accepted' ? 'accepted' :
                             response === 'declined' ? 'declined' :
                             'tentative',
            });
          }

          // Actualizar evento en Calendar
          await calendar.events.patch({
            calendarId,
            eventId,
            requestBody: {
              attendees: updatedAttendees,
            },
            sendUpdates: 'none', // No enviar emails automáticamente
          });
        }
      } catch (calendarError) {
        console.error('[POST /api/tasks/[id]/respond] Error actualizando Calendar:', calendarError);
        // No fallar si Calendar falla, pero loguear el error
      }
    }

    return NextResponse.json({ success: true, attendeeResponses: updatedResponses });
  } catch (error) {
    console.error('[POST /api/tasks/[id]/respond] Error:', error);
    return NextResponse.json({
      error: 'Failed to save response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
