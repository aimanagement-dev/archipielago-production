import crypto from 'crypto';
import { google, calendar_v3 } from 'googleapis';

export interface CalendarTaskPayload {
  id: string;
  title: string;
  scheduledDate?: string;
  scheduledTime?: string;
  responsible?: string[];
  area?: string;
  status?: string;
  notes?: string;
}

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

function sanitizeEventId(id: string) {
  // Google Calendar event IDs must be 5-1024 chars, only [a-v0-9] (base32hex lowercase)
  const hash = crypto.createHash('md5').update(id).digest('hex');
  // Convert hex to base32hex-like (only a-v and 0-9)
  const base32 = hash.replace(/[w-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 22));
  return `arch${base32}`.toLowerCase().slice(0, 1024);
}

function addOneHour(dateIso: string) {
  const date = new Date(dateIso);
  date.setHours(date.getHours() + 1);
  return date.toISOString();
}

function addOneDay(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function buildEventBody(task: CalendarTaskPayload, timezone: string): calendar_v3.Schema$Event {
  const hasTime = Boolean(task.scheduledTime);

  if (!task.scheduledDate) {
    throw new Error(`Task ${task.id} no tiene scheduledDate`);
  }

  if (hasTime) {
    const startDate = new Date(`${task.scheduledDate}T${task.scheduledTime || '09:00'}:00Z`).toISOString();
    return {
      summary: task.title,
      description: [
        task.notes || '',
        task.area ? `Área: ${task.area}` : '',
        task.status ? `Estado: ${task.status}` : '',
        task.responsible && task.responsible.length ? `Responsables: ${task.responsible.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      start: {
        dateTime: startDate,
        timeZone: timezone,
      },
      end: {
        dateTime: addOneHour(startDate),
        timeZone: timezone,
      },
      extendedProperties: {
        private: {
          source: 'arch-pm',
          taskId: task.id,
        },
      },
    };
  }

  return {
    summary: task.title,
    description: [
      task.notes || '',
      task.area ? `Área: ${task.area}` : '',
      task.status ? `Estado: ${task.status}` : '',
      task.responsible && task.responsible.length ? `Responsables: ${task.responsible.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    start: {
      date: task.scheduledDate,
      timeZone: timezone,
    },
    end: {
      date: addOneDay(task.scheduledDate),
      timeZone: timezone,
    },
    extendedProperties: {
      private: {
        source: 'arch-pm',
        taskId: task.id,
      },
    },
  };
}

async function upsertEvent(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  task: CalendarTaskPayload,
  timezone: string
) {
  const eventId = sanitizeEventId(task.id);
  const body = buildEventBody(task, timezone);

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: body,
      sendUpdates: 'none',
    });
    return 'updated';
  } catch (error) {
    const isNotFound =
      (error as { code?: number; response?: { status?: number } })?.code === 404 ||
      (error as { response?: { status?: number } })?.response?.status === 404;

    if (isNotFound) {
      await calendar.events.insert({
        calendarId,
        requestBody: {
          ...body,
          id: eventId,
        },
        sendUpdates: 'none',
      });
      return 'created';
    }
    throw error;
  }
}

async function deleteEventsNotInTasks(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  taskIds: string[]
) {
  // Obtener todos los eventos creados por arch-pm
  const response = await calendar.events.list({
    calendarId,
    privateExtendedProperty: ['source=arch-pm'],
    maxResults: 2500,
  });

  const events = response.data.items || [];
  const deletedCount = { count: 0 };

  // Eliminar eventos que ya no existen en las tareas
  for (const event of events) {
    const taskId = event.extendedProperties?.private?.taskId;
    if (taskId && !taskIds.includes(taskId) && event.id) {
      try {
        await calendar.events.delete({
          calendarId,
          eventId: event.id,
        });
        deletedCount.count += 1;
      } catch (error) {
        console.error(`Error deleting event ${event.id}:`, error);
      }
    }
  }

  return deletedCount.count;
}

export async function syncTasksToCalendar(
  tasks: CalendarTaskPayload[],
  accessToken: string,
  options?: { calendarId?: string; timezone?: string }
) {
  // Use 'primary' to sync to the user's main calendar
  const calendarId = options?.calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';
  const timezone = options?.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Santo_Domingo';
  const calendar = getCalendarClient(accessToken);

  const result = {
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    errors: [] as { id: string; message: string }[],
  };

  // Primero, crear/actualizar las tareas actuales
  for (const task of tasks) {
    if (!task.scheduledDate) {
      result.skipped += 1;
      continue;
    }

    try {
      const action = await upsertEvent(calendar, calendarId, task, timezone);
      if (action === 'created') result.created += 1;
      if (action === 'updated') result.updated += 1;
    } catch (error: unknown) {
      console.error('Calendar sync error for task', task.id, error);
      const err = error as { message?: string; response?: { data?: { error?: { message?: string } } } };
      const errorMessage = err.response?.data?.error?.message || err.message || 'Error desconocido';
      result.errors.push({
        id: task.id,
        message: errorMessage,
      });
    }
  }

  // Luego, eliminar eventos que ya no existen en las tareas
  try {
    const taskIds = tasks.map(t => t.id);
    const deletedCount = await deleteEventsNotInTasks(calendar, calendarId, taskIds);
    result.deleted = deletedCount;
  } catch (error) {
    console.error('Error deleting old events:', error);
    result.errors.push({
      id: 'cleanup',
      message: `Error eliminando eventos antiguos: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return result;
}

/**
 * Lee eventos de Google Calendar y los convierte a tareas
 * Solo lee eventos creados por arch-pm (con extendedProperties.source='arch-pm')
 */
export async function syncCalendarToTasks(
  accessToken: string,
  options?: { calendarId?: string; timeMin?: string; timeMax?: string }
): Promise<{
  tasks: CalendarTaskPayload[];
  updated: number;
  created: number;
  errors: { id: string; message: string }[];
}> {
  const calendarId = options?.calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';
  const calendar = getCalendarClient(accessToken);

  const result = {
    tasks: [] as CalendarTaskPayload[],
    updated: 0,
    created: 0,
    errors: [] as { id: string; message: string }[],
  };

  try {
    // Obtener eventos creados por arch-pm
    const response = await calendar.events.list({
      calendarId,
      privateExtendedProperty: ['source=arch-pm'],
      timeMin: options?.timeMin || new Date().toISOString(),
      timeMax: options?.timeMax,
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    for (const event of events) {
      try {
        const taskId = event.extendedProperties?.private?.taskId;
        if (!taskId) {
          continue; // Solo procesar eventos con taskId
        }

        const summary = event.summary || '';
        const description = event.description || '';
        
        // Extraer información de la descripción
        const areaMatch = description.match(/Área:\s*(.+)/);
        const statusMatch = description.match(/Estado:\s*(.+)/);
        const responsibleMatch = description.match(/Responsables:\s*(.+)/);
        
        const area = areaMatch ? areaMatch[1].trim() : undefined;
        const status = statusMatch ? statusMatch[1].trim() : undefined;
        const responsible = responsibleMatch 
          ? responsibleMatch[1].split(',').map(s => s.trim()).filter(Boolean)
          : [];

        // Extraer fecha y hora
        let scheduledDate: string | undefined;
        let scheduledTime: string | undefined;

        if (event.start?.dateTime) {
          // Evento con hora específica
          const startDate = new Date(event.start.dateTime);
          scheduledDate = startDate.toISOString().split('T')[0];
          scheduledTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        } else if (event.start?.date) {
          // Evento de todo el día
          scheduledDate = event.start.date;
        }

        if (!scheduledDate) {
          continue; // Solo procesar eventos con fecha
        }

        // Extraer notas (todo lo que no sea área, estado o responsables)
        const notes = description
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return trimmed && 
                   !trimmed.startsWith('Área:') && 
                   !trimmed.startsWith('Estado:') && 
                   !trimmed.startsWith('Responsables:');
          })
          .join('\n')
          .trim();

        const task: CalendarTaskPayload = {
          id: taskId,
          title: summary,
          scheduledDate,
          scheduledTime,
          area,
          status,
          responsible,
          notes: notes || undefined,
        };

        result.tasks.push(task);
      } catch (error) {
        console.error('Error processing calendar event', event.id, error);
        result.errors.push({
          id: event.id || 'unknown',
          message: error instanceof Error ? error.message : 'Error procesando evento',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    result.errors.push({
      id: 'fetch',
      message: error instanceof Error ? error.message : 'Error obteniendo eventos del calendario',
    });
  }

  return result;
}

/**
 * Crea un evento en Google Calendar con invitados (attendees)
 */
export async function createCalendarEventWithAttendees(
  accessToken: string,
  options: {
    title: string;
    description?: string;
    startDateTime: string; // ISO string
    endDateTime?: string; // ISO string, opcional (default: +1 hora)
    attendees?: string[]; // Array de emails
    calendarId?: string;
    timezone?: string;
  }
): Promise<{ success: boolean; eventId?: string; eventLink?: string; error?: string }> {
  const calendarId = options.calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';
  const timezone = options.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Santo_Domingo';
  const calendar = getCalendarClient(accessToken);

  try {
    const startDate = new Date(options.startDateTime);
    const endDate = options.endDateTime 
      ? new Date(options.endDateTime)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hora por defecto

    const event: calendar_v3.Schema$Event = {
      summary: options.title,
      description: options.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone,
      },
      extendedProperties: {
        private: {
          source: 'arch-pm',
          createdBy: 'gemini-ai',
        },
      },
    };

    // Agregar attendees si se proporcionan
    const hasAttendees = options.attendees && options.attendees.length > 0;
    if (hasAttendees && options.attendees) {
      event.attendees = options.attendees.map(email => ({
        email: email.trim(),
      }));
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: hasAttendees ? 'all' : 'none',
    });

    return {
      success: true,
      eventId: response.data.id || undefined,
      eventLink: response.data.htmlLink || undefined,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    const err = error as { message?: string; response?: { data?: { error?: { message?: string } } } };
    const errorMessage = err.response?.data?.error?.message || err.message || 'Error desconocido';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
