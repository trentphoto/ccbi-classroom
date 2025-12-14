import { getBrandConfig } from '@/lib/brand';

export interface EventEmailData {
  recipientName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  zoomLink: string;
  additionalInfo?: string;
}

export interface FollowUpEmailData {
  recipientName: string;
  eventName: string;
  registrationLink: string;
  classInfo?: string;
}

export function generatePreEventEmail(data: EventEmailData): string {
  const brand = getBrandConfig();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: ${brand.primaryColor}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">${brand.name}</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2>Hello ${data.recipientName},</h2>
        
        <p>We&apos;re excited to have you join us for our <strong>${data.eventName}</strong>!</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${brand.primaryColor}; margin-top: 0;">Event Details</h3>
          <p><strong>Date:</strong> ${data.eventDate}</p>
          <p><strong>Time:</strong> ${data.eventTime}</p>
          <p><strong>Zoom Link:</strong> <a href="${data.zoomLink}" style="color: ${brand.primaryColor};">Join Meeting</a></p>
          ${data.additionalInfo ? `<p>${data.additionalInfo}</p>` : ''}
        </div>
        
        <p>We look forward to seeing you there!</p>
        
        <p>Best regards,<br>${brand.name} Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>${brand.fullName}</p>
        <p>Questions? Contact us at ${brand.supportEmail}</p>
      </div>
    </body>
    </html>
  `;
}

export function generateFollowUpEmail(data: FollowUpEmailData): string {
  const brand = getBrandConfig();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: ${brand.primaryColor}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">${brand.name}</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        <h2>Thank You, ${data.recipientName}!</h2>
        
        <p>Thank you for attending our <strong>${data.eventName}</strong>. We hope you enjoyed it!</p>
        
        ${data.classInfo ? `<p>${data.classInfo}</p>` : ''}
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <a href="${data.registrationLink}" 
             style="display: inline-block; background-color: ${brand.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Register for Class
          </a>
        </div>
        
        <p>If you have any questions, please don&apos;t hesitate to reach out.</p>
        
        <p>Best regards,<br>${brand.name} Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>${brand.fullName}</p>
        <p>Questions? Contact us at ${brand.supportEmail}</p>
      </div>
    </body>
    </html>
  `;
}

// Template variable replacement function
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}


