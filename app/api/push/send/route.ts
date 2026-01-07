import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleSheetsService } from '@/lib/google-sheets';
import webpush from 'web-push';

// Configurar VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:ai.management@archipielagofilm.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, title, body, url, icon } = await req.json();

    if (!to || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, title, body' }, { status: 400 });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        error: 'VAPID keys not configured',
        details: 'Please configure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment variables'
      }, { status: 500 });
    }

    // Obtener suscripciones de los destinatarios
    const service = new GoogleSheetsService(session.accessToken);
    const spreadsheetId = await service.getOrCreateDatabase();
    
    const recipients = Array.isArray(to) ? to : [to];
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
    };

    for (const recipient of recipients) {
      try {
        // Obtener suscripción del usuario
        const subscriptionData = await service.getPushSubscription(spreadsheetId, recipient);
        
        if (!subscriptionData || !subscriptionData.subscription) {
          console.warn(`[POST /api/push/send] No subscription found for ${recipient}`);
          results.failed++;
          results.errors.push({
            email: recipient,
            error: 'No push subscription found',
          });
          continue;
        }

        // Parsear suscripción
        const subscription = typeof subscriptionData.subscription === 'string'
          ? JSON.parse(subscriptionData.subscription)
          : subscriptionData.subscription;

        // Preparar payload de notificación
        const payload = JSON.stringify({
          title,
          body,
          icon: icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'archipielago-notification',
          data: {
            url: url || '/',
          },
        });

        // Enviar push notification
        await webpush.sendNotification(subscription, payload);
        
        // Actualizar lastUsed
        await service.updatePushSubscriptionLastUsed(spreadsheetId, recipient);
        
        results.sent++;
        console.log(`[POST /api/push/send] Push sent successfully to ${recipient}`);
      } catch (error: any) {
        console.error(`[POST /api/push/send] Error sending to ${recipient}:`, error);
        results.failed++;
        results.errors.push({
          email: recipient,
          error: error.message || 'Unknown error',
        });

        // Si la suscripción es inválida (410), eliminarla
        if (error.statusCode === 410) {
          console.log(`[POST /api/push/send] Subscription expired for ${recipient}, deleting...`);
          await service.deletePushSubscription(spreadsheetId, recipient);
        }
      }
    }

    return NextResponse.json({
      success: results.sent > 0,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('[POST /api/push/send] Error:', error);
    return NextResponse.json({
      error: 'Failed to send push notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
