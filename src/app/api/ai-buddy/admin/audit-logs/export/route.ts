/**
 * AI Buddy Admin Audit Logs Export API Route
 * Story 20.4: Audit Log Interface
 *
 * POST /api/ai-buddy/admin/audit-logs/export - Export audit logs as CSV or PDF
 * Admin only - requires view_audit_logs permission.
 *
 * AC-20.4.7: Export format selection (PDF or CSV)
 * AC-20.4.8: PDF includes agency header, export date, compliance statement, entries, optional transcripts
 * AC-20.4.9: CSV includes timestamp, user_email, user_name, action, conversation_id, metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { format } from 'date-fns';

/**
 * Export request body
 */
interface ExportRequestBody {
  format: 'pdf' | 'csv';
  filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    hasGuardrailEvents?: boolean;
  };
  includeTranscripts?: boolean;
}

/**
 * Escape CSV field if it contains special characters
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * POST /api/ai-buddy/admin/audit-logs/export
 * Export audit logs as CSV or PDF
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Check admin authentication with view_audit_logs permission
  const auth = await requireAdminAuth('view_audit_logs');
  if (!auth.success) {
    return NextResponse.json(
      { data: null, error: { code: auth.status === 401 ? 'AIB_001' : 'AIB_002', message: auth.error } },
      { status: auth.status }
    );
  }

  // Parse request body
  let body: ExportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'AIB_004', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { format: exportFormat, filters, includeTranscripts } = body;

  if (!exportFormat || !['pdf', 'csv'].includes(exportFormat)) {
    return NextResponse.json(
      { data: null, error: { code: 'AIB_004', message: 'Format must be "pdf" or "csv"' } },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  try {
    // Get agency info for export header
    const { data: agency } = await serviceClient
      .from('agencies')
      .select('name')
      .eq('id', auth.agencyId)
      .single();

    const agencyName = agency?.name || 'Unknown Agency';

    // Build query with same filters as list endpoint
    let query = serviceClient
      .from('ai_buddy_audit_logs')
      .select(`
        id,
        agency_id,
        user_id,
        conversation_id,
        action,
        metadata,
        logged_at,
        users!inner(full_name, email)
      `)
      .eq('agency_id', auth.agencyId)
      .order('logged_at', { ascending: false })
      .limit(10000); // Max export size for performance

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      if (!isNaN(startDate.getTime())) {
        query = query.gte('logged_at', startDate.toISOString());
      }
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      if (!isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('logged_at', endDate.toISOString());
      }
    }

    if (filters?.hasGuardrailEvents) {
      query = query.eq('action', 'guardrail_triggered');
    }

    const { data: logsData, error: logsError } = await query;

    if (logsError) {
      console.error('Failed to query audit logs for export:', logsError);
      return NextResponse.json(
        { data: null, error: { code: 'AIB_006', message: 'Failed to retrieve audit logs' } },
        { status: 500 }
      );
    }

    // Apply search filter (client-side)
    let filteredLogs = logsData ?? [];
    if (filters?.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filteredLogs = filteredLogs.filter(log => {
        const users = log.users as { full_name: string | null; email: string } | null;
        const searchableFields = [
          users?.full_name,
          users?.email,
          log.action,
          JSON.stringify(log.metadata),
        ];
        return searchableFields.some(field =>
          field && field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Handle CSV export
    // AC-20.4.9: CSV includes timestamp, user_email, user_name, action, conversation_id, metadata
    if (exportFormat === 'csv') {
      const headers = ['timestamp', 'user_email', 'user_name', 'action', 'conversation_id', 'metadata'];
      const csvRows = [headers.join(',')];

      filteredLogs.forEach(log => {
        const users = log.users as { full_name: string | null; email: string } | null;
        csvRows.push([
          escapeCsvField(format(new Date(log.logged_at), 'yyyy-MM-dd HH:mm:ss')),
          escapeCsvField(users?.email),
          escapeCsvField(users?.full_name),
          escapeCsvField(log.action),
          escapeCsvField(log.conversation_id),
          escapeCsvField(JSON.stringify(log.metadata)),
        ].join(','));
      });

      if (filteredLogs.length === 0) {
        csvRows.push('No audit log entries found for the specified filters');
      }

      const csvContent = csvRows.join('\n');

      // Generate filename
      const exportDate = format(new Date(), 'yyyy-MM-dd');
      const sanitizedAgencyName = agencyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = `${sanitizedAgencyName}_audit_log_${exportDate}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Handle PDF export
    // AC-20.4.8: PDF includes agency header, export date, compliance statement, entries, optional transcripts
    if (exportFormat === 'pdf') {
      // For PDF export, we'll return JSON data that the client will use to generate PDF
      // This is because server-side PDF generation with @react-pdf/renderer requires additional setup
      // The client will handle PDF generation using the PDF template component

      let transcriptData: Record<string, unknown>[] = [];

      // If includeTranscripts is true, fetch conversation messages
      if (includeTranscripts) {
        const conversationIds = [...new Set(filteredLogs
          .map(log => log.conversation_id)
          .filter((id): id is string => id !== null))];

        if (conversationIds.length > 0) {
          // Get messages for each conversation
          const { data: messages } = await serviceClient
            .from('ai_buddy_messages')
            .select('id, conversation_id, role, content, sources, confidence, created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: true });

          if (messages) {
            // Group messages by conversation
            const messagesByConversation = new Map<string, typeof messages>();
            messages.forEach(msg => {
              const existing = messagesByConversation.get(msg.conversation_id) || [];
              messagesByConversation.set(msg.conversation_id, [...existing, msg]);
            });

            transcriptData = Array.from(messagesByConversation.entries()).map(([convId, msgs]) => ({
              conversationId: convId,
              messages: msgs,
            }));
          }
        }
      }

      // Return data for client-side PDF generation
      const pdfData = {
        agency: {
          name: agencyName,
        },
        exportDate: new Date().toISOString(),
        exportedBy: auth.userId,
        filters: filters || {},
        entries: filteredLogs.map(log => {
          const users = log.users as { full_name: string | null; email: string } | null;
          return {
            id: log.id,
            timestamp: log.logged_at,
            userEmail: users?.email ?? 'Unknown',
            userName: users?.full_name ?? null,
            action: log.action,
            conversationId: log.conversation_id,
            metadata: log.metadata,
          };
        }),
        transcripts: includeTranscripts ? transcriptData : null,
        complianceStatement: 'AI Buddy Audit Log - CONFIDENTIAL - For internal compliance use only',
      };

      return NextResponse.json({
        data: pdfData,
        error: null,
      });
    }

    // Should not reach here
    return NextResponse.json(
      { data: null, error: { code: 'AIB_004', message: 'Invalid format' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/ai-buddy/admin/audit-logs/export:', error);
    return NextResponse.json(
      { data: null, error: { code: 'AIB_006', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
