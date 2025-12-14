import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  id: string | null;
  error: string | null;
}

export interface BulkEmailResult {
  email: string;
  success: boolean;
  id?: string;
}

export interface BulkEmailResponse {
  results: BulkEmailResult[];
  errors: Array<{ email: string; error: string }>;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const from = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
    
    const result = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    return {
      success: true,
      id: result.data?.id || null,
      error: null,
    };
  } catch (error) {
    console.error('Resend email error:', error);
    return {
      success: false,
      id: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendBulkEmails(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  html: string,
  batchSize: number = 100
): Promise<BulkEmailResponse> {
  const results: BulkEmailResult[] = [];
  const errors: Array<{ email: string; error: string }> = [];

  // Resend allows up to 100 recipients per batch
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const emails = batch.map(r => r.email);

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
        to: emails,
        subject,
        html,
      });

      batch.forEach((recipient) => {
        results.push({
          email: recipient.email,
          success: true,
          id: result.data?.id,
        });
      });
    } catch (error) {
      batch.forEach((recipient) => {
        errors.push({
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { results, errors };
}

