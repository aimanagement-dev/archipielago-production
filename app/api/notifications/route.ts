import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { NotificationService } from '@/lib/services/notification.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (action === 'count') {
      const count = await NotificationService.getUnreadCount(session.user.email);
      return NextResponse.json({ count });
    }

    const notifications = await NotificationService.getNotifications(
      session.user.email,
      limit
    );
    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      await NotificationService.markAllAsRead(session.user.email);
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    await NotificationService.markAsRead(notificationId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
