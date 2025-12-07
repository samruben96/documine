/**
 * AI Buddy Components
 * Story 14.5: Component Scaffolding
 *
 * Barrel export for all AI Buddy components.
 * Full implementations in Epic 15-20.
 */

// Chat components (Epic 15)
export { ChatMessage, type ChatMessageProps } from './chat-message';
export {
  ChatMessageList,
  type ChatMessageListProps,
} from './chat-message-list';
export { ChatInput, type ChatInputProps } from './chat-input';
export {
  StreamingIndicator,
  type StreamingIndicatorProps,
} from './streaming-indicator';
export { SourceCitation, type SourceCitationProps } from './source-citation';
export {
  ConfidenceBadge,
  type ConfidenceBadgeProps,
  type ConfidenceLevel,
} from './confidence-badge';

// Project components (Epic 16)
export { ProjectSidebar, type ProjectSidebarProps } from './project-sidebar';
export { ProjectCard, type ProjectCardProps } from './project-card';
export {
  ProjectCreateDialog,
  type ProjectCreateDialogProps,
} from './project-create-dialog';
export {
  ChatHistoryItem,
  type ChatHistoryItemProps,
} from './chat-history-item';

// Document components (Epic 17)
export { DocumentPanel, type DocumentPanelProps } from './document-panel';
export { DocumentCard, type DocumentCardProps } from './document-card';
export {
  DocumentUploadZone,
  type DocumentUploadZoneProps,
} from './document-upload-zone';

// Onboarding components (Epic 18)
export {
  OnboardingFlow,
  type OnboardingFlowProps,
  type OnboardingStep,
} from './onboarding-flow';
export {
  ChipSelect,
  type ChipSelectProps,
  type ChipOption,
} from './chip-select';
export { ProgressSteps, type ProgressStepsProps } from './progress-steps';

// Guardrails components (Epic 19)
export { GuardrailToggle, type GuardrailToggleProps } from './guardrail-toggle';
export { TopicTagList, type TopicTagListProps } from './topic-tag-list';

// Admin components (Epic 20)
export {
  AuditLogTable,
  type AuditLogTableProps,
  type AuditLogEntry,
} from './audit-log-table';
export { UsageStatCard, type UsageStatCardProps } from './usage-stat-card';
