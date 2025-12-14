'use client';

import React from 'react';
import { Button } from './ui/button';
import { EmailCampaign } from '@/types/db';
import { formatCampaignStatus } from '@/lib/email/campaign';

interface EmailCampaignListProps {
  campaigns: Array<EmailCampaign & { stats?: { total: number; sent: number; failed: number; pending: number; bounced: number } }>;
  onView: (campaign: EmailCampaign) => void;
  onEdit?: (campaign: EmailCampaign) => void;
  onSend?: (campaign: EmailCampaign) => void;
  onDuplicate?: (campaign: EmailCampaign) => void;
}

export default function EmailCampaignList({
  campaigns,
  onView,
  onEdit,
  onSend,
  onDuplicate,
}: EmailCampaignListProps) {
  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new email campaign.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {formatCampaignStatus(campaign.status)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Type: {campaign.type === 'pre-event' ? 'Pre-Event' : 'Follow-Up'}</span>
                {campaign.stats && (
                  <>
                    <span>Total: {campaign.stats.total}</span>
                    <span className="text-green-600">Sent: {campaign.stats.sent}</span>
                    {campaign.stats.failed > 0 && (
                      <span className="text-red-600">Failed: {campaign.stats.failed}</span>
                    )}
                  </>
                )}
                {campaign.sent_at && (
                  <span>Sent: {new Date(campaign.sent_at).toLocaleDateString()}</span>
                )}
                <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(campaign)}
              >
                View
              </Button>
              {onEdit && campaign.status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(campaign)}
                >
                  Edit
                </Button>
              )}
              {onSend && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onSend(campaign)}
                >
                  Send
                </Button>
              )}
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(campaign)}
                >
                  Duplicate
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

