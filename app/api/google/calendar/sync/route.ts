import { NextResponse } from 'next/server';
import { syncTasksToCalendar, CalendarTaskPayload } from '@/lib/google/calendar';
import { checkAdmin } from '@/lib/api-auth';

export async function POST(request: Request) {
  const authResponse = await checkAdmin();
  if (authResponse) return authResponse;

  try {
    const { tasks } = (await request.json()) as { tasks?: CalendarTaskPayload[] };

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Body inválido, se esperaba { tasks: Task[] }' }, { status: 400 });
    }

    const result = await syncTasksToCalendar(tasks);

    return NextResponse.json({
      ok: true,
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
