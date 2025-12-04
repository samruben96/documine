// Re-export generated database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from './database.types';

// Application-level type aliases
export type UserRole = 'admin' | 'member';

export type DocumentStatus = 'processing' | 'ready' | 'failed';

export type DocumentType = 'quote' | 'general';

export type Confidence = 'high' | 'needs_review' | 'not_found';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

/**
 * Usage metrics for agency dashboard
 * Per AC-3.5.1 to AC-3.5.4
 */
export interface UsageMetrics {
  documentsUploaded: { thisMonth: number; allTime: number };
  queriesAsked: { thisMonth: number; allTime: number };
  activeUsers: number;
  storageUsedBytes: number;
}

/**
 * AI tagging result
 * Story F2-3: AC-F2-3.1, AC-F2-3.2, AC-F2-3.3
 */
export interface AITagResult {
  tags: string[];
  summary: string;
  documentType: DocumentType;
}
