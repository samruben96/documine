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

export type Confidence = 'high' | 'needs_review' | 'not_found';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
