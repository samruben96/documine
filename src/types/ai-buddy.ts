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

/**
 * Restricted topic (simple version for prompt builder)
 * Used by guardrails service for prompt injection
 */
export interface RestrictedTopic {
  trigger: string;
  redirect: string;
}

// ============ Epic 19: Extended Guardrail Types ============

/**
 * Extended restricted topic with full metadata for admin UI
 * Story 19.1: Guardrail Admin UI
 */
export interface ExtendedRestrictedTopic {
  id: string;                    // UUID for editing/deletion
  trigger: string;               // Topic keyword or phrase (e.g., "legal advice")
  description?: string;          // Admin description of why restricted
  redirectGuidance: string;      // How AI should redirect
  enabled: boolean;              // Can temporarily disable without deleting
  isBuiltIn: boolean;            // true for default topics, false for custom
  createdAt: string;
  createdBy?: string;            // User ID who created
}

/**
 * A custom guardrail rule (beyond restricted topics)
 * Story 19.1: Guardrail Admin UI
 */
export interface CustomGuardrailRule {
  id: string;
  name: string;                  // e.g., "E&O Protection Language"
  description: string;           // Explanation for admin
  promptInjection: string;       // Text injected into system prompt when enabled
  enabled: boolean;
  isBuiltIn: boolean;            // true for system rules, false for custom
}

/**
 * Complete guardrails configuration for admin UI
 * Story 19.1: Guardrail Admin UI
 */
export interface AgencyGuardrails {
  agencyId: string;
  restrictedTopics: ExtendedRestrictedTopic[];
  customRules: CustomGuardrailRule[];
  eandoDisclaimer: boolean;      // Master toggle for E&O protection language
  aiDisclosureMessage: string | null;  // Chatbot disclosure for state compliance
  aiDisclosureEnabled: boolean;  // Whether disclosure is shown
  restrictedTopicsEnabled: boolean; // Master toggle for all restricted topics
  updatedAt: string;
}

/**
 * Default restricted topics for new agencies
 * Story 19.1: AC-19.1.2
 */
export const DEFAULT_RESTRICTED_TOPICS: ExtendedRestrictedTopic[] = [
  {
    id: 'default-legal',
    trigger: 'legal advice',
    description: 'Prevents AI from providing legal counsel',
    redirectGuidance: 'Suggest the user consult with a licensed attorney for legal questions.',
    enabled: true,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'default-claims',
    trigger: 'file a claim',
    description: 'Prevents AI from handling claims',
    redirectGuidance: 'Direct the user to contact their carrier directly or visit the carrier portal to file claims.',
    enabled: true,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'default-binding',
    trigger: 'binding authority',
    description: 'Prevents AI from discussing binding decisions',
    redirectGuidance: 'Explain that binding decisions require human review and suggest contacting the agency.',
    enabled: true,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Default custom guardrail rules
 * Story 19.1: AC-19.1.8
 */
export const DEFAULT_CUSTOM_RULES: CustomGuardrailRule[] = [
  {
    id: 'builtin-eando',
    name: 'E&O Protection Language',
    description: 'Adds standard E&O disclaimer language to responses involving coverage advice',
    promptInjection: 'When discussing coverage, limits, or policy interpretation, always include: "Coverage is subject to policy terms and conditions. Please review the actual policy language or contact the carrier for confirmation."',
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'builtin-state-compliance',
    name: 'State Compliance Warnings',
    description: 'Reminds users about state-specific requirements when relevant',
    promptInjection: 'When discussing state-specific coverage requirements or regulations, note that requirements vary by state and suggest verifying with the state insurance department if needed.',
    enabled: true,
    isBuiltIn: true,
  },
];

/**
 * Default guardrails for new agencies
 * Story 19.1: Guardrail Admin UI
 */
export const DEFAULT_AGENCY_GUARDRAILS: Omit<AgencyGuardrails, 'agencyId' | 'updatedAt'> = {
  restrictedTopics: DEFAULT_RESTRICTED_TOPICS,
  customRules: DEFAULT_CUSTOM_RULES,
  eandoDisclaimer: true,
  aiDisclosureMessage: "You're chatting with AI Buddy, an AI assistant. While I strive for accuracy, please verify important information.",
  aiDisclosureEnabled: true,
  restrictedTopicsEnabled: true,
};

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
  // Identity (FR26)
  displayName?: string;
  role?: 'producer' | 'csr' | 'manager' | 'other';

  // Business context (FR27, FR28)
  linesOfBusiness?: string[];
  favoriteCarriers?: string[];

  // Agency info (FR29)
  agencyName?: string;
  licensedStates?: string[];

  // Communication (FR30)
  communicationStyle?: 'professional' | 'casual';

  // Onboarding status (FR57, FR62)
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  onboardingSkipped?: boolean;
  onboardingSkippedAt?: string;
}

// ============ Epic 18: Onboarding Options ============

export const LINES_OF_BUSINESS = [
  'Personal Auto',
  'Homeowners',
  'Commercial Auto',
  'Commercial Property',
  'General Liability',
  'Workers Compensation',
  'Professional Liability',
  'Umbrella/Excess',
  'Life Insurance',
  'Health Insurance',
] as const;

export const COMMON_CARRIERS = [
  'Progressive',
  'Travelers',
  'Hartford',
  'Safeco',
  'Liberty Mutual',
  'Nationwide',
  'State Farm',
  'Allstate',
  'USAA',
  'Chubb',
  'CNA',
  'AmTrust',
  'Employers',
  'Markel',
] as const;

export const USER_ROLES = [
  { value: 'producer', label: 'Producer/Agent' },
  { value: 'csr', label: 'Customer Service Rep' },
  { value: 'manager', label: 'Agency Manager' },
  { value: 'other', label: 'Other' },
] as const;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  linesOfBusiness: [],
  favoriteCarriers: [],
  communicationStyle: 'professional',
  onboardingCompleted: false,
};

// US States for licensed states selection (Story 18.2)
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

export interface OnboardingState {
  currentStep: 1 | 2 | 3;
  isOpen: boolean;
  isComplete: boolean;
  data: Partial<UserPreferences>;
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

// ============ Story 18.4: Admin Onboarding Status Types ============

export type OnboardingStatus = 'completed' | 'skipped' | 'not_started';

export interface OnboardingStatusEntry {
  userId: string;
  email: string;
  fullName: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  onboardingSkipped: boolean;
}

export interface OnboardingStatusResponse {
  users: OnboardingStatusEntry[];
}

// ============ Story 19.2: Guardrail Enforcement Logging Types ============

/**
 * Guardrail enforcement audit log entry for admin viewing
 * Story 19.2: Enforcement Logging - AC-19.2.2
 */
export interface GuardrailEnforcementEvent {
  id: string;
  agencyId: string;
  userId: string;
  userEmail: string; // Joined from users table
  conversationId: string | null;
  triggeredTopic: string;
  messagePreview: string; // Truncated to 100 chars
  redirectApplied: string;
  loggedAt: string;
}

/**
 * Response for guardrail enforcement logs API
 * Story 19.2: AC-19.2.4
 */
export interface GuardrailEnforcementLogsResponse {
  logs: GuardrailEnforcementEvent[];
  total: number;
  hasMore: boolean;
}

/**
 * Derive onboarding status from user preferences
 */
export function deriveOnboardingStatus(
  onboardingCompleted: boolean | undefined,
  onboardingSkipped: boolean | undefined
): OnboardingStatus {
  if (onboardingCompleted) return 'completed';
  if (onboardingSkipped) return 'skipped';
  return 'not_started';
}
