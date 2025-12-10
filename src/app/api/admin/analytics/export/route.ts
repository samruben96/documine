/**
 * Agency Admin Usage Analytics Export API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/analytics/export)
 *
 * GET - Export usage data as CSV file
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

    // Fetch per-user breakdown data
    const { data: usageData, error: usageError } = await serviceClient
      .from('ai_buddy_usage_by_user')
      .select('date, user_email, user_name, conversations, messages, documents')
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

    // Generate CSV content
    const headers = ['Date', 'User Email', 'User Name', 'Conversations', 'Messages', 'Documents'];
    const csvRows = [headers.join(',')];

    (usageData || []).forEach((row) => {
      csvRows.push(
        [
          escapeCsvField(row.date),
          escapeCsvField(row.user_email),
          escapeCsvField(row.user_name),
          escapeCsvField(row.conversations),
          escapeCsvField(row.messages),
          escapeCsvField(row.documents),
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
