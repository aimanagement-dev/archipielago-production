/**
 * Helper function to send emails directly (for internal use)
 * This avoids HTTP calls between server-side routes
 */
import nodemailer from 'nodemailer';

export interface SendEmailParams {
    accessToken: string;
    refreshToken: string;
    userEmail: string;
    userName?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{ filename: string; path: string }>;
}

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
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        if (!process.env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Server configuration error: Missing GOOGLE_CLIENT_SECRET');
        }

        if (!to || !subject || (!html && !text)) {
            throw new Error('Missing required fields: to, subject, and html or text');
        }

        // Configurar transporter con OAuth2
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: userEmail,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        } as nodemailer.TransportOptions);

        // Enviar correo
        const toArray = Array.isArray(to) ? to : [to];
        const info = await transporter.sendMail({
            from: userName ? `"${userName}" <${userEmail}>` : userEmail,
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
