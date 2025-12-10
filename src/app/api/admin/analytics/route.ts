/**
 * Agency Admin Usage Analytics API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/analytics)
 *
 * GET - Fetch usage analytics with date range filter
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { AIB_ERROR_CODES, type AiBuddyErrorCode } from '@/lib/ai-buddy/errors';
import { getDateRange } from '@/lib/ai-buddy/date-utils';
import type {
  UsageAnalyticsResponse,
  UsageSummary,
  UserUsageStats,
  UsageTrend,
  AnalyticsPeriod,
} from '@/types/ai-buddy';

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
 * Calculate comparison period (previous period of same length)
 */
function getComparisonRange(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
  const periodLength = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const compEnd = new Date(startDate);
  compEnd.setDate(compEnd.getDate() - 1);
  compEnd.setHours(23, 59, 59, 999);

  const compStart = new Date(compEnd);
  compStart.setDate(compStart.getDate() - periodLength + 1);
  compStart.setHours(0, 0, 0, 0);

  return { startDate: compStart, endDate: compEnd };
}

/**
 * Calculate percentage change
 */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * GET /api/admin/analytics
 * Fetch usage analytics with optional date range filter
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

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

    // Calculate date ranges
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);
    const comparisonPeriod = getComparisonRange(startDate, endDate);

    const serviceClient = createServiceClient();
    const agencyId = currentUser.agency_id;

    // NOTE: Materialized view refresh is handled by a scheduled cron job (not on every request)
    // to maintain <500ms response times. The refresh_ai_buddy_usage_daily() function
    // should be called via Supabase pg_cron or external scheduler (e.g., daily at midnight).

    // ===== CURRENT PERIOD SUMMARY =====
    const { data: currentSummaryData } = await serviceClient
      .from('ai_buddy_usage_daily')
      .select('active_users, conversations, total_messages, documents_uploaded')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    // Aggregate current period
    const currentTotals = (currentSummaryData || []).reduce(
      (acc, row) => ({
        activeUsers: acc.activeUsers + (row.active_users || 0),
        conversations: acc.conversations + (row.conversations || 0),
        messages: acc.messages + (row.total_messages || 0),
        documents: acc.documents + (row.documents_uploaded || 0),
      }),
      { activeUsers: 0, conversations: 0, messages: 0, documents: 0 }
    );

    // Get unique active users count (not sum)
    const { data: uniqueUsersData } = await serviceClient
      .from('ai_buddy_conversations')
      .select('user_id')
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const uniqueActiveUsers = new Set(uniqueUsersData?.map((u) => u.user_id)).size;

    // ===== COMPARISON PERIOD SUMMARY =====
    const { data: compSummaryData } = await serviceClient
      .from('ai_buddy_usage_daily')
      .select('active_users, conversations, total_messages, documents_uploaded')
      .eq('agency_id', agencyId)
      .gte('date', comparisonPeriod.startDate.toISOString().split('T')[0])
      .lte('date', comparisonPeriod.endDate.toISOString().split('T')[0]);

    const compTotals = (compSummaryData || []).reduce(
      (acc, row) => ({
        activeUsers: acc.activeUsers + (row.active_users || 0),
        conversations: acc.conversations + (row.conversations || 0),
        messages: acc.messages + (row.total_messages || 0),
        documents: acc.documents + (row.documents_uploaded || 0),
      }),
      { activeUsers: 0, conversations: 0, messages: 0, documents: 0 }
    );

    // Get unique comparison users
    const { data: compUsersData } = await serviceClient
      .from('ai_buddy_conversations')
      .select('user_id')
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .gte('created_at', comparisonPeriod.startDate.toISOString())
      .lte('created_at', comparisonPeriod.endDate.toISOString());

    const compUniqueActiveUsers = new Set(compUsersData?.map((u) => u.user_id)).size;

    const summary: UsageSummary = {
      totalConversations: currentTotals.conversations,
      activeUsers: uniqueActiveUsers,
      documentsUploaded: currentTotals.documents,
      messagesSent: currentTotals.messages,
      comparisonPeriod: {
        conversations: percentChange(currentTotals.conversations, compTotals.conversations),
        users: percentChange(uniqueActiveUsers, compUniqueActiveUsers),
        documents: percentChange(currentTotals.documents, compTotals.documents),
        messages: percentChange(currentTotals.messages, compTotals.messages),
      },
    };

    // ===== PER-USER BREAKDOWN =====
    const { data: userBreakdownData } = await serviceClient
      .from('ai_buddy_usage_by_user')
      .select('user_id, user_email, user_name, conversations, messages, documents, last_active_at')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    // Aggregate by user (the view is per-day, we need totals)
    // Filter out rows with null user_id (shouldn't happen, but types allow it)
    const userMap = new Map<string, UserUsageStats>();
    (userBreakdownData || [])
      .filter((row): row is typeof row & { user_id: string } => row.user_id !== null)
      .forEach((row) => {
        const existing = userMap.get(row.user_id);
        if (existing) {
          existing.conversations += row.conversations || 0;
          existing.messages += row.messages || 0;
          existing.documents += row.documents || 0;
          if (row.last_active_at && (!existing.lastActiveAt || row.last_active_at > existing.lastActiveAt)) {
            existing.lastActiveAt = row.last_active_at;
          }
        } else {
          userMap.set(row.user_id, {
            userId: row.user_id,
            userName: row.user_name,
            userEmail: row.user_email,
            conversations: row.conversations || 0,
            messages: row.messages || 0,
            documents: row.documents || 0,
            lastActiveAt: row.last_active_at,
          });
        }
      });

    const byUser: UserUsageStats[] = Array.from(userMap.values()).sort(
      (a, b) => b.conversations - a.conversations
    );

    // ===== TREND DATA =====
    const { data: trendData } = await serviceClient
      .from('ai_buddy_usage_daily')
      .select('date, active_users, conversations, total_messages')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Fill in missing dates with zeros
    // Filter out rows with null date (shouldn't happen, but types allow it)
    const trends: UsageTrend[] = [];
    const dateMap = new Map<string, UsageTrend>();
    (trendData || [])
      .filter((row): row is typeof row & { date: string } => row.date !== null)
      .forEach((row) => {
        dateMap.set(row.date, {
          date: row.date,
          activeUsers: row.active_users || 0,
          conversations: row.conversations || 0,
          messages: row.total_messages || 0,
        });
      });

    // Generate all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0] as string;
      trends.push(
        dateMap.get(dateStr) || {
          date: dateStr,
          activeUsers: 0,
          conversations: 0,
          messages: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const response: UsageAnalyticsResponse = {
      summary,
      byUser,
      trends,
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 500) {
      console.warn(`Analytics API took ${duration}ms (target: <500ms)`);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
