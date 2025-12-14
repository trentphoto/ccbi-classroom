import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/database';
import { parseEventRegistrationsCSV } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source = (formData.get('source') as string) || 'google_sheets';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    // Parse CSV
    const parsingResult = await parseEventRegistrationsCSV(file, source);

    if (parsingResult.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'CSV parsing errors', 
          errors: parsingResult.errors,
          warnings: parsingResult.warnings 
        },
        { status: 400 }
      );
    }

    // Check for existing registrations by email to avoid duplicates
    const existingRegistrations = await db.getEventRegistrations();
    const existingEmails = new Set(existingRegistrations.map(r => r.email.toLowerCase()));

    const newRegistrations = parsingResult.registrations.filter(
      r => r.email && !existingEmails.has(r.email.toLowerCase())
    );

    const duplicateCount = parsingResult.registrations.length - newRegistrations.length;

    // Bulk insert new registrations
    let insertedCount = 0;
    if (newRegistrations.length > 0) {
      try {
        await db.bulkCreateEventRegistrations(newRegistrations);
        insertedCount = newRegistrations.length;
      } catch (error) {
        console.error('Error inserting registrations:', error);
        return NextResponse.json(
          { 
            error: 'Failed to insert registrations',
            details: error instanceof Error ? error.message : 'Unknown error',
            warnings: parsingResult.warnings 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      duplicates: duplicateCount,
      total: parsingResult.registrations.length,
      warnings: parsingResult.warnings,
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const registrations = await db.getEventRegistrations();
    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

