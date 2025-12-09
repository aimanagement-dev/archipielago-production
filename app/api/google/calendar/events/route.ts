import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCalendarEvents } from '@/lib/google/calendar';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;

    try {
        const events = await getCalendarEvents(session.accessToken, start, end);

        return NextResponse.json({
            ok: true,
            events,
        });
    } catch (error) {
        console.error('Error fetching Google Calendar events', error);
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
