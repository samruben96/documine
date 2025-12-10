/**
 * Agency Admin Audit Logs API Route
 * Story 21.2: API Route Migration (moved from ai-buddy/admin/audit-logs)
 *
 * GET /api/admin/audit-logs - Get agency audit logs with filters
 * Admin only - requires view_audit_logs permission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';

/**
 * Extended audit log entry with joined fields for table display
 */
export interface AuditLogTableEntry {
  id: string;
  agencyId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  conversationId: string | null;
  conversationTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  action: string;
  metadata: Record<string, unknown>;
  loggedAt: string;
  messageCount: number;
  guardrailEventCount: number;
}

/**
 * GET /api/admin/audit-logs
 * Get agency audit logs with filters
 *
 * Query params:
 * - userId: Filter by user
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - search: Keyword search
 * - hasGuardrailEvents: Filter to only entries with guardrail events (boolean)
 * - page: Page number (default 1)
 * - limit: Page size (default 25, max 100)
 *
 * Response:
 * {
 *   data: {
 *     entries: AuditLogTableEntry[];
 *     total: number;
 *     page: number;
 *     pageSize: number;
 *     totalPages: number;
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  // Check admin authentication with view_audit_logs permission
  const auth = await requireAdminAuth('view_audit_logs');
  if (!auth.success) {
    return NextResponse.json(
      { data: null, error: { code: auth.status === 401 ? 'AIB_001' : 'AIB_002', message: auth.error } },
      { status: auth.status }
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || undefined;
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const search = searchParams.get('search') || undefined;
  const hasGuardrailEventsStr = searchParams.get('hasGuardrailEvents');
  const pageStr = searchParams.get('page');
  const limitStr = searchParams.get('limit');

  // Pagination defaults (25 per page)
  const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : 1;
  const limit = limitStr ? Math.min(100, Math.max(1, parseInt(limitStr, 10))) : 25;
  const offset = (page - 1) * limit;

  // Parse hasGuardrailEvents filter
  const hasGuardrailEvents = hasGuardrailEventsStr === 'true';

  // Validate dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateStr) {
    startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { data: null, error: { code: 'AIB_004', message: 'Invalid startDate format' } },
        { status: 400 }
      );
    }
  }

  if (endDateStr) {
    endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        { data: null, error: { code: 'AIB_004', message: 'Invalid endDate format' } },
        { status: 400 }
      );
    }
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
  }

  const serviceClient = createServiceClient();

  try {
    // Get base audit logs with user info from agency_audit_logs
    let query = serviceClient
      .from('agency_audit_logs')
      .select(`
        id,
        agency_id,
        user_id,
        conversation_id,
        action,
        metadata,
        logged_at,
        users!inner(full_name, email)
      `, { count: 'exact' })
      .eq('agency_id', auth.agencyId)
      .order('logged_at', { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('logged_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('logged_at', endDate.toISOString());
    }

    // Filter by guardrail events if requested
    if (hasGuardrailEvents) {
      query = query.eq('action', 'guardrail_triggered');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logsData, error: logsError, count } = await query;

    if (logsError) {
      console.error('Failed to query audit logs:', logsError);
      return NextResponse.json(
        { data: null, error: { code: 'AIB_006', message: 'Failed to retrieve audit logs' } },
        { status: 500 }
      );
    }

    // Get conversation details for entries that have conversation_id
    const conversationIds = [...new Set((logsData ?? [])
      .map(log => log.conversation_id)
      .filter((id): id is string => id !== null))];

    let conversationsMap = new Map<string, { title: string | null; project_id: string | null; projectName: string | null }>();

    if (conversationIds.length > 0) {
      const { data: conversations } = await serviceClient
        .from('ai_buddy_conversations')
        .select(`
          id,
          title,
          project_id,
          ai_buddy_projects(name)
        `)
        .in('id', conversationIds);

      if (conversations) {
        conversations.forEach(conv => {
          conversationsMap.set(conv.id, {
            title: conv.title,
            project_id: conv.project_id,
            projectName: (conv.ai_buddy_projects as { name: string } | null)?.name ?? null,
          });
        });
      }
    }

    // Get message counts per conversation
    let messageCountsMap = new Map<string, number>();
    if (conversationIds.length > 0) {
      const { data: messageCounts } = await serviceClient
        .from('ai_buddy_messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds);

      if (messageCounts) {
        messageCounts.forEach(msg => {
          const current = messageCountsMap.get(msg.conversation_id) || 0;
          messageCountsMap.set(msg.conversation_id, current + 1);
        });
      }
    }

    // Get guardrail event counts per conversation from agency_audit_logs
    let guardrailCountsMap = new Map<string, number>();
    if (conversationIds.length > 0) {
      const { data: guardrailCounts } = await serviceClient
        .from('agency_audit_logs')
        .select('conversation_id')
        .eq('agency_id', auth.agencyId)
        .eq('action', 'guardrail_triggered')
        .in('conversation_id', conversationIds);

      if (guardrailCounts) {
        guardrailCounts.forEach(log => {
          if (log.conversation_id) {
            const current = guardrailCountsMap.get(log.conversation_id) || 0;
            guardrailCountsMap.set(log.conversation_id, current + 1);
          }
        });
      }
    }

    // Map to response format
    const entries: AuditLogTableEntry[] = (logsData ?? []).map(log => {
      const conversationData = log.conversation_id ? conversationsMap.get(log.conversation_id) : null;
      const users = log.users as { full_name: string | null; email: string } | null;

      return {
        id: log.id,
        agencyId: log.agency_id,
        userId: log.user_id,
        userName: users?.full_name ?? null,
        userEmail: users?.email ?? 'Unknown',
        conversationId: log.conversation_id,
        conversationTitle: conversationData?.title ?? null,
        projectId: conversationData?.project_id ?? null,
        projectName: conversationData?.projectName ?? null,
        action: log.action,
        metadata: log.metadata as Record<string, unknown>,
        loggedAt: log.logged_at,
        messageCount: log.conversation_id ? (messageCountsMap.get(log.conversation_id) || 0) : 0,
        guardrailEventCount: log.conversation_id ? (guardrailCountsMap.get(log.conversation_id) || 0) : 0,
      };
    });

    // Apply keyword search filter (client-side for simplicity)
    let filteredEntries = entries;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredEntries = entries.filter(entry => {
        const searchableFields = [
          entry.userName,
          entry.userEmail,
          entry.conversationTitle,
          entry.projectName,
          entry.action,
          JSON.stringify(entry.metadata),
        ];
        return searchableFields.some(field =>
          field && field.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = search ? filteredEntries.length : (count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: {
        entries: filteredEntries,
        total,
        page,
        pageSize: limit,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { data: null, error: { code: 'AIB_006', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
