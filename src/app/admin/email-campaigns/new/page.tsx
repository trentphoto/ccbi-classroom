'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase/database';
import { EventRegistration, EmailCampaign } from '@/types/db';
import EmailCampaignForm from '@/components/EmailCampaignForm';
import { toast } from 'sonner';

export default function NewCampaignPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const data = await db.getEventRegistrations();
        setRegistrations(data);
      } catch (error) {
        console.error('Error loading registrations:', error);
        toast.error('Failed to load registrations');
      } finally {
        setIsLoading(false);
      }
    };
    loadRegistrations();
  }, []);

  const handleSave = async (campaignData: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      toast.success('Campaign created successfully');
      router.push('/admin/email-campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/email-campaigns');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Email Campaign</h1>
        <p className="text-gray-600">Create a new email campaign for event registrants</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EmailCampaignForm
          registrations={registrations}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}


