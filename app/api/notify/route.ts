import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import nodemailer from 'nodemailer';

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
        if (useSystemEmail && session.user?.email?.toLowerCase() !== SYSTEM_EMAIL.toLowerCase()) {
            console.warn(`[Notify] Warning: Attempting to send from ${SYSTEM_EMAIL} but logged in as ${session.user?.email}. This may fail.`);
            console.warn(`[Notify] Solution: Login with ${SYSTEM_EMAIL} account or use Service Account credentials.`);
        }

        // Configurar transporter con OAuth2
        console.log(`[Notify] Attempting to send email via ${senderEmail}${useSystemEmail ? ' (system email)' : ''}`);
        console.log(`[Notify] Logged in as: ${session.user?.email}`);
        console.log(`[Notify] Config: ClientID=${!!process.env.GOOGLE_CLIENT_ID}, AccessToken=${session.accessToken ? 'Yes (' + session.accessToken.substring(0, 10) + '...)' : 'No'}, RefreshToken=${session.refreshToken ? 'Yes' : 'No'}`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: senderEmail,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                accessToken: session.accessToken as string,
                refreshToken: session.refreshToken as string,
            },
        } as nodemailer.TransportOptions);

        // Enviar correo
        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to,
            subject,
            text,
            html,
            attachments // Optional: [{ filename: '...', path: '...' }]
        });

        console.log('Message sent: %s', info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });

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
