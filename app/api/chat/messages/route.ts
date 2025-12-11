import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { ChatService } from '@/lib/services/chat.service';
import { NotificationService } from '@/lib/services/notification.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!chatRoomId) {
      return NextResponse.json(
        { error: 'chatRoomId is required' },
        { status: 400 }
      );
    }

    const messages = await ChatService.getMessages(chatRoomId, limit);
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatRoomId, content, mentions, attachments } = await request.json();

    if (!chatRoomId || !content) {
      return NextResponse.json(
        { error: 'chatRoomId and content are required' },
        { status: 400 }
      );
    }

    const message = await ChatService.sendMessage(
      chatRoomId,
      session.user.email,
      session.user.name,
      content,
      mentions,
      attachments
    );

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      const chatRooms = await ChatService.getChatRooms();
      const room = chatRooms.find((r) => r.id === chatRoomId);

      for (const mentionedEmail of mentions) {
        if (mentionedEmail !== session.user.email) {
          await NotificationService.notifyMention(
            mentionedEmail,
            session.user.name,
            chatRoomId,
            room?.name || 'Chat',
            content
          );
        }
      }
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, content } = await request.json();

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'messageId and content are required' },
        { status: 400 }
      );
    }

    await ChatService.editMessage(messageId, content);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    await ChatService.deleteMessage(messageId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
