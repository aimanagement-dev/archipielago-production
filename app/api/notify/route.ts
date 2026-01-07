import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { sendEmailViaGmail } from '@/lib/gmail';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session as any).error === "RefreshAccessTokenError") {
        return NextResponse.json({
            error: 'Session expired',
            details: 'Tu sesión ha expirado o las credenciales son inválidas. Por favor cierra sesión y vuelve a ingresar.'
        }, { status: 401 });
    }

    // Determinar email remitente (fuera del try para usar en catch)
    const SYSTEM_EMAIL = 'ai.management@archipielagofilm.com';
    const SYSTEM_NAME = 'Archipiélago Production OS';
    let senderEmail = SYSTEM_EMAIL;
    let senderName = SYSTEM_NAME;
    let useSystemEmail = false;

    try {
        const body = await req.json();
        const { to, subject, html, text, attachments } = body;
        useSystemEmail = body.useSystemEmail || false;

        if (!to || !subject || (!html && !text)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!process.env.GOOGLE_CLIENT_SECRET) {
            console.error('[Notify] Missing GOOGLE_CLIENT_SECRET');
            throw new Error('Server configuration error: Missing GOOGLE_CLIENT_SECRET');
        }

        // Determinar email remitente
        senderEmail = useSystemEmail ? SYSTEM_EMAIL : (session.user?.email || SYSTEM_EMAIL);
        senderName = useSystemEmail ? SYSTEM_NAME : (session.user?.name || SYSTEM_NAME);

        // Validar que si se usa SYSTEM_EMAIL, el usuario logueado sea esa cuenta
        const loggedInEmail = session.user?.email?.toLowerCase();
        const systemEmailLower = SYSTEM_EMAIL.toLowerCase();
        
        if (useSystemEmail && loggedInEmail !== systemEmailLower) {
            const errorMsg = `No puedes enviar desde ${SYSTEM_EMAIL} porque estás logueado como ${session.user?.email}. `;
            const solutionMsg = `Para enviar desde ${SYSTEM_EMAIL}, debes iniciar sesión con esa cuenta específica.`;
            
            console.error(`[Notify] Error: ${errorMsg}${solutionMsg}`);
            
            return NextResponse.json({
                error: 'Error de autenticación',
                details: errorMsg + solutionMsg,
            }, { status: 403 });
        }

        // Si el usuario logueado ES la cuenta del sistema, usar sus credenciales directamente
        // Si no, usar las credenciales del usuario logueado (solo puede enviar desde su propia cuenta)
        const canSendFromRequestedEmail = loggedInEmail === senderEmail.toLowerCase();
        
        if (!canSendFromRequestedEmail) {
            const errorMsg = `No puedes enviar desde ${senderEmail} porque estás logueado como ${session.user?.email}. `;
            const solutionMsg = `Para enviar desde ${senderEmail}, debes iniciar sesión con esa cuenta específica.`;
            
            console.error(`[Notify] Error: ${errorMsg}${solutionMsg}`);
            
            return NextResponse.json({
                error: 'Error de autenticación',
                details: errorMsg + solutionMsg,
            }, { status: 403 });
        }

        // Usar Gmail API directamente
        console.log(`[Notify] Attempting to send email via Gmail API from ${senderEmail}${useSystemEmail ? ' (system email)' : ''}`);
        console.log(`[Notify] Logged in as: ${session.user?.email}`);
        console.log(`[Notify] AccessToken=${session.accessToken ? 'Yes (' + session.accessToken.substring(0, 10) + '...)' : 'No'}, RefreshToken=${session.refreshToken ? 'Yes' : 'No'}`);
        
        const result = await sendEmailViaGmail({
            accessToken: session.accessToken as string,
            refreshToken: session.refreshToken as string,
            fromEmail: senderEmail,
            fromName: senderName,
            to: Array.isArray(to) ? to : to.split(',').map((e: string) => e.trim()),
            subject,
            text,
            html,
            // attachments se convertirían a base64 si se necesitan
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to send email via Gmail API');
        }

        console.log(`[Notify] Message sent successfully. Message ID: ${result.messageId}`);

        return NextResponse.json({ success: true, messageId: result.messageId });

    } catch (error: any) {
        console.error('Error sending email:', error);
        console.error('Error stack:', error.stack);
        
        // Mejorar mensaje de error para BadCredentials
        let errorMessage = error.message || 'Failed to send email';
        let errorDetails = error.message;
        
        if (error.message?.includes('BadCredentials') || error.message?.includes('Username and Password not accepted')) {
            errorMessage = 'Error de autenticación: Las credenciales OAuth no tienen permisos para enviar desde esta cuenta.';
            errorDetails = `Para enviar desde ${senderEmail}, necesitas iniciar sesión con esa cuenta específica o configurar un Service Account.`;
        }
        
        return NextResponse.json({
            error: errorMessage,
            details: errorDetails,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
