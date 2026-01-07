/**
 * Helper function to send emails directly (for internal use)
 * This avoids HTTP calls between server-side routes
 */
import nodemailer from 'nodemailer';

export interface SendEmailParams {
    accessToken: string;
    refreshToken: string;
    userEmail?: string; // Opcional, si no se provee usa SYSTEM_EMAIL
    userName?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{ filename: string; path: string }>;
    useSystemEmail?: boolean; // Si true, usa SYSTEM_EMAIL en lugar de userEmail
}

// Email del sistema para enviar correos oficiales
const SYSTEM_EMAIL = 'ai.management@archipielagofilm.com';
const SYSTEM_NAME = 'Archipiélago Production OS';

export async function sendEmailDirect({
    accessToken,
    refreshToken,
    userEmail,
    userName,
    to,
    subject,
    html,
    text,
    attachments,
    useSystemEmail = false,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Server configuration error: Missing GOOGLE_CLIENT_SECRET');
        }

        if (!to || !subject || (!html && !text)) {
            throw new Error('Missing required fields: to, subject, and html or text');
        }

        // Determinar email remitente
        const senderEmail = useSystemEmail ? SYSTEM_EMAIL : (userEmail || SYSTEM_EMAIL);
        const senderName = useSystemEmail ? SYSTEM_NAME : (userName || SYSTEM_NAME);

        // Configurar transporter con OAuth2
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: senderEmail,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        } as nodemailer.TransportOptions);

        // Enviar correo
        const toArray = Array.isArray(to) ? to : [to];
        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: toArray.join(','),
            subject,
            text,
            html,
            attachments,
        });

        console.log(`[sendEmailDirect] Email sent successfully: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('[sendEmailDirect] Error sending email:', error);
        return {
            success: false,
            error: error.message || 'Unknown error sending email',
        };
    }
}
