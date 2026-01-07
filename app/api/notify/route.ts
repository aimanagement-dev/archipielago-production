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

    try {
        const { to, subject, html, text, attachments } = await req.json();

        if (!to || !subject || (!html && !text)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!process.env.GOOGLE_CLIENT_SECRET) {
            console.error('[Notify] Missing GOOGLE_CLIENT_SECRET');
            throw new Error('Server configuration error: Missing GOOGLE_CLIENT_SECRET');
        }

        // Configurar transporter con OAuth2
        console.log(`[Notify] Attempting to send email via ${session.user?.email}`);
        console.log(`[Notify] Config: ClientID=${!!process.env.GOOGLE_CLIENT_ID}, AccessToken=${session.accessToken ? 'Yes (' + session.accessToken.substring(0, 10) + '...)' : 'No'}, RefreshToken=${session.refreshToken ? 'Yes' : 'No'}`);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: session.user?.email,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                accessToken: session.accessToken as string,
                refreshToken: session.refreshToken as string,
            },
        } as nodemailer.TransportOptions);

        // Enviar correo
        const info = await transporter.sendMail({
            from: `"${session.user?.name}" <${session.user?.email}>`,
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
        return NextResponse.json({
            error: 'Failed to send email',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
