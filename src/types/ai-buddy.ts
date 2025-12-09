/**
 * AI Buddy TypeScript Types
 * Story 14.2: API Route Structure
 *
 * All TypeScript interfaces for AI Buddy feature module.
 * Per tech-spec section 6.
 */

// ============ Enum Types ============

export type MessageRole = 'user' | 'assistant' | 'system';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type Permission =
  | 'use_ai_buddy'
  | 'manage_own_projects'
  | 'manage_users'
  | 'configure_guardrails'
  | 'view_audit_logs';

// ============ Entity Types ============

export interface Project {
  id: string;
  agencyId: string;
  userId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documentCount?: number; // Computed field
}

export interface Conversation {
  id: string;
  agencyId: string;
  userId: string;
  projectId: string | null;
  title: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number; // Computed field
  project?: Project; // Joined field
}

export interface Citation {
  documentId: string;
  documentName: string;
  page: number;
  text: string;
  startOffset?: number;
  endOffset?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  agencyId: string;
  role: MessageRole;
  content: string;
  sources: Citation[] | null;
  confidence: ConfidenceLevel | null;
  createdAt: string;
}

export interface RestrictedTopic {
  trigger: string;
  redirect: string;
}

export interface GuardrailConfig {
  agencyId: string;
  restrictedTopics: RestrictedTopic[];
  customRules: string[];
  eandoDisclaimer: boolean;
  aiDisclosureMessage: string;
  aiDisclosureEnabled: boolean;
  restrictedTopicsEnabled: boolean;
  updatedAt: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permission: Permission;
  grantedBy: string | null;
  grantedAt: string;
}

export interface UserPreferences {
  displayName?: string;
  role?: 'producer' | 'csr' | 'manager' | 'other';
  linesOfBusiness?: string[];
  favoriteCarriers?: string[];
  communicationStyle?: 'professional' | 'casual';
  agencyName?: string;
  licensedStates?: string[];
  onboardingCompleted?: boolean;
}

export interface AuditLogEntry {
  id: string;
  agencyId: string;
  userId: string;
  conversationId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  loggedAt: string;
  user?: {
    email: string;
    name: string;
  };
}

export interface RateLimit {
  tier: 'free' | 'pro' | 'enterprise';
  messagesPerMinute: number;
  messagesPerDay: number;
}

// ============ API Types ============

export interface AiBuddyApiResponse<T> {
  data: T | null;
  error: AiBuddyApiError | null;
}

export interface AiBuddyApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============ Chat API Types ============

export interface ChatRequest {
  conversationId?: string;
  projectId?: string;
  message: string;
  attachments?: {
    documentId: string;
    type: 'pdf' | 'image';
  }[];
}

export interface StreamChunk {
  type: 'chunk' | 'sources' | 'confidence' | 'done';
  content?: string;
  citations?: Citation[];
  level?: ConfidenceLevel;
  conversationId?: string;
  messageId?: string;
}

// ============ Project API Types ============

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

// ============ Conversation API Types ============

export interface ConversationListParams {
  projectId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

// ============ Admin API Types ============

export interface AuditLogParams {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
}

// ============ Story 17.1: Document Attachment Types ============

export type AttachmentStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'failed';

export interface ConversationAttachment {
  document_id: string;
  attached_at: string;
  document: {
    id: string;
    name: string;
    file_type: string;
    status: string;
    page_count: number | null;
  };
}

export interface PendingAttachment {
  id: string;
  file: File;
  name: string;
  status: AttachmentStatus;
  progress?: number;
  error?: string;
  documentId?: string; // Set after upload completes
}

export interface AttachmentUploadResult {
  documentId: string;
  name: string;
  status: string;
}

// ============ Attachment API Types ============

export interface AttachmentListResponse {
  attachments: ConversationAttachment[];
}

export interface AttachmentUploadResponse {
  attachments: ConversationAttachment[];
}

// ============ Story 17.2: Project Document Types ============

export interface ProjectDocument {
  document_id: string;
  attached_at: string;
  document: {
    id: string;
    name: string;
    file_type: string;
    status: string;
    page_count: number | null;
    created_at: string;
    extraction_data?: Record<string, unknown> | null; // AC-17.2.7: Comparison context
  };
}

export interface ProjectDocumentListResponse {
  documents: ProjectDocument[];
}

export interface AddProjectDocumentsRequest {
  documentIds: string[];
}

export interface ProjectDocumentRemoveResponse {
  removed: true;
}
