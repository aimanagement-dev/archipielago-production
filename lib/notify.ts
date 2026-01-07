/**
 * Helper function to send emails directly (for internal use)
 * This avoids HTTP calls between server-side routes
 * Now uses Gmail API instead of SMTP
 */
import { sendEmailViaGmail } from './gmail';

export interface SendEmailParams {
    accessToken: string;
    refreshToken: string;
    userEmail?: string; // Opcional, si no se provee usa SYSTEM_EMAIL
    userName?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{ filename: string; content: string; contentType?: string }>; // Cambiado: ahora requiere content en base64
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

        // Validar que las credenciales correspondan a la cuenta desde la cual se envía
        // Si useSystemEmail=true, el userEmail debe ser SYSTEM_EMAIL
        if (useSystemEmail && userEmail && userEmail.toLowerCase() !== SYSTEM_EMAIL.toLowerCase()) {
            const errorMsg = `No puedes enviar desde ${SYSTEM_EMAIL} usando credenciales de ${userEmail}. `;
            const solutionMsg = `Para enviar desde ${SYSTEM_EMAIL}, debes usar las credenciales de esa cuenta específica.`;
            
            console.error(`[sendEmailDirect] Error: ${errorMsg}${solutionMsg}`);
            
            return {
                success: false,
                error: errorMsg + solutionMsg,
            };
        }

        // Usar Gmail API directamente
        const result = await sendEmailViaGmail({
            accessToken,
            refreshToken,
            fromEmail: senderEmail,
            fromName: senderName,
            to: Array.isArray(to) ? to : to.split(',').map(e => e.trim()),
            subject,
            text,
            html,
            attachments,
        });

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Unknown error sending email',
            };
        }

        console.log(`[sendEmailDirect] Email sent successfully: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
    } catch (error: any) {
        console.error('[sendEmailDirect] Error sending email:', error);
        return {
            success: false,
            error: error.message || 'Unknown error sending email',
        };
    }
}
