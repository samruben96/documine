/**
 * AI Buddy Audit Logger
 * Story 14.2: API Route Structure
 *
 * Audit log creation for AI Buddy compliance tracking.
 * Stub implementation - actual logging in Epic 20.
 */

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
  | 'permission_revoked';

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
 * @throws Error - Not implemented
 */
export async function logAuditEvent(_input: AuditLogInput): Promise<void> {
  throw new Error('Not implemented - Audit logging deferred to Epic 20');
}

/**
 * Query audit logs with filters
 * @throws Error - Not implemented
 */
export async function queryAuditLogs(_params: {
  agencyId: string;
  userId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  throw new Error('Not implemented - Audit log querying deferred to Epic 20');
}

/**
 * Build audit log metadata for a message event
 */
export function buildMessageMetadata(
  messageId: string,
  contentPreview: string,
  hasSourceCitations: boolean
): Record<string, unknown> {
  return {
    messageId,
    contentPreview: contentPreview.slice(0, 100),
    hasSourceCitations,
    timestamp: new Date().toISOString(),
  };
}
