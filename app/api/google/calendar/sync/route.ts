import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncTasksToCalendar, CalendarTaskPayload } from '@/lib/google/calendar';
import { authOptions } from '@/lib/auth-config';

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
