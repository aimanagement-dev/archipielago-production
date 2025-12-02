import { NextResponse } from 'next/server';
import { syncTasksToCalendar, CalendarTaskPayload } from '@/lib/google/calendar';

export async function POST(request: Request) {
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
  } catch (error: any) {
    console.error('Error syncing Google Calendar', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
