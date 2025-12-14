'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/supabase/database';
import { EmailCampaign, EmailSend, EventRegistration } from '@/types/db';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { calculateCampaignStats, canSendCampaign } from '@/lib/email/campaign';

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignData, sendsData, registrationsData] = await Promise.all([
          db.getEmailCampaignById(campaignId),
          db.getEmailSendsByCampaign(campaignId),
          db.getEventRegistrations(),
        ]);

        setCampaign(campaignData);
        setSends(sendsData);
        setRegistrations(registrationsData);
      } catch (error) {
        console.error('Error loading campaign data:', error);
        toast.error('Failed to load campaign data');
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignId) {
      loadData();
    }
  }, [campaignId]);

  const handleSendCampaign = async () => {
    if (!campaign) return;

    const check = canSendCampaign(campaign);
    if (!check.canSend) {
      toast.error(check.reason || 'Cannot send campaign');
      return;
    }

    // Get recipients - if no sends exist yet, use all registrations
    let recipients: Array<{ email: string; recipientId: string; name: string }>;
    
    if (sends.length === 0) {
      // No sends yet, use all registrations
      recipients = registrations.map(r => ({
        email: r.email,
        recipientId: r.id,
        name: r.name,
      }));
    } else {
      // Use existing sends
      const recipientIds = sends.map(s => s.recipient_id);
      recipients = registrations
        .filter(r => recipientIds.includes(r.id))
        .map(r => ({
          email: r.email,
          recipientId: r.id,
          name: r.name,
        }));
    }

    if (recipients.length === 0) {
      toast.error('No recipients available. Please import registrations first.');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          type: campaign.type,
          recipients,
          template: campaign.html_content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send campaign');
      }

      toast.success('Campaign sent successfully');
      
      // Reload data
      const [campaignData, sendsData] = await Promise.all([
        db.getEmailCampaignById(campaignId),
        db.getEmailSendsByCampaign(campaignId),
      ]);
      setCampaign(campaignData);
      setSends(sendsData);
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <Button onClick={() => router.push('/admin/email-campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const stats = calculateCampaignStats(sends);
  const recipientMap = new Map(registrations.map(r => [r.id, r]));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/email-campaigns')}
          className="mb-4"
        >
          ← Back to Campaigns
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
        <p className="text-gray-600">Campaign details and send status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <p className="text-2xl font-semibold text-gray-900">{campaign.status}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Recipients</h3>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sent</h3>
          <p className="text-2xl font-semibold text-green-600">{stats.sent}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Campaign Information</h2>
          {canSendCampaign(campaign).canSend && (
            <Button
              onClick={handleSendCampaign}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? 'Sending...' : 'Send Campaign'}
            </Button>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{campaign.type === 'pre-event' ? 'Pre-Event' : 'Follow-Up'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Subject</dt>
            <dd className="mt-1 text-sm text-gray-900">{campaign.subject}</dd>
          </div>
          {campaign.sent_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Sent At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(campaign.sent_at).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Status</h2>
        {sends.length === 0 ? (
          <p className="text-gray-500">No sends recorded for this campaign.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sends.map((send) => {
                  const recipient = recipientMap.get(send.recipient_id);
                  return (
                    <tr key={send.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {recipient?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {send.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          send.status === 'sent' ? 'bg-green-100 text-green-800' :
                          send.status === 'failed' ? 'bg-red-100 text-red-800' :
                          send.status === 'bounced' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {send.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {send.sent_at ? new Date(send.sent_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {send.error_message || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

