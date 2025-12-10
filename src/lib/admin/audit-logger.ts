/**
 * AI Buddy Audit Logger
 * Story 15.5: AI Response Quality & Attribution
 *
 * Audit log creation for AI Buddy compliance tracking.
 * AC19: Guardrail events are logged to audit table (admin-visible only)
 *
 * Per architecture.md:
 * - Audit logs are append-only, immutable
 * - 7-year retention for insurance compliance
 * - Admin-only visibility via RLS policies
 */

import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import type { AuditLogEntry } from '@/types/ai-buddy';

export type AuditAction =
  // AI Buddy actions
  | 'message_sent'
  | 'message_received'
  | 'guardrail_triggered'
  | 'conversation_created'
  | 'conversation_deleted'
  | 'project_created'
  | 'project_archived'
  | 'document_attached'
  | 'document_removed'
  | 'preferences_updated'
  | 'guardrails_configured'
  // Admin actions
  | 'user_invited'
  | 'user_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'ownership_transferred'
  | 'ownership_transfer_failed'
  // Document Library actions (Story 21.4)
  | 'document_uploaded'
  | 'document_deleted'
  | 'document_modified'
  // Comparison actions (Story 21.4)
  | 'comparison_created'
  | 'comparison_exported'
  // One-Pager actions (Story 21.4)
  | 'one_pager_generated'
  | 'one_pager_exported'
  // Document Chat actions (Story 21.4)
  | 'document_chat_started';

export interface AuditLogInput {
  agencyId: string;
  userId: string;
  conversationId?: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event
 * Uses service role to bypass RLS for audit log insertion
 *
 * AC19: Guardrail events logged to audit table
 *
 * @param input - Audit log entry data
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    const supabase = await createClient();

    // Cast metadata to JSON-compatible format for Supabase
    const metadataJson = input.metadata
      ? JSON.parse(JSON.stringify(input.metadata))
      : {};

    const { error } = await supabase.from('agency_audit_logs').insert({
      agency_id: input.agencyId,
      user_id: input.userId,
      conversation_id: input.conversationId ?? null,
      action: input.action,
      metadata: metadataJson,
      logged_at: new Date().toISOString(),
    });

    if (error) {
      // Log but don't throw - audit failures shouldn't break the app
      log.error('Failed to write audit log', error, {
        action: input.action,
        agencyId: input.agencyId,
      });
    }
  } catch (err) {
    // Log but don't throw - audit failures shouldn't break the app
    log.error('Audit logging exception', err instanceof Error ? err : new Error(String(err)), {
      action: input.action,
      agencyId: input.agencyId,
    });
  }
}

/**
 * Log a guardrail trigger event
 * AC19: Guardrail events logged to audit table (admin-visible only)
 */
export async function logGuardrailEvent(
  agencyId: string,
  userId: string,
  conversationId: string,
  triggeredTopic: string,
  redirectMessage: string,
  userMessage: string
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    conversationId,
    action: 'guardrail_triggered',
    metadata: {
      triggeredTopic,
      redirectMessage,
      messagePreview: userMessage.slice(0, 100),
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a message event (sent or received)
 */
export async function logMessageEvent(
  agencyId: string,
  userId: string,
  conversationId: string,
  messageId: string,
  role: 'user' | 'assistant',
  contentLength: number,
  hasCitations: boolean,
  confidence?: 'high' | 'medium' | 'low'
): Promise<void> {
  const action: AuditAction = role === 'user' ? 'message_sent' : 'message_received';

  await logAuditEvent({
    agencyId,
    userId,
    conversationId,
    action,
    metadata: {
      messageId,
      contentLength,
      hasCitations,
      confidence,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Query audit logs with filters
 * Admin-only access enforced by RLS policy
 */
export async function queryAuditLogs(params: {
  agencyId: string;
  userId?: string;
  action?: AuditAction;
  conversationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('agency_audit_logs')
    .select('*, users!inner(email)', { count: 'exact' })
    .eq('agency_id', params.agencyId)
    .order('logged_at', { ascending: false });

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.action) {
    query = query.eq('action', params.action);
  }

  if (params.conversationId) {
    query = query.eq('conversation_id', params.conversationId);
  }

  if (params.dateFrom) {
    query = query.gte('logged_at', params.dateFrom.toISOString());
  }

  if (params.dateTo) {
    query = query.lte('logged_at', params.dateTo.toISOString());
  }

  // Pagination
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    log.error('Failed to query audit logs', error, { agencyId: params.agencyId });
    throw new Error(`Failed to query audit logs: ${error.message}`);
  }

  const logs: AuditLogEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    agencyId: row.agency_id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    action: row.action,
    metadata: row.metadata as Record<string, unknown>,
    loggedAt: row.logged_at,
    user: row.users
      ? {
          email: row.users.email,
          name: row.users.email?.split('@')[0] ?? 'Unknown',
        }
      : undefined,
  }));

  return {
    logs,
    total: count ?? 0,
  };
}

/**
 * Build audit log metadata for a message event
 */
export function buildMessageMetadata(
  messageId: string,
  contentPreview: string,
  hasSourceCitations: boolean,
  confidence?: 'high' | 'medium' | 'low',
  appliedGuardrails?: string[]
): Record<string, unknown> {
  return {
    messageId,
    contentPreview: contentPreview.slice(0, 100),
    hasSourceCitations,
    confidence,
    appliedGuardrails,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export audit logs (for admin export functionality)
 * Returns data in a format suitable for CSV/PDF export
 */
export async function exportAuditLogs(params: {
  agencyId: string;
  dateFrom: Date;
  dateTo: Date;
  format: 'csv' | 'json';
}): Promise<Array<Record<string, unknown>>> {
  const { logs } = await queryAuditLogs({
    agencyId: params.agencyId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    limit: 10000, // Max export size
  });

  return logs.map((log) => ({
    id: log.id,
    timestamp: log.loggedAt,
    user: log.user?.email ?? log.userId,
    action: log.action,
    conversationId: log.conversationId ?? '',
    details: JSON.stringify(log.metadata),
  }));
}

// =============================================================================
// Document Library Audit Logging (Story 21.4)
// =============================================================================

/**
 * Log a document upload event
 * AC-21.4.1: Document actions logged with document ID and filename
 */
export async function logDocumentUploaded(
  agencyId: string,
  userId: string,
  documentId: string,
  filename: string,
  fileSize?: number,
  documentType?: string
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'document_uploaded',
    metadata: {
      documentId,
      filename,
      fileSize,
      documentType,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a document deletion event
 * AC-21.4.1: Document actions logged with document ID and filename
 */
export async function logDocumentDeleted(
  agencyId: string,
  userId: string,
  documentId: string,
  filename: string
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'document_deleted',
    metadata: {
      documentId,
      filename,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a document modification event
 * AC-21.4.1: Document actions logged with document ID and filename
 */
export async function logDocumentModified(
  agencyId: string,
  userId: string,
  documentId: string,
  filename: string,
  changedFields: string[]
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'document_modified',
    metadata: {
      documentId,
      filename,
      changedFields,
      timestamp: new Date().toISOString(),
    },
  });
}

// =============================================================================
// Comparison Audit Logging (Story 21.4)
// =============================================================================

/**
 * Log a comparison creation event
 * AC-21.4.2: Comparison actions logged with comparison ID and document IDs
 */
export async function logComparisonCreated(
  agencyId: string,
  userId: string,
  comparisonId: string,
  documentIds: string[],
  comparisonTitle?: string
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'comparison_created',
    metadata: {
      comparisonId,
      documentIds,
      comparisonTitle,
      documentCount: documentIds.length,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a comparison export event
 * AC-21.4.2: Comparison actions logged with comparison ID and document IDs
 */
export async function logComparisonExported(
  agencyId: string,
  userId: string,
  comparisonId: string,
  documentIds: string[],
  exportFormat: 'pdf' | 'csv' | 'excel'
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'comparison_exported',
    metadata: {
      comparisonId,
      documentIds,
      exportFormat,
      timestamp: new Date().toISOString(),
    },
  });
}

// =============================================================================
// One-Pager Audit Logging (Story 21.4)
// =============================================================================

/**
 * Log a one-pager generation event
 * AC-21.4.3: One-pager actions logged with relevant document/comparison IDs
 */
export async function logOnePagerGenerated(
  agencyId: string,
  userId: string,
  onePagerId: string,
  sourceDocumentId?: string,
  sourceComparisonId?: string
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'one_pager_generated',
    metadata: {
      onePagerId,
      sourceDocumentId,
      sourceComparisonId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a one-pager export event
 * AC-21.4.3: One-pager actions logged with relevant document/comparison IDs
 */
export async function logOnePagerExported(
  agencyId: string,
  userId: string,
  onePagerId: string,
  exportFormat: 'pdf'
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    action: 'one_pager_exported',
    metadata: {
      onePagerId,
      exportFormat,
      timestamp: new Date().toISOString(),
    },
  });
}

// =============================================================================
// Document Chat Audit Logging (Story 21.4)
// =============================================================================

/**
 * Log a document chat session start
 * AC-21.4.4: Document chat actions logged with document ID and conversation ID
 */
export async function logDocumentChatStarted(
  agencyId: string,
  userId: string,
  documentId: string,
  conversationId: string
): Promise<void> {
  await logAuditEvent({
    agencyId,
    userId,
    conversationId,
    action: 'document_chat_started',
    metadata: {
      documentId,
      timestamp: new Date().toISOString(),
    },
  });
}
