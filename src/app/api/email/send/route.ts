import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendBulkEmails } from '@/lib/email/resend';
import { generatePreEventEmail, generateFollowUpEmail, replaceTemplateVariables } from '@/lib/email/templates';
import { db } from '@/lib/supabase/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, type, recipients, emailData, template } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      );
    }

    if (!['pre-event', 'follow-up'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid email type. Must be "pre-event" or "follow-up"' },
        { status: 400 }
      );
    }

    // Get campaign to verify it exists
    const campaign = await db.getEmailCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Use template from campaign or generate from type
    let html: string;
    let subject: string;

    if (template) {
      // Use provided template with variable replacement
      html = replaceTemplateVariables(template, emailData || {});
      subject = campaign.subject;
    } else if (type === 'pre-event') {
      html = generatePreEventEmail(emailData);
      subject = campaign.subject || `Event Information: ${emailData?.eventName || 'Upcoming Event'}`;
    } else if (type === 'follow-up') {
      html = generateFollowUpEmail(emailData);
      subject = campaign.subject || `Thank You for Attending: ${emailData?.eventName || 'Event'}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

    // Update campaign status to sending
    await db.updateCampaignStatus(campaignId, 'sending');

    // Create email send records
    const emailSends = recipients.map((recipient: { email: string; recipientId: string; name?: string }) => ({
      campaign_id: campaignId,
      recipient_id: recipient.recipientId,
      email: recipient.email,
      status: 'pending' as const,
      provider_id: null,
      error_message: null,
      sent_at: null,
      opened_at: null,
      clicked_at: null,
    }));

    await db.bulkCreateEmailSends(emailSends);

    // For bulk emails, use sendBulkEmails
    if (recipients.length > 1) {
      const result = await sendBulkEmails(
        recipients.map((r: { email: string; name?: string }) => ({ email: r.email, name: r.name })),
        subject,
        html
      );

      // Update email send records with results
      const sendRecords = await db.getEmailSendsByCampaign(campaignId);
      
      for (const resultItem of result.results) {
        const sendRecord = sendRecords.find(s => s.email === resultItem.email && s.status === 'pending');
        if (sendRecord) {
          await db.updateEmailSendStatus(
            sendRecord.id,
            'sent',
            resultItem.id || null,
            null,
            new Date()
          );
        }
      }

      for (const errorItem of result.errors) {
        const sendRecord = sendRecords.find(s => s.email === errorItem.email && s.status === 'pending');
        if (sendRecord) {
          await db.updateEmailSendStatus(
            sendRecord.id,
            'failed',
            null,
            errorItem.error,
            null
          );
        }
      }

      // Update campaign status
      const failedCount = result.errors.length;
      const finalStatus = failedCount === recipients.length ? 'failed' : 'completed';
      await db.updateCampaignStatus(campaignId, finalStatus, new Date());

      return NextResponse.json({
        success: true,
        sent: result.results.length,
        errors: result.errors.length,
        details: result,
      });
    } else {
      // Single email
      const recipient = recipients[0];
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html,
      });

      // Update email send record
      const sendRecords = await db.getEmailSendsByCampaign(campaignId);
      const sendRecord = sendRecords.find(s => s.email === recipient.email && s.status === 'pending');
      
      if (sendRecord) {
        await db.updateEmailSendStatus(
          sendRecord.id,
          result.success ? 'sent' : 'failed',
          result.id || null,
          result.error || null,
          result.success ? new Date() : null
        );
      }

      // Update campaign status
      const finalStatus = result.success ? 'completed' : 'failed';
      await db.updateCampaignStatus(campaignId, finalStatus, result.success ? new Date() : null);

      return NextResponse.json({
        success: result.success,
        id: result.id,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


