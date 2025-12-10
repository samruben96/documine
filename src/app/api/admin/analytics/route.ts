/**
 * Agency Admin Usage Analytics API
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/analytics)
 * Story 21.5: Extended for multi-feature usage tracking
 *
 * GET - Fetch usage analytics with date range filter
 * Tracks: AI Buddy, Documents, Comparisons, One-Pagers, Document Chat
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

    // Use service client to check permissions (bypasses RLS issues with auth.uid())
    const serviceClient = createServiceClient();

    // Check view_usage_analytics permission from agency_permissions
    const { data: permissions } = await serviceClient
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

    // serviceClient already initialized above for permission check
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

    // ===== STORY 21.5: MULTI-FEATURE USAGE - CURRENT PERIOD =====
    // Comparisons created
    const { data: currentComparisonsData } = await serviceClient
      .from('comparisons')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    const currentComparisons = currentComparisonsData?.length || 0;

    // One-pagers generated (from audit logs)
    const { data: currentOnePagerData } = await serviceClient
      .from('agency_audit_logs')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('action', 'one_pager_generated')
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString());
    const currentOnePagers = currentOnePagerData?.length || 0;

    // Document chat sessions (conversations table - distinct from ai_buddy_conversations)
    const { data: currentDocChatData } = await serviceClient
      .from('conversations')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    const currentDocChats = currentDocChatData?.length || 0;

    // Document uploads (directly from documents table for current period)
    const { data: currentDocsData } = await serviceClient
      .from('documents')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    const currentDocUploads = currentDocsData?.length || 0;

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

    // ===== STORY 21.5: MULTI-FEATURE USAGE - COMPARISON PERIOD =====
    // Comparisons created - comparison period
    const { data: compComparisonsData } = await serviceClient
      .from('comparisons')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('created_at', comparisonPeriod.startDate.toISOString())
      .lte('created_at', comparisonPeriod.endDate.toISOString());
    const compComparisons = compComparisonsData?.length || 0;

    // One-pagers generated - comparison period
    const { data: compOnePagerData } = await serviceClient
      .from('agency_audit_logs')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('action', 'one_pager_generated')
      .gte('logged_at', comparisonPeriod.startDate.toISOString())
      .lte('logged_at', comparisonPeriod.endDate.toISOString());
    const compOnePagers = compOnePagerData?.length || 0;

    // Document chat sessions - comparison period
    const { data: compDocChatData } = await serviceClient
      .from('conversations')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('created_at', comparisonPeriod.startDate.toISOString())
      .lte('created_at', comparisonPeriod.endDate.toISOString());
    const compDocChats = compDocChatData?.length || 0;

    // Document uploads - comparison period
    const { data: compDocsData } = await serviceClient
      .from('documents')
      .select('id')
      .eq('agency_id', agencyId)
      .gte('created_at', comparisonPeriod.startDate.toISOString())
      .lte('created_at', comparisonPeriod.endDate.toISOString());
    const compDocUploads = compDocsData?.length || 0;

    const summary: UsageSummary = {
      totalConversations: currentTotals.conversations,
      activeUsers: uniqueActiveUsers,
      documentsUploaded: currentDocUploads, // Use direct count instead of materialized view
      messagesSent: currentTotals.messages,
      comparisonsCreated: currentComparisons,
      onePagersGenerated: currentOnePagers,
      documentChatSessions: currentDocChats,
      comparisonPeriod: {
        conversations: percentChange(currentTotals.conversations, compTotals.conversations),
        users: percentChange(uniqueActiveUsers, compUniqueActiveUsers),
        documents: percentChange(currentDocUploads, compDocUploads),
        messages: percentChange(currentTotals.messages, compTotals.messages),
        comparisons: percentChange(currentComparisons, compComparisons),
        onePagers: percentChange(currentOnePagers, compOnePagers),
        documentChats: percentChange(currentDocChats, compDocChats),
      },
    };

    // ===== PER-USER BREAKDOWN =====
    const { data: userBreakdownData } = await serviceClient
      .from('ai_buddy_usage_by_user')
      .select('user_id, user_email, user_name, conversations, messages, documents, last_active_at')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    // Story 21.5: Get per-user comparisons
    const { data: userComparisonsData } = await serviceClient
      .from('comparisons')
      .select('user_id')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count comparisons per user
    const comparisonsByUser = new Map<string, number>();
    (userComparisonsData || []).forEach((row) => {
      if (row.user_id) {
        comparisonsByUser.set(row.user_id, (comparisonsByUser.get(row.user_id) || 0) + 1);
      }
    });

    // Story 21.5: Get per-user one-pagers
    const { data: userOnePagerData } = await serviceClient
      .from('agency_audit_logs')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('action', 'one_pager_generated')
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString());

    // Count one-pagers per user
    const onePagersByUser = new Map<string, number>();
    (userOnePagerData || []).forEach((row) => {
      if (row.user_id) {
        onePagersByUser.set(row.user_id, (onePagersByUser.get(row.user_id) || 0) + 1);
      }
    });

    // Story 21.5: Get per-user document chats
    const { data: userDocChatData } = await serviceClient
      .from('conversations')
      .select('user_id')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count document chats per user
    const docChatsByUser = new Map<string, number>();
    (userDocChatData || []).forEach((row) => {
      if (row.user_id) {
        docChatsByUser.set(row.user_id, (docChatsByUser.get(row.user_id) || 0) + 1);
      }
    });

    // Story 21.5: Get per-user document uploads
    const { data: userDocsData } = await serviceClient
      .from('documents')
      .select('uploaded_by')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count documents per user
    const docsByUser = new Map<string, number>();
    (userDocsData || []).forEach((row) => {
      if (row.uploaded_by) {
        docsByUser.set(row.uploaded_by, (docsByUser.get(row.uploaded_by) || 0) + 1);
      }
    });

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
          // Don't add documents from view, we'll use direct counts
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
            documents: 0, // Will be set from direct count
            comparisons: 0,
            onePagers: 0,
            documentChats: 0,
            lastActiveAt: row.last_active_at,
          });
        }
      });

    // Also include users who only have activity in other features (not AI Buddy)
    const allUserIds = new Set([
      ...Array.from(userMap.keys()),
      ...Array.from(comparisonsByUser.keys()),
      ...Array.from(onePagersByUser.keys()),
      ...Array.from(docChatsByUser.keys()),
      ...Array.from(docsByUser.keys()),
    ]);

    // Fetch user info for users not in AI Buddy view
    const missingUserIds = Array.from(allUserIds).filter((id) => !userMap.has(id));
    if (missingUserIds.length > 0) {
      const { data: missingUsers } = await serviceClient
        .from('users')
        .select('id, email, full_name')
        .in('id', missingUserIds);

      (missingUsers || []).forEach((user) => {
        userMap.set(user.id, {
          userId: user.id,
          userName: user.full_name,
          userEmail: user.email,
          conversations: 0,
          messages: 0,
          documents: 0,
          comparisons: 0,
          onePagers: 0,
          documentChats: 0,
          lastActiveAt: null,
        });
      });
    }

    // Merge multi-feature counts into user map
    userMap.forEach((user, userId) => {
      user.documents = docsByUser.get(userId) || 0;
      user.comparisons = comparisonsByUser.get(userId) || 0;
      user.onePagers = onePagersByUser.get(userId) || 0;
      user.documentChats = docChatsByUser.get(userId) || 0;
    });

    const byUser: UserUsageStats[] = Array.from(userMap.values()).sort(
      (a, b) => {
        // Sort by total activity (sum of all metrics)
        const aTotal = a.conversations + (a.comparisons || 0) + (a.onePagers || 0) + (a.documentChats || 0) + a.documents;
        const bTotal = b.conversations + (b.comparisons || 0) + (b.onePagers || 0) + (b.documentChats || 0) + b.documents;
        return bTotal - aTotal;
      }
    );

    // ===== TREND DATA =====
    const { data: trendData } = await serviceClient
      .from('ai_buddy_usage_daily')
      .select('date, active_users, conversations, total_messages')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Story 21.5: Get daily comparisons for trends
    const { data: trendComparisonsData } = await serviceClient
      .from('comparisons')
      .select('created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count comparisons per day
    const comparisonsByDay = new Map<string, number>();
    (trendComparisonsData || []).forEach((row) => {
      if (row.created_at) {
        const dateStr = row.created_at.split('T')[0] as string;
        comparisonsByDay.set(dateStr, (comparisonsByDay.get(dateStr) || 0) + 1);
      }
    });

    // Story 21.5: Get daily one-pagers for trends
    const { data: trendOnePagerData } = await serviceClient
      .from('agency_audit_logs')
      .select('logged_at')
      .eq('agency_id', agencyId)
      .eq('action', 'one_pager_generated')
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString());

    // Count one-pagers per day
    const onePagersByDay = new Map<string, number>();
    (trendOnePagerData || []).forEach((row) => {
      if (row.logged_at) {
        const dateStr = row.logged_at.split('T')[0] as string;
        onePagersByDay.set(dateStr, (onePagersByDay.get(dateStr) || 0) + 1);
      }
    });

    // Story 21.5: Get daily document chats for trends
    const { data: trendDocChatData } = await serviceClient
      .from('conversations')
      .select('created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count document chats per day
    const docChatsByDay = new Map<string, number>();
    (trendDocChatData || []).forEach((row) => {
      if (row.created_at) {
        const dateStr = row.created_at.split('T')[0] as string;
        docChatsByDay.set(dateStr, (docChatsByDay.get(dateStr) || 0) + 1);
      }
    });

    // Story 21.5: Get daily document uploads for trends
    const { data: trendDocsData } = await serviceClient
      .from('documents')
      .select('created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Count documents per day
    const docsByDay = new Map<string, number>();
    (trendDocsData || []).forEach((row) => {
      if (row.created_at) {
        const dateStr = row.created_at.split('T')[0] as string;
        docsByDay.set(dateStr, (docsByDay.get(dateStr) || 0) + 1);
      }
    });

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
          documents: 0, // Will be set from direct count
          comparisons: 0,
          onePagers: 0,
          documentChats: 0,
        });
      });

    // Generate all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0] as string;
      const existingData = dateMap.get(dateStr);
      trends.push({
        date: dateStr,
        activeUsers: existingData?.activeUsers || 0,
        conversations: existingData?.conversations || 0,
        messages: existingData?.messages || 0,
        documents: docsByDay.get(dateStr) || 0,
        comparisons: comparisonsByDay.get(dateStr) || 0,
        onePagers: onePagersByDay.get(dateStr) || 0,
        documentChats: docChatsByDay.get(dateStr) || 0,
      });
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
