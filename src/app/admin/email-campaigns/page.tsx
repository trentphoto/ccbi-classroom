'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/supabase/database';
import { EmailCampaign, EventRegistration } from '@/types/db';
import EmailCampaignList from '@/components/EmailCampaignList';
import EventRegistrationsDialog from '@/components/EventRegistrationsDialog';
import { toast } from 'sonner';

type TabType = 'campaigns' | 'registrations';

export default function EmailCampaignsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [campaigns, setCampaigns] = useState<Array<EmailCampaign & { stats?: { total: number; sent: number; failed: number; pending: number; bounced: number } }>>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      const campaignsData = await db.getEmailCampaigns();
      const campaignsWithStats = await Promise.all(
        campaignsData.map(async (campaign) => {
          const stats = await db.getCampaignStats(campaign.id);
          return { ...campaign, stats };
        })
      );
      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    try {
      const registrationsData = await db.getEventRegistrations();
      setRegistrations(registrationsData);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadCampaigns(), loadRegistrations()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadCampaigns, loadRegistrations]);

  const handleViewCampaign = (campaign: EmailCampaign) => {
    router.push(`/admin/email-campaigns/${campaign.id}`);
  };

  const handleCreateCampaign = () => {
    router.push('/admin/email-campaigns/new');
  };

  const handleImportComplete = () => {
    loadRegistrations();
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Campaigns</h1>
        <p className="text-gray-600">Manage email campaigns for event registrants</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'registrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Registrations ({registrations.length})
          </button>
        </nav>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Campaigns</h2>
            <Button
              onClick={handleCreateCampaign}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Campaign
            </Button>
          </div>
          <EmailCampaignList
            campaigns={campaigns}
            onView={handleViewCampaign}
          />
        </div>
      )}

      {/* Registrations Tab */}
      {activeTab === 'registrations' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Event Registrations</h2>
            <Button
              onClick={() => setImportDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Import from CSV
            </Button>
          </div>
          
          {registrations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by importing registrations from a CSV file.</p>
              <div className="mt-6">
                <Button
                  onClick={() => setImportDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Import from CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Signed Up for Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {registration.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.signed_up_for_class ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.source || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <EventRegistrationsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}


