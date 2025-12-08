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
export { useGuardrails, type UseGuardrailsReturn } from './use-guardrails';
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
