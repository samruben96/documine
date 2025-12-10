/**
 * AI Buddy Shared Utilities
 * Story 14.2: API Route Structure
 *
 * Barrel export for all AI Buddy utilities.
 */

// Error handling
export {
  AIB_ERROR_CODES,
  type AiBuddyErrorCode,
  createError,
  successResponse,
  errorResponse,
  aiBuddyErrorResponse,
  aiBuddySuccessResponse,
  notImplementedResponse,
} from './errors';

// AI client
export {
  type ChatStreamOptions,
  type ChatStreamResult,
  createChatStream,
  generateChatCompletion,
  validateAiConfig,
} from './ai-client';

// Guardrails
export {
  type GuardrailCheckResult,
  checkGuardrails,
  getGuardrailConfig,
  updateGuardrailConfig,
  matchesRestrictedTopic,
} from './guardrails';

// Prompt builder
export {
  type PromptContext,
  type BuiltPrompt,
  buildSystemPrompt,
  buildUserContext,
  buildGuardrailInstructions,
} from './prompt-builder';

// Audit logger - moved to @/lib/admin in Story 21.3
export {
  type AuditAction,
  type AuditLogInput,
  logAuditEvent,
  queryAuditLogs,
  buildMessageMetadata,
} from '@/lib/admin/audit-logger';

// Rate limiter
export {
  type RateLimitCheck,
  AI_BUDDY_RATE_LIMITS,
  checkAiBuddyRateLimit,
  getRateLimitsForTier,
  incrementMessageCount,
  isRateLimited,
} from './rate-limiter';
