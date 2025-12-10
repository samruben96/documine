/**
 * Agency Admin Utilities
 * Story 21.3: Component & Settings Migration
 *
 * Agency-wide admin utilities for audit logging and shared functionality.
 * These utilities were moved from src/lib/ai-buddy/ to support agency-wide admin features.
 */

export {
  // Core audit functions
  logAuditEvent,
  logGuardrailEvent,
  logMessageEvent,
  queryAuditLogs,
  buildMessageMetadata,
  exportAuditLogs,
  // Document Library audit functions (Story 21.4)
  logDocumentUploaded,
  logDocumentDeleted,
  logDocumentModified,
  // Comparison audit functions (Story 21.4)
  logComparisonCreated,
  logComparisonExported,
  // One-Pager audit functions (Story 21.4)
  logOnePagerGenerated,
  logOnePagerExported,
  // Document Chat audit functions (Story 21.4)
  logDocumentChatStarted,
  // Types
  type AuditAction,
  type AuditLogInput,
} from './audit-logger';
