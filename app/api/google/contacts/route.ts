import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { NextResponse } from 'next/server';
import { getGoogleContacts } from '@/lib/google/contacts';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const contacts = await getGoogleContacts(session.accessToken);
        return NextResponse.json({ contacts });
    } catch (error) {
        console.error('Error in contacts API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contacts' },
            { status: 500 }
        );
    }
}
