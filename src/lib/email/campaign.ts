import { EmailCampaign, EmailSend } from '@/types/db';

export interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  bounced: number;
}

export interface CreateCampaignData {
  name: string;
  type: 'pre-event' | 'follow-up';
  subject: string;
  html_content: string;
  scheduled_at?: Date | null;
  created_by?: string | null;
}

export interface UpdateCampaignData {
  name?: string;
  subject?: string;
  html_content?: string;
  status?: EmailCampaign['status'];
  scheduled_at?: Date | null;
  sent_at?: Date | null;
}

/**
 * Calculate campaign statistics from email sends
 */
export function calculateCampaignStats(sends: EmailSend[]): CampaignStats {
  return {
    total: sends.length,
    sent: sends.filter(s => s.status === 'sent').length,
    failed: sends.filter(s => s.status === 'failed').length,
    pending: sends.filter(s => s.status === 'pending').length,
    bounced: sends.filter(s => s.status === 'bounced').length,
  };
}

/**
 * Validate campaign data before creation
 */
export function validateCampaignData(data: CreateCampaignData): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Campaign name is required' };
  }
  
  if (!data.subject || data.subject.trim().length === 0) {
    return { valid: false, error: 'Email subject is required' };
  }
  
  if (!data.html_content || data.html_content.trim().length === 0) {
    return { valid: false, error: 'Email content is required' };
  }
  
  if (!['pre-event', 'follow-up'].includes(data.type)) {
    return { valid: false, error: 'Invalid campaign type' };
  }
  
  return { valid: true };
}

/**
 * Format campaign status for display
 */
export function formatCampaignStatus(status: EmailCampaign['status']): string {
  const statusMap: Record<EmailCampaign['status'], string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    sending: 'Sending',
    completed: 'Completed',
    failed: 'Failed',
  };
  return statusMap[status] || status;
}

/**
 * Check if campaign can be sent
 */
export function canSendCampaign(campaign: EmailCampaign): { canSend: boolean; reason?: string } {
  if (campaign.status === 'sending') {
    return { canSend: false, reason: 'Campaign is currently being sent' };
  }
  
  if (campaign.status === 'completed') {
    return { canSend: false, reason: 'Campaign has already been completed' };
  }
  
  if (campaign.status === 'scheduled' && campaign.scheduled_at) {
    const scheduledDate = new Date(campaign.scheduled_at);
    if (scheduledDate > new Date()) {
      return { canSend: false, reason: 'Campaign is scheduled for a future date' };
    }
  }
  
  return { canSend: true };
}


