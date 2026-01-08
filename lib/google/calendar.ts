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
  hasMeet?: boolean;
  meetLink?: string;
  visibleTo?: string[];
}

const DEFAULT_CALENDAR_ID = 'ai.management@archipielagofilm.com';

export function getCalendarClient(accessToken: string) {
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

  // Construir descripción con formato estructurado para facilitar parsing
  const descriptionParts = [];
  if (task.notes) descriptionParts.push(task.notes);
  if (task.area) descriptionParts.push(`Área: ${task.area}`);
  if (task.status) descriptionParts.push(`Estado: ${task.status}`);
  if (task.responsible && task.responsible.length > 0) {
    descriptionParts.push(`Responsables: ${task.responsible.join(', ')}`);
  }
  // Agregar taskId en la descripción también para facilitar búsqueda
  descriptionParts.push(`TaskID: ${task.id}`);

  if (hasTime) {
    const startDate = new Date(`${task.scheduledDate}T${task.scheduledTime || '09:00'}:00Z`).toISOString();
    return {
      summary: task.title,
      description: descriptionParts.join('\n'),
      start: {
        dateTime: startDate,
        timeZone: timezone,
      },
      conferenceData: task.hasMeet
        ? {
          createRequest: {
            requestId: `meet-${task.id}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        }
        : undefined,
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
    description: descriptionParts.join('\n'),
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
  timezone: string,
  previousCalendarId?: string
): Promise<{ action: 'created' | 'updated' | 'moved'; meetLink?: string }> {
  const eventId = sanitizeEventId(task.id);
  const body = buildEventBody(task, timezone);
  
  // Si hay un previousCalendarId diferente, eliminar el evento del calendario anterior
  if (previousCalendarId && previousCalendarId !== calendarId) {
    try {
      await calendar.events.delete({
        calendarId: previousCalendarId,
        eventId,
      });
      console.log(`[Calendar] Evento ${eventId} eliminado del calendario anterior ${previousCalendarId}`);
    } catch (error: any) {
      // Si el evento no existe en el calendario anterior, está bien
      if (error.code !== 404) {
        console.warn(`[Calendar] Error eliminando evento del calendario anterior:`, error);
      }
    }
  }

  // Agregar attendees si hay responsables o visibleTo
  const attendees: string[] = [];
  if (task.responsible && task.responsible.length > 0) {
    attendees.push(...task.responsible);
  }
  // visibleTo también puede contener emails de invitados
  if (task.visibleTo && Array.isArray(task.visibleTo)) {
    task.visibleTo.forEach((email: string) => {
      if (email.includes('@') && !attendees.includes(email)) {
        attendees.push(email);
      }
    });
  }
  
  if (attendees.length > 0 && body.start?.dateTime) {
    body.attendees = attendees.map(email => ({ email: email.trim() }));
  }

  try {
    // Si tiene Meet, asegurar que se cree con conferenceData
    const patchBody = task.hasMeet && !body.conferenceData
      ? {
          ...body,
          conferenceData: {
            createRequest: {
              requestId: `meet-${task.id}-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }
      : body;

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: patchBody,
      sendUpdates: attendees.length > 0 ? 'all' : 'none',
      conferenceDataVersion: 1,
    });
    
    // Extraer meetLink de la respuesta
    let meetLink: string | undefined;
    if (response.data.conferenceData?.entryPoints) {
      const meetEntry = response.data.conferenceData.entryPoints.find(
        (ep: any) => ep.entryPointType === 'video' || ep.uri?.includes('meet.google.com')
      );
      if (meetEntry?.uri) {
        meetLink = meetEntry.uri;
      }
    }
    
    return { action: 'updated', meetLink };
  } catch (error) {
    const isNotFound =
      (error as { code?: number; response?: { status?: number } })?.code === 404 ||
      (error as { response?: { status?: number } })?.response?.status === 404;

    if (isNotFound) {
      // Si tiene Meet, asegurar que se cree con conferenceData
      const insertBody = task.hasMeet && !body.conferenceData
        ? {
            ...body,
            id: eventId,
            conferenceData: {
              createRequest: {
                requestId: `meet-${task.id}-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }
        : {
            ...body,
            id: eventId,
          };

      const response = await calendar.events.insert({
        calendarId,
        requestBody: insertBody,
        sendUpdates: attendees.length > 0 ? 'all' : 'none',
        conferenceDataVersion: 1,
      });
      
      // Extraer meetLink de la respuesta
      let meetLink: string | undefined;
      if (response.data.conferenceData?.entryPoints) {
        const meetEntry = response.data.conferenceData.entryPoints.find(
          (ep: any) => ep.entryPointType === 'video' || ep.uri?.includes('meet.google.com')
        );
        if (meetEntry?.uri) {
          meetLink = meetEntry.uri;
        }
      }
      
      return { action: previousCalendarId && previousCalendarId !== calendarId ? 'moved' : 'created', meetLink };
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
  options?: { calendarId?: string; timezone?: string; previousCalendarId?: string }
) {
  // Use MASTER_CALENDAR_ID to sync to the project's shared calendar
  const calendarId = options?.calendarId || process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
  const timezone = options?.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Santo_Domingo';
  const calendar = getCalendarClient(accessToken);

  const result = {
    created: 0,
    updated: 0,
    moved: 0,
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
      const eventResult = await upsertEvent(calendar, calendarId, task, timezone, options?.previousCalendarId);
      if (eventResult.action === 'created') result.created += 1;
      if (eventResult.action === 'updated') result.updated += 1;
      if (eventResult.action === 'moved') result.moved += 1;
      
      // Si se creó un meetLink, guardarlo en el task
      if (eventResult.meetLink) {
        (task as any).meetLink = eventResult.meetLink;
      }
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
 * Lee TODOS los eventos del calendario (no solo los creados por arch-pm)
 * Esto permite sincronizar eventos existentes de Google Calendar hacia la app
 * Si isAdmin=true, lee de TODOS los calendarios del proyecto
 * Si isAdmin=false, solo lee del calendario "ARCH-Producción"
 */
export async function syncCalendarToTasks(
  accessToken: string,
  options?: { calendarId?: string; timeMin?: string; timeMax?: string; isAdmin?: boolean }
): Promise<{
  tasks: CalendarTaskPayload[];
  updated: number;
  created: number;
  errors: { id: string; message: string }[];
}> {
  const calendar = getCalendarClient(accessToken);

  const result = {
    tasks: [] as CalendarTaskPayload[],
    updated: 0,
    created: 0,
    errors: [] as { id: string; message: string }[],
  };

  const timeMin = options?.timeMin || new Date().toISOString();
  const timeMax = options?.timeMax;

  try {
    let events: calendar_v3.Schema$Event[] = [];

    // Si se especifica un calendarId específico, usar ese (comportamiento legacy)
    if (options?.calendarId) {
      const response = await calendar.events.list({
        calendarId: options.calendarId,
        timeMin,
        timeMax,
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      });
      events = response.data.items || [];
      console.log(`[syncCalendarToTasks] Leídos ${events.length} eventos del calendario específico: ${options.calendarId}`);
    } else {
      // Usar la misma lógica de múltiples calendarios que getCalendarEvents()
      // 1. Get List of all calendars the user has selected/visible
      const calendarList = await calendar.calendarList.list({
        minAccessRole: 'reader',
      });

      const calendars = calendarList.data.items || [];
      console.log('[syncCalendarToTasks] Found calendars:', calendars.map(c => ({ id: c.id, summary: c.summary })));

      // Filter: ONLY include the master calendar or project-specific calendars
      let targetCalendars = calendars.filter(c =>
        c.id === DEFAULT_CALENDAR_ID ||
        (c.summary && (c.summary.includes('Archipiélago') || c.summary.includes('ARCH-Producción')))
      );

      // Si el usuario NO es admin, solo mostrar ARCH-Producción (naranja)
      // Los admins ven ambos calendarios
      if (!options?.isAdmin) {
        targetCalendars = targetCalendars.filter(c => {
          const summary = c.summary?.toLowerCase() || '';
          return (
            summary.includes('producción') || 
            summary.includes('produccion') ||
            c.id === DEFAULT_CALENDAR_ID // Fallback al default si no encuentra Producción
          );
        });
        console.log('[syncCalendarToTasks] Usuario regular - solo mostrando ARCH-Producción');
      } else {
        console.log('[syncCalendarToTasks] Usuario admin - mostrando todos los calendarios del proyecto');
      }

      console.log('[syncCalendarToTasks] Targeting project calendars:', targetCalendars.map(c => c.summary));

      if (targetCalendars.length === 0) {
        // If none found, attempt to fetch from the master ID manually
        targetCalendars.push({ id: DEFAULT_CALENDAR_ID, summary: 'Archipiélago Master' });
      }

      // 2. Fetch events from all target calendars in parallel
      const allEventsPromises = targetCalendars.map(async (cal) => {
        if (!cal.id) return [];
        try {
          const response = await calendar.events.list({
            calendarId: cal.id,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 1000,
          });
          const items = response.data.items || [];
          console.log(`[syncCalendarToTasks] Fetched ${items.length} events from ${cal.summary}`);
          return items;
        } catch (err) {
          console.warn(`[syncCalendarToTasks] Failed to fetch events from calendar ${cal.summary} (${cal.id})`, err);
          result.errors.push({
            id: cal.id || 'unknown',
            message: err instanceof Error ? err.message : 'Error obteniendo eventos del calendario',
          });
          return [];
        }
      });

      const results = await Promise.all(allEventsPromises);
      events = results.flat();
      console.log(`[syncCalendarToTasks] Total eventos obtenidos de múltiples calendarios: ${events.length}`);
    }

    for (const event of events) {
      try {
        const summary = event.summary || '';
        const description = event.description || '';

        const isArchPmEvent = event.extendedProperties?.private?.source === 'arch-pm';
        const hasTaskIdInDesc = /TaskID:\s*(.+)/.test(description);

        // Solo procesar eventos creados por la app (source=arch-pm o con TaskID en descripción/extendedProperties)
        if (!isArchPmEvent && !hasTaskIdInDesc && !event.extendedProperties?.private?.taskId) {
          continue;
        }

        // PASO 1: Buscar taskId en extendedProperties (más confiable)
        let taskId = event.extendedProperties?.private?.taskId;

        // PASO 2: Si no está en extendedProperties, buscar en la descripción
        if (!taskId) {
          const taskIdFromDesc = description.match(/TaskID:\s*(.+)/)?.[1]?.trim();
          if (taskIdFromDesc) {
            taskId = taskIdFromDesc;
          }
        }

        // PASO 3: Si aún no tiene taskId, solo generar para eventos creados por la app
        if (!taskId && isArchPmEvent && event.id) {
          const eventIdHash = event.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
          taskId = `cal-${eventIdHash}`;
          console.log(`[syncCalendarToTasks] Evento sin taskId, generado: ${taskId} para evento "${summary}"`);
        }

        if (!taskId) {
          console.warn(`[syncCalendarToTasks] Evento sin ID, omitiendo:`, event.summary);
          continue; // Si no hay taskId ni eventId, no podemos procesarlo
        }

        // Extraer información de la descripción (formato arch-pm)
        const areaMatch = description.match(/Área:\s*(.+)/);
        const statusMatch = description.match(/Estado:\s*(.+)/);
        const responsibleMatch = description.match(/Responsables:\s*(.+)/);

        let area = areaMatch ? areaMatch[1].trim() : undefined;
        const status = statusMatch ? statusMatch[1].trim() : undefined;
        let responsible = responsibleMatch
          ? responsibleMatch[1].split(',').map(s => s.trim()).filter(Boolean)
          : [];

        // Si no se encontró información estructurada, intentar extraer del título
        // Ejemplo: "ARCH | [PRELIM] AI PR DGCIN" -> área podría ser "Producción"
        if (!area && summary) {
          // Detectar áreas comunes en el título
          const titleLower = summary.toLowerCase();
          if (titleLower.includes('producción') || titleLower.includes('production')) {
            area = 'Producción';
          } else if (titleLower.includes('post') || titleLower.includes('edición')) {
            area = 'Post-producción';
          } else if (titleLower.includes('guión') || titleLower.includes('script')) {
            area = 'Guión';
          } else if (titleLower.includes('técnico') || titleLower.includes('tech')) {
            area = 'Técnico';
          } else if (titleLower.includes('casting')) {
            area = 'Casting';
          }
        }

        // Extraer responsables de attendees si existen
        if (event.attendees && event.attendees.length > 0 && responsible.length === 0) {
          responsible = event.attendees
            .map(a => a.email)
            .filter(Boolean) as string[];
        }

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

        // Extraer notas (todo lo que no sea área, estado, responsables o TaskID)
        const notesBase = description
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return trimmed &&
              !trimmed.startsWith('Área:') &&
              !trimmed.startsWith('Estado:') &&
              !trimmed.startsWith('Responsables:') &&
              !trimmed.startsWith('TaskID:');
          })
          .join('\n')
          .trim();

        // Extraer link de Meet del evento
        let meetLink: string | undefined;
        if (event.conferenceData?.entryPoints) {
          const meetEntry = event.conferenceData.entryPoints.find(
            (ep: any) => ep.entryPointType === 'video' || ep.uri?.includes('meet.google.com')
          );
          if (meetEntry?.uri) {
            meetLink = meetEntry.uri;
          }
        }
        // Fallback: buscar en hangoutLink (legacy)
        if (!meetLink && (event as any).hangoutLink) {
          meetLink = (event as any).hangoutLink;
        }

        // Añadir detalles extra del evento (location) al final, pero NO el link de Meet (ya está en meetLink)
        const extraNotes: string[] = [];
        if (event.location) extraNotes.push(`Location: ${event.location}`);
        const notes =
          [notesBase, ...extraNotes]
            .filter(Boolean)
            .join('\n')
            .trim();

        // Extraer respuestas de attendees del evento
        const attendeeResponses: { email: string; response: 'accepted' | 'declined' | 'tentative' }[] = [];
        if (event.attendees) {
          event.attendees.forEach((attendee: any) => {
            if (attendee.email && attendee.responseStatus) {
              const response = attendee.responseStatus === 'accepted' ? 'accepted' :
                             attendee.responseStatus === 'declined' ? 'declined' :
                             attendee.responseStatus === 'tentative' ? 'tentative' : undefined;
              if (response) {
                attendeeResponses.push({ email: attendee.email, response });
              }
            }
          });
        }

        const task: CalendarTaskPayload = {
          id: taskId,
          title: summary,
          scheduledDate,
          scheduledTime,
          area: area || 'Planificación', // Default area si no se encuentra
          status: status || 'Pendiente', // Default status si no se encuentra
          responsible,
          notes: notes || undefined,
          hasMeet: !!meetLink,
          meetLink: meetLink,
        };

        // Agregar attendeeResponses al objeto task para que se sincronice con Sheets
        (task as any).attendeeResponses = attendeeResponses;

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
  const calendarId = options.calendarId || process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
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

export async function getCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string,
  options?: { userEmail?: string; isAdmin?: boolean }
) {
  const calendar = getCalendarClient(accessToken);

  const start = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = timeMax || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Get List of all calendars the user has selected/visible
    const calendarList = await calendar.calendarList.list({
      minAccessRole: 'reader',
    });

    const calendars = calendarList.data.items || [];
    console.log('Found calendars:', calendars.map(c => ({ id: c.id, summary: c.summary, selected: c.selected, primary: c.primary })));

    // Filter: ONLY include the master calendar or project-specific calendars
    // This prevents personal calendars (Birthdays, personal Tasks, etc.) from leaking into the app
    let targetCalendars = calendars.filter(c =>
      c.id === DEFAULT_CALENDAR_ID ||
      (c.summary && (c.summary.includes('Archipiélago') || c.summary.includes('ARCH-Producción')))
    );

    // Si el usuario NO es admin, solo mostrar ARCH-Producción (naranja)
    // Los admins ven ambos calendarios
    if (!options?.isAdmin) {
      targetCalendars = targetCalendars.filter(c => {
        const summary = c.summary?.toLowerCase() || '';
        return (
          summary.includes('producción') || 
          summary.includes('produccion') ||
          c.id === DEFAULT_CALENDAR_ID // Fallback al default si no encuentra Producción
        );
      });
      console.log('[getCalendarEvents] Usuario regular - solo mostrando ARCH-Producción');
    } else {
      console.log('[getCalendarEvents] Usuario admin - mostrando todos los calendarios del proyecto');
    }

    console.log('Targeting project calendars:', targetCalendars.map(c => c.summary));

    if (targetCalendars.length === 0) {
      // If none found, attempt to fetch from the master ID manually
      targetCalendars.push({ id: DEFAULT_CALENDAR_ID, summary: 'Archipiélago Master' });
    }

    // 2. Fetch events from all target calendars in parallel
    const allEventsPromises = targetCalendars.map(async (cal) => {
      if (!cal.id) return [];
      try {
        const response = await calendar.events.list({
          calendarId: cal.id,
          timeMin: start,
          timeMax: end,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 1000,
        });
        const items = response.data.items || [];
        console.log(`Fetched ${items.length} events from ${cal.summary}`);
        return items.map(event => ({
          ...event,
          sourceCalendar: cal.summary
        }));
      } catch (err) {
        console.warn(`Failed to fetch events from calendar ${cal.summary} (${cal.id})`, err);
        return [];
      }
    });

    const results = await Promise.all(allEventsPromises);

    // 3. Flatten the array
    const flatEvents = results.flat();

    return flatEvents;

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // Fallback to original primary fetch if listing fails completely
    try {
      const response = await calendar.events.list({
        calendarId: DEFAULT_CALENDAR_ID,
        timeMin: start,
        timeMax: end,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500,
      });
      return response.data.items || [];
    } catch (innerError) {
      throw innerError;
    }
  }
}

export async function updateEventMetadata(
  accessToken: string,
  calendarId: string,
  eventId: string,
  metadata: { [key: string]: string }
) {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      extendedProperties: {
        private: metadata,
      },
    },
  });
}
