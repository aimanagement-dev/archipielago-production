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

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return google.calendar({ version: 'v3', auth });
}

function sanitizeEventId(id: string) {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, '');
  if (clean) return `arch-${clean}`.slice(0, 1024);
  const fallback = crypto.createHash('md5').update(id).digest('hex');
  return `arch-${fallback}`;
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

export async function syncTasksToCalendar(
  tasks: CalendarTaskPayload[],
  options?: { calendarId?: string; timezone?: string }
) {
  const calendarId = options?.calendarId || process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error('Falta GOOGLE_CALENDAR_ID');
  }

  const timezone = options?.timezone || process.env.GOOGLE_CALENDAR_TIMEZONE || 'UTC';
  const calendar = getCalendarClient();

  const result = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { id: string; message: string }[],
  };

  for (const task of tasks) {
    if (!task.scheduledDate) {
      result.skipped += 1;
      continue;
    }

    try {
      const action = await upsertEvent(calendar, calendarId, task, timezone);
      if (action === 'created') result.created += 1;
      if (action === 'updated') result.updated += 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      result.errors.push({
        id: task.id,
        message: errorMessage,
      });
    }
  }

  return result;
}
