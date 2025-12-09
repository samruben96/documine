/**
 * Guardrail Enforcement Logs API Route
 * Story 19.2: Enforcement Logging
 *
 * GET - Retrieve guardrail enforcement audit logs
 *
 * Requires admin authentication with 'view_audit_logs' permission.
 *
 * AC-19.2.2: Returns log entries with userId, conversationId, triggeredTopic, messagePreview, redirectApplied, timestamp
 * AC-19.2.4: Returns data for table display
 * AC-19.2.6: Supports date range filtering
 * AC-19.2.7: Logs are read-only (append-only enforced by RLS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import type { GuardrailEnforcementEvent, GuardrailEnforcementLogsResponse } from '@/types/ai-buddy';

/**
 * GET /api/ai-buddy/admin/guardrails/logs
 *
 * Query Parameters:
 * - startDate: ISO date string for start of range
 * - endDate: ISO date string for end of range
 * - limit: Maximum number of records (default 50)
 * - offset: Offset for pagination (default 0)
 *
 * Returns:
 * - logs: Array of GuardrailEnforcementEvent
 * - total: Total count matching filters
 * - hasMore: Boolean indicating if more records exist
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check admin authentication with view_audit_logs permission
  const auth = await requireAdminAuth('view_audit_logs');
  if (!auth.success) {
    return NextResponse.json(
      { data: null, error: { code: auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', message: auth.error } },
      { status: auth.status }
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  const limit = limitStr ? Math.min(parseInt(limitStr, 10), 100) : 50;
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

  // Validate dates if provided
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateStr) {
    startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid startDate format' } },
        { status: 400 }
      );
    }
  }

  if (endDateStr) {
    endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid endDate format' } },
        { status: 400 }
      );
    }
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
  }

  const supabase = await createClient();

  // Build query for guardrail_triggered events
  let query = supabase
    .from('ai_buddy_audit_logs')
    .select('*, users!inner(email)', { count: 'exact' })
    .eq('agency_id', auth.agencyId)
    .eq('action', 'guardrail_triggered')
    .order('logged_at', { ascending: false });

  // Apply date filters
  if (startDate) {
    query = query.gte('logged_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('logged_at', endDate.toISOString());
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to query guardrail logs:', error);
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve logs' } },
      { status: 500 }
    );
  }

  // Map database rows to GuardrailEnforcementEvent
  const logs: GuardrailEnforcementEvent[] = (data ?? []).map((row) => {
    const metadata = row.metadata as Record<string, unknown> | null;

    return {
      id: row.id,
      agencyId: row.agency_id,
      userId: row.user_id,
      userEmail: row.users?.email ?? 'Unknown',
      conversationId: row.conversation_id,
      triggeredTopic: (metadata?.triggeredTopic as string) ?? 'Unknown',
      messagePreview: (metadata?.messagePreview as string) ?? '',
      redirectApplied: (metadata?.redirectMessage as string) ?? '',
      loggedAt: row.logged_at,
    };
  });

  const total = count ?? 0;
  const hasMore = offset + logs.length < total;

  const response: GuardrailEnforcementLogsResponse = {
    logs,
    total,
    hasMore,
  };

  return NextResponse.json({ data: response, error: null });
}
