import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncTasksToCalendar, syncCalendarToTasks, CalendarTaskPayload } from '@/lib/google/calendar';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { Task } from '@/lib/types';

/**
 * POST: Sincronizar desde la app hacia Google Calendar
 * Body: { tasks: CalendarTaskPayload[] }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tasks } = (await request.json()) as { tasks?: CalendarTaskPayload[] };

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Body inválido, se esperaba { tasks: Task[] }' }, { status: 400 });
    }

    const result = await syncTasksToCalendar(tasks, session.accessToken);

    return NextResponse.json({
      ok: true,
      direction: 'app_to_calendar',
      ...result,
    });
  } catch (error) {
    console.error('Error syncing Google Calendar', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Sincronizar desde Google Calendar hacia la app
 * Query params: 
 *   - timeMin: fecha mínima (ISO string, opcional)
 *   - timeMax: fecha máxima (ISO string, opcional)
 *   - updateSheets: 'true' para actualizar Google Sheets (default: 'true')
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;
    const updateSheets = searchParams.get('updateSheets') !== 'false'; // default true

    // Leer eventos de Google Calendar
    const calendarResult = await syncCalendarToTasks(session.accessToken, {
      timeMin,
      timeMax,
    });

    const result = {
      ok: true,
      direction: 'calendar_to_app',
      tasksFound: calendarResult.tasks.length,
      updated: 0,
      created: 0,
      errors: calendarResult.errors,
    };

    // Si se solicita actualizar Google Sheets
    if (updateSheets && calendarResult.tasks.length > 0) {
      const sheetsService = new GoogleSheetsService(session.accessToken);
      const spreadsheetId = await sheetsService.getOrCreateDatabase();
      
      // Obtener tareas existentes
      const existingTasks = await sheetsService.getTasks(spreadsheetId);
      const existingTaskMap = new Map(existingTasks.map(t => [t.id, t]));

      // Actualizar o crear tareas
      for (const calendarTask of calendarResult.tasks) {
        try {
          const existingTask = existingTaskMap.get(calendarTask.id);
          
          // Convertir CalendarTaskPayload a Task
          const task: Task = {
            id: calendarTask.id,
            title: calendarTask.title,
            status: (calendarTask.status as Task['status']) || 'Pendiente',
            area: (calendarTask.area as Task['area']) || 'Planificación',
            month: 'Ene' as Task['month'], // Default, se puede mejorar extrayendo del scheduledDate
            week: 'Week 1',
            responsible: calendarTask.responsible || [],
            notes: calendarTask.notes || '',
            scheduledDate: calendarTask.scheduledDate,
            scheduledTime: calendarTask.scheduledTime,
            isScheduled: !!calendarTask.scheduledDate,
          };

          if (existingTask) {
            // Actualizar tarea existente solo si hay cambios en fecha/hora/título
            const hasChanges = 
              existingTask.scheduledDate !== task.scheduledDate ||
              existingTask.scheduledTime !== task.scheduledTime ||
              existingTask.title !== task.title;

            if (hasChanges) {
              await sheetsService.updateTask(spreadsheetId, task);
              result.updated += 1;
            }
          } else {
            // Crear nueva tarea solo si no existe
            await sheetsService.addTask(spreadsheetId, task);
            result.created += 1;
          }
        } catch (error) {
          console.error(`Error updating task ${calendarTask.id} in Sheets:`, error);
          result.errors.push({
            id: calendarTask.id,
            message: error instanceof Error ? error.message : 'Error actualizando en Sheets',
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing from Google Calendar', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
