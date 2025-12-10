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
  | 'user_invited'
  | 'user_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'ownership_transferred'
  | 'ownership_transfer_failed';

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
