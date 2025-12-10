/**
 * Agency Admin Usage Analytics Export API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/analytics/export)
 * Story 21.5: Extended for multi-feature usage export
 *
 * GET - Export usage data as CSV file
 * Includes: AI Buddy, Documents, Comparisons, One-Pagers, Document Chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { AIB_ERROR_CODES, type AiBuddyErrorCode } from '@/lib/ai-buddy/errors';
import { getDateRange } from '@/lib/ai-buddy/date-utils';
import type { AnalyticsPeriod } from '@/types/ai-buddy';

/**
 * Helper to create error response with proper status
 */
function errorResponse(code: AiBuddyErrorCode, customMessage?: string) {
  const { status, message } = AIB_ERROR_CODES[code];
  return NextResponse.json(
    { error: customMessage || message, code },
    { status }
  );
}

/**
 * Escape CSV field if it contains special characters
 */
function escapeCsvField(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/admin/analytics/export
 * Export usage data as CSV file
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's agency
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, agency_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check view_usage_analytics permission from agency_permissions
    const { data: permissions } = await supabase
      .from('agency_permissions')
      .select('permission')
      .eq('user_id', authUser.id);

    const hasPermission = permissions?.some(
      (p) => p.permission === 'view_usage_analytics'
    );

    if (!hasPermission) {
      return errorResponse('AIB_002', 'view_usage_analytics permission required');
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || '30days') as AnalyticsPeriod;
    const customStartDate = searchParams.get('startDate') || undefined;
    const customEndDate = searchParams.get('endDate') || undefined;

    // Calculate date range
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    const serviceClient = createServiceClient();
    const agencyId = currentUser.agency_id;

    // Get agency name for filename
    const { data: agency } = await serviceClient
      .from('agencies')
      .select('name')
      .eq('id', agencyId)
      .single();

    const agencyName = agency?.name || 'agency';

    // Fetch per-user breakdown data from AI Buddy view
    const { data: usageData, error: usageError } = await serviceClient
      .from('ai_buddy_usage_by_user')
      .select('date, user_id, user_email, user_name, conversations, messages, documents')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('user_email', { ascending: true });

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      );
    }

    // Story 21.5: Fetch comparisons per user per day
    const { data: comparisonsData } = await serviceClient
      .from('comparisons')
      .select('user_id, created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Group comparisons by user + date
    const comparisonsByUserDay = new Map<string, number>();
    (comparisonsData || []).forEach((row) => {
      if (row.user_id && row.created_at) {
        const dateStr = row.created_at.split('T')[0] as string;
        const key = `${row.user_id}|${dateStr}`;
        comparisonsByUserDay.set(key, (comparisonsByUserDay.get(key) || 0) + 1);
      }
    });

    // Story 21.5: Fetch one-pagers per user per day
    const { data: onePagerData } = await serviceClient
      .from('agency_audit_logs')
      .select('user_id, logged_at')
      .eq('agency_id', agencyId)
      .eq('action', 'one_pager_generated')
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString());

    // Group one-pagers by user + date
    const onePagersByUserDay = new Map<string, number>();
    (onePagerData || []).forEach((row) => {
      if (row.user_id && row.logged_at) {
        const dateStr = row.logged_at.split('T')[0] as string;
        const key = `${row.user_id}|${dateStr}`;
        onePagersByUserDay.set(key, (onePagersByUserDay.get(key) || 0) + 1);
      }
    });

    // Story 21.5: Fetch document chats per user per day
    const { data: docChatData } = await serviceClient
      .from('conversations')
      .select('user_id, created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Group document chats by user + date
    const docChatsByUserDay = new Map<string, number>();
    (docChatData || []).forEach((row) => {
      if (row.user_id && row.created_at) {
        const dateStr = row.created_at.split('T')[0] as string;
        const key = `${row.user_id}|${dateStr}`;
        docChatsByUserDay.set(key, (docChatsByUserDay.get(key) || 0) + 1);
      }
    });

    // Story 21.5: Fetch documents per user per day
    const { data: docsData } = await serviceClient
      .from('documents')
      .select('uploaded_by, created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Group documents by user + date
    const docsByUserDay = new Map<string, number>();
    (docsData || []).forEach((row) => {
      if (row.uploaded_by && row.created_at) {
        const dateStr = row.created_at.split('T')[0] as string;
        const key = `${row.uploaded_by}|${dateStr}`;
        docsByUserDay.set(key, (docsByUserDay.get(key) || 0) + 1);
      }
    });

    // Generate CSV content with extended columns
    const headers = [
      'Date',
      'User Email',
      'User Name',
      'AI Buddy Conversations',
      'AI Buddy Messages',
      'Documents Uploaded',
      'Comparisons Created',
      'One-Pagers Generated',
      'Document Chat Sessions',
    ];
    const csvRows = [headers.join(',')];

    (usageData || []).forEach((row) => {
      const key = row.user_id ? `${row.user_id}|${row.date}` : '';
      csvRows.push(
        [
          escapeCsvField(row.date),
          escapeCsvField(row.user_email),
          escapeCsvField(row.user_name),
          escapeCsvField(row.conversations),
          escapeCsvField(row.messages),
          escapeCsvField(key ? docsByUserDay.get(key) || 0 : row.documents),
          escapeCsvField(key ? comparisonsByUserDay.get(key) || 0 : 0),
          escapeCsvField(key ? onePagersByUserDay.get(key) || 0 : 0),
          escapeCsvField(key ? docChatsByUserDay.get(key) || 0 : 0),
        ].join(',')
      );
    });

    // If no data, add a row indicating empty
    if (usageData?.length === 0) {
      csvRows.push('No data available for the selected date range');
    }

    const csvContent = csvRows.join('\n');

    // Generate filename with agency name and export date
    const exportDate = new Date().toISOString().split('T')[0];
    const sanitizedAgencyName = agencyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${sanitizedAgencyName}_usage_${exportDate}.csv`;

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
