import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { ChatService } from '@/lib/services/chat.service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await ChatService.getChatRooms();
    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, description, area } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const room = await ChatService.createChatRoom(
      name,
      type,
      session.user.email,
      description,
      area
    );

    return NextResponse.json({ room });
  } catch (error: any) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
