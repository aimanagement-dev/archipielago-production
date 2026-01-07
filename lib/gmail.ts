/**
 * Helper para enviar emails usando Gmail API directamente
 * Esto permite enviar desde ai.management@archipielagofilm.com sin depender de las credenciales del usuario logueado
 */
import { google, gmail_v1 } from 'googleapis';

export interface SendEmailViaGmailParams {
  accessToken: string;
  refreshToken: string;
  fromEmail: string;
  fromName?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
}

/**
 * Construye un mensaje RFC 2822 para Gmail API
 */
function buildMessage(params: SendEmailViaGmailParams): string {
  const toArray = Array.isArray(params.to) ? params.to : [params.to];
  const fromName = params.fromName || 'Archipiélago Production OS';
  
  // Headers básicos
  const headers = [
    `From: "${fromName}" <${params.fromEmail}>`,
    `To: ${toArray.join(', ')}`,
    `Subject: ${params.subject}`,
    `Content-Type: multipart/alternative; boundary="boundary123"`,
    `MIME-Version: 1.0`,
  ];

  // Body del mensaje
  const parts: string[] = [];
  
  // Parte de texto plano
  if (params.text) {
    parts.push(
      `--boundary123`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      params.text
    );
  }
  
  // Parte HTML
  if (params.html) {
    parts.push(
      `--boundary123`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      params.html
    );
  }
  
  // Attachments si existen
  if (params.attachments && params.attachments.length > 0) {
    params.attachments.forEach(att => {
      parts.push(
        `--boundary123`,
        `Content-Type: ${att.contentType || 'application/octet-stream'}`,
        `Content-Disposition: attachment; filename="${att.filename}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        att.content
      );
    });
  }
  
  parts.push(`--boundary123--`);
  
  const message = [
    headers.join('\r\n'),
    '',
    parts.join('\r\n'),
  ].join('\r\n');
  
  // Codificar en base64url (Gmail API requiere base64url, no base64)
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Envía un email usando Gmail API
 */
export async function sendEmailViaGmail(
  params: SendEmailViaGmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!params.accessToken) {
      throw new Error('Access token is required');
    }

    if (!params.to || !params.subject || (!params.html && !params.text)) {
      throw new Error('Missing required fields: to, subject, and html or text');
    }

    // Crear cliente de Gmail
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth });

    // Construir mensaje
    const rawMessage = buildMessage(params);

    // Enviar email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    const messageId = response.data.id;
    console.log(`[sendEmailViaGmail] Email sent successfully. Message ID: ${messageId}`);
    
    return {
      success: true,
      messageId: messageId || undefined,
    };
  } catch (error: any) {
    console.error('[sendEmailViaGmail] Error sending email:', error);
    
    // Mejorar mensajes de error
    let errorMessage = error.message || 'Unknown error sending email';
    
    if (error.response?.data?.error) {
      const gmailError = error.response.data.error;
      if (gmailError === 'invalid_grant') {
        errorMessage = 'Las credenciales OAuth han expirado. Por favor inicia sesión nuevamente.';
      } else if (gmailError === 'insufficient_permissions') {
        errorMessage = 'No tienes permisos para enviar emails desde esta cuenta.';
      } else {
        errorMessage = `Error de Gmail API: ${gmailError}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
