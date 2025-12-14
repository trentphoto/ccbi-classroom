import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/database';
import { validateCampaignData } from '@/lib/email/campaign';

export async function GET() {
  try {
    const campaigns = await db.getEmailCampaigns();
    
    // Get stats for each campaign
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const stats = await db.getCampaignStats(campaign.id);
        return { ...campaign, stats };
      })
    );

    return NextResponse.json({ campaigns: campaignsWithStats });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, subject, html_content, scheduled_at, created_by } = body;

    const campaignData = {
      name,
      type,
      subject,
      html_content,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      created_by: created_by || null,
      status: 'draft' as const,
      sent_at: null,
    };

    // Validate campaign data
    const validation = validateCampaignData(campaignData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const campaign = await db.createEmailCampaign(campaignData);

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

