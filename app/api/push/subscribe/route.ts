import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subscription } = await req.json();
    const userEmail = session.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Guardar suscripción en Google Sheets
    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();
    
    // Guardar suscripción
    await service.savePushSubscription(spreadsheetId, {
      userEmail,
      subscription: JSON.stringify(subscription),
      createdAt: new Date().toISOString(),
    });

    console.log(`[POST /api/push/subscribe] Subscription saved for ${userEmail}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/push/subscribe] Error:', error);
    return NextResponse.json({
      error: 'Failed to save subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();
    const subscription = await service.getPushSubscription(spreadsheetId, userEmail);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('[GET /api/push/subscribe] Error:', error);
    return NextResponse.json({
      error: 'Failed to get subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();
    await service.deletePushSubscription(spreadsheetId, userEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/push/subscribe] Error:', error);
    return NextResponse.json({
      error: 'Failed to delete subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
