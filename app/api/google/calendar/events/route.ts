import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createCalendarEventWithAttendees, getCalendarEvents } from '@/lib/google/calendar';
import { authOptions } from '@/lib/auth-config';
import { isUserAdmin } from '@/lib/constants';

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
        // Verificar si el usuario es admin
        const userEmail = session.user?.email || '';
        const isAdmin = isUserAdmin(userEmail);

        const events = await getCalendarEvents(session.accessToken, start, end, {
            userEmail: userEmail || undefined,
            isAdmin,
        });

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

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user?.email || '';
    if (!isUserAdmin(userEmail)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const title = String(body?.title || '').trim();
        const description = String(body?.description || '').trim();
        const date = String(body?.date || '').trim();
        const startTime = String(body?.startTime || '').trim();
        const endTime = String(body?.endTime || '').trim();
        const calendarId = body?.calendarId ? String(body.calendarId) : undefined;

        if (!title || !date || !startTime) {
            return NextResponse.json({ error: 'Title, date and startTime are required' }, { status: 400 });
        }

        const startDate = new Date(`${date}T${startTime}`);
        if (Number.isNaN(startDate.getTime())) {
            return NextResponse.json({ error: 'Invalid start date/time' }, { status: 400 });
        }

        let endDate: Date | null = null;
        if (endTime) {
            endDate = new Date(`${date}T${endTime}`);
            if (Number.isNaN(endDate.getTime())) {
                return NextResponse.json({ error: 'Invalid end date/time' }, { status: 400 });
            }
        } else {
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }

        if (endDate.getTime() <= startDate.getTime()) {
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        let attendees: string[] = [];
        if (Array.isArray(body?.attendees)) {
            attendees = body.attendees.map((value: string) => String(value).trim()).filter(Boolean);
        } else if (typeof body?.attendees === 'string') {
            attendees = body.attendees
                .split(',')
                .map((value: string) => value.trim())
                .filter(Boolean);
        }

        const result = await createCalendarEventWithAttendees(session.accessToken, {
            title,
            description: description || undefined,
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
            attendees,
            calendarId,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to create event' }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            eventId: result.eventId,
            eventLink: result.eventLink,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
