/**
 * AI Buddy Hooks
 * Story 14.5: Component Scaffolding
 *
 * Barrel export for all AI Buddy hooks.
 * Full implementations in Epic 15-20.
 */

export { useChat, type UseChatOptions, type UseChatReturn } from './use-chat';
export {
  useProjects,
  type UseProjectsOptions,
  type UseProjectsReturn,
} from './use-projects';
export {
  useActiveProject,
  type UseActiveProjectReturn,
} from './use-active-project';
export { usePreferences, type UsePreferencesReturn } from './use-preferences';
export { useOnboarding, type UseOnboardingReturn } from './use-onboarding';
export { useGuardrails, type UseGuardrailsReturn, type ResetSection } from './use-guardrails';
export {
  useAuditLogs,
  type UseAuditLogsOptions,
  type UseAuditLogsReturn,
} from './use-audit-logs';
export {
  useConversations,
  type UseConversationsOptions,
  type UseConversationsReturn,
} from './use-conversations';
export {
  useConversationSearch,
  type ConversationSearchResult,
} from './use-conversation-search';
export {
  useConversationAttachments,
  type UseConversationAttachmentsOptions,
  type UseConversationAttachmentsReturn,
} from './use-conversation-attachments';
export {
  useProjectDocuments,
  type UseProjectDocumentsOptions,
  type UseProjectDocumentsReturn,
} from './use-project-documents';
export {
  useDocumentPreview,
  type UseDocumentPreviewReturn,
} from './use-document-preview';
export {
  useOnboardingStatus,
  type UseOnboardingStatusReturn,
  type FilterStatus,
} from './use-onboarding-status';
export {
  useGuardrailLogs,
  type UseGuardrailLogsParams,
  type UseGuardrailLogsReturn,
} from './use-guardrail-logs';
