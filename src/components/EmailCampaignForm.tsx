'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { EmailCampaign, EventRegistration } from '@/types/db';
import { generatePreEventEmail, generateFollowUpEmail } from '@/lib/email/templates';
import { toast } from 'sonner';

interface EmailCampaignFormProps {
  campaign?: EmailCampaign | null;
  registrations: EventRegistration[];
  onSave: (campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export default function EmailCampaignForm({
  campaign,
  registrations,
  onSave,
  onCancel,
}: EmailCampaignFormProps) {
  const [name, setName] = useState(campaign?.name || '');
  const [type, setType] = useState<'pre-event' | 'follow-up'>(campaign?.type || 'pre-event');
  const [subject, setSubject] = useState(campaign?.subject || '');
  const [htmlContent, setHtmlContent] = useState(campaign?.html_content || '');
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Generate template when type changes
  useEffect(() => {
    if (!campaign && type === 'pre-event' && !htmlContent) {
      const template = generatePreEventEmail({
        recipientName: '{{recipientName}}',
        eventName: '{{eventName}}',
        eventDate: '{{eventDate}}',
        eventTime: '{{eventTime}}',
        zoomLink: '{{zoomLink}}',
      });
      setHtmlContent(template);
      setSubject(subject || 'Event Information: {{eventName}}');
    } else if (!campaign && type === 'follow-up' && !htmlContent) {
      const template = generateFollowUpEmail({
        recipientName: '{{recipientName}}',
        eventName: '{{eventName}}',
        registrationLink: '{{registrationLink}}',
      });
      setHtmlContent(template);
      setSubject(subject || 'Thank You for Attending: {{eventName}}');
    }
  }, [type, campaign, htmlContent, subject]);

  const handleSelectAll = () => {
    const allIds = new Set(registrations.map(r => r.id));
    setSelectedRecipients(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedRecipients(new Set());
  };

  const handleToggleRecipient = (id: string) => {
    const newSet = new Set(selectedRecipients);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRecipients(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!subject.trim()) {
      toast.error('Email subject is required');
      return;
    }

    if (!htmlContent.trim()) {
      toast.error('Email content is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        subject: subject.trim(),
        html_content: htmlContent.trim(),
        status: campaign?.status || 'draft',
        scheduled_at: null,
        sent_at: campaign?.sent_at || null,
        created_by: campaign?.created_by || null,
      });
      toast.success('Campaign saved successfully');
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as 'pre-event' | 'follow-up')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!!campaign}
        >
          <option value="pre-event">Pre-Event</option>
          <option value="follow-up">Follow-Up</option>
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Email Subject
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="htmlContent" className="block text-sm font-medium text-gray-700 mb-1">
          Email Content (HTML)
        </label>
        <textarea
          id="htmlContent"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          You can use variables like {'{{recipientName}}'}, {'{{eventName}}'}, {'{{zoomLink}}'}, etc.
        </p>
      </div>

      {!campaign && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Recipients ({selectedRecipients.size} selected)
            </label>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </div>
          </div>
          <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
            {registrations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">
                No registrations available. Import registrations first.
              </p>
            ) : (
              <div className="divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <label
                    key={registration.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.has(registration.id)}
                      onChange={() => handleToggleRecipient(registration.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{registration.name}</p>
                      <p className="text-xs text-gray-500">{registration.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}


