import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncTasksToCalendar, syncCalendarToTasks, CalendarTaskPayload } from '@/lib/google/calendar';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { Task } from '@/lib/types';
import { isUserAdmin } from '@/lib/constants';

function monthFromDate(date: string): Task['month'] {
  const month = new Date(date).getMonth();
  const map: Task['month'][] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as any;
  // Nuestro tipo Month no contempla Sep/Oct; usamos 'Nov' y 'Dic' válidos en rango actual
  return map[month] || 'Nov';
}

function weekOfMonth(date: string): string {
  const d = new Date(date);
  const day = d.getDate();
  const week = Math.floor((day - 1) / 7) + 1;
  return `Week ${week}`;
}

/**
 * POST: Sincronizar desde la app hacia Google Calendar
 * Body: { tasks: CalendarTaskPayload[] }
 */
export async function POST(request: Request) {
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

  const userEmail = session.user?.email || '';
  const isAdmin = isUserAdmin(userEmail);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
            month: monthFromDate(calendarTask.scheduledDate),
            week: weekOfMonth(calendarTask.scheduledDate),
            responsible: Array.isArray(calendarTask.responsible) ? calendarTask.responsible : [],
            notes: calendarTask.notes || '',
            scheduledDate: calendarTask.scheduledDate,
            scheduledTime: calendarTask.scheduledTime,
            isScheduled: !!calendarTask.scheduledDate,
            hasMeet: calendarTask.hasMeet || false,
            meetLink: (calendarTask as any).meetLink,
            attendeeResponses: (calendarTask as any).attendeeResponses || [],
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
              existingTask.meetLink !== task.meetLink ||
              JSON.stringify(existingTask.responsible) !== JSON.stringify(task.responsible) ||
              JSON.stringify(existingTask.attendeeResponses || []) !== JSON.stringify(task.attendeeResponses || []);
            
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
              } catch {
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

    // Limpieza: eliminar en Sheets las tareas programadas que ya no existen en Calendar
    try {
      const calendarIds = new Set(calendarResult.tasks.map((t) => t.id));
      const sheetsService = new GoogleSheetsService(session.accessToken);
      const spreadsheetId = await sheetsService.getOrCreateDatabase();
      const existingTasks = await sheetsService.getTasks(spreadsheetId);
      const toDelete = existingTasks.filter(
        (t) => t.isScheduled && t.scheduledDate && !calendarIds.has(t.id)
      );

      for (const t of toDelete) {
        try {
          await sheetsService.deleteTask(spreadsheetId, t.id);
          result.updated += 0; // no-op, solo limpieza
        } catch (err) {
          console.error(`[GC Sync] Error borrando tarea huérfana ${t.id}:`, err);
          result.errors.push({
            id: t.id,
            message: `No se pudo borrar tarea ausente en Calendar`,
          });
        }
      }
    } catch (cleanupError) {
      console.error('[GC Sync] Error en limpieza de tareas ausentes:', cleanupError);
      result.errors.push({
        id: 'cleanup',
        message: 'Error limpiando tareas ausentes vs Calendar',
      });
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
