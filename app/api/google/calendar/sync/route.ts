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
      let existingTasks: Task[] = [];
      try {
        existingTasks = await sheetsService.getTasks(spreadsheetId);
      } catch (error) {
        console.error('Error obteniendo tareas existentes:', error);
        // Continuar de todas formas
      }
      
      const existingTaskMap = new Map(existingTasks.map(t => [t.id, t]));

      // Actualizar o crear tareas
      for (const calendarTask of calendarResult.tasks) {
        try {
          // Validar que la tarea tenga los campos mínimos requeridos
          if (!calendarTask.id || !calendarTask.title || !calendarTask.scheduledDate) {
            console.warn(`Tarea inválida omitida:`, calendarTask);
            continue;
          }

          const existingTask = existingTaskMap.get(calendarTask.id);
          
          // Convertir CalendarTaskPayload a Task
          const task: Task = {
            id: calendarTask.id,
            title: calendarTask.title,
            status: (calendarTask.status as Task['status']) || 'Pendiente',
            area: (calendarTask.area as Task['area']) || 'Planificación',
            month: 'Ene' as Task['month'], // Default, se puede mejorar extrayendo del scheduledDate
            week: 'Week 1',
            responsible: Array.isArray(calendarTask.responsible) ? calendarTask.responsible : [],
            notes: calendarTask.notes || '',
            scheduledDate: calendarTask.scheduledDate,
            scheduledTime: calendarTask.scheduledTime,
            isScheduled: !!calendarTask.scheduledDate,
          };

          if (existingTask) {
            // Verificar si hay cambios reales antes de actualizar
            const hasChanges = 
              existingTask.title !== task.title ||
              existingTask.scheduledDate !== task.scheduledDate ||
              existingTask.scheduledTime !== task.scheduledTime ||
              existingTask.status !== task.status ||
              existingTask.area !== task.area ||
              existingTask.notes !== task.notes ||
              JSON.stringify(existingTask.responsible) !== JSON.stringify(task.responsible);
            
            if (hasChanges) {
              // Actualizar tarea existente solo si hay cambios
              try {
                await sheetsService.updateTask(spreadsheetId, task);
                result.updated += 1;
              } catch (updateError) {
                console.error(`Error actualizando tarea ${calendarTask.id}:`, updateError);
                // Si falla la actualización, intentar eliminar y recrear
                try {
                  await sheetsService.deleteTask(spreadsheetId, task.id);
                  await sheetsService.addTask(spreadsheetId, task);
                  result.created += 1;
                  result.updated -= 1; // Ajustar contador
                } catch (recreateError) {
                  console.error(`Error recreando tarea ${calendarTask.id}:`, recreateError);
                  result.errors.push({
                    id: calendarTask.id,
                    message: `Error actualizando: ${updateError instanceof Error ? updateError.message : 'Unknown'}`,
                  });
                }
              }
            } else {
              // No hay cambios, no actualizar
              console.log(`Tarea ${calendarTask.id} ya está sincronizada, sin cambios`);
            }
          } else {
            // Crear nueva tarea
            try {
              await sheetsService.addTask(spreadsheetId, task);
              result.created += 1;
            } catch (createError) {
              console.error(`Error creando tarea ${calendarTask.id}:`, createError);
              // Intentar de nuevo con un ID diferente si el problema es de duplicados
              try {
                const taskWithNewId = { ...task, id: `${task.id}-retry-${Date.now()}` };
                await sheetsService.addTask(spreadsheetId, taskWithNewId);
                result.created += 1;
                console.log(`Tarea creada con ID alternativo: ${taskWithNewId.id}`);
              } catch (retryError) {
                result.errors.push({
                  id: calendarTask.id,
                  message: createError instanceof Error ? createError.message : 'Error creando en Sheets',
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error procesando tarea ${calendarTask.id}:`, error);
          result.errors.push({
            id: calendarTask.id,
            message: error instanceof Error ? error.message : 'Error procesando tarea',
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
