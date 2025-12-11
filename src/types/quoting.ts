/**
 * Quoting Helper Types
 * Epic Q2: Quote Session Management
 *
 * Type definitions for quote sessions, client data, and related entities.
 */

import type { Tables, Json } from './database.types';

// Database row type from auto-generated types
export type QuoteSessionRow = Tables<'quote_sessions'>;
export type QuoteResultRow = Tables<'quote_results'>;

/**
 * Quote types
 * - home: Homeowners/property only
 * - auto: Auto/vehicle only
 * - bundle: Both home and auto combined
 */
export type QuoteType = 'home' | 'auto' | 'bundle';

/**
 * Session status (computed on read, not stored)
 *
 * Status calculation rules per tech spec:
 * - draft: client_data is empty OR only has minimal data
 * - in_progress: client_data.personal has at least firstName + lastName
 * - quotes_received: At least one quote_result exists for this session
 * - complete: A comparison document has been generated
 */
export type QuoteSessionStatus = 'draft' | 'in_progress' | 'quotes_received' | 'complete';

/**
 * Address structure used across client data
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Personal information section
 */
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  mailingAddress?: Address;
}

/**
 * Property information (expanded in Q3)
 */
export interface PropertyInfo {
  address?: Address;
  yearBuilt?: number;
}

/**
 * Vehicle information (expanded in Q3)
 */
export interface Vehicle {
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
}

/**
 * Driver information (expanded in Q3)
 */
export interface Driver {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
}

/**
 * Auto information section
 */
export interface AutoInfo {
  vehicles?: Vehicle[];
  drivers?: Driver[];
}

/**
 * Client data structure (stored as JSONB)
 */
export interface QuoteClientData {
  personal?: PersonalInfo;
  property?: PropertyInfo;
  auto?: AutoInfo;
}

/**
 * Quote Session entity (application-level type)
 */
export interface QuoteSession {
  id: string;
  agencyId: string;
  userId: string;
  prospectName: string;
  quoteType: QuoteType;
  status: QuoteSessionStatus;
  clientData: QuoteClientData;
  createdAt: string;
  updatedAt: string;
  /** Count of quote results (computed) */
  carrierCount?: number;
}

/**
 * Quote Result entity
 */
export interface QuoteResult {
  id: string;
  sessionId: string;
  agencyId: string;
  carrierCode: string;
  carrierName: string;
  premiumMonthly: number | null;
  premiumAnnual: number | null;
  deductibleHome: number | null;
  deductibleAuto: number | null;
  coverages: Json;
  status: string;
  documentStoragePath: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create session input
 */
export interface CreateQuoteSessionInput {
  prospectName: string;
  quoteType: QuoteType;
}

/**
 * Update session input
 */
export interface UpdateQuoteSessionInput {
  prospectName?: string;
  quoteType?: QuoteType;
  clientData?: Partial<QuoteClientData>;
}

/**
 * List sessions options
 */
export interface ListQuoteSessionsOptions {
  search?: string;
  status?: QuoteSessionStatus | QuoteSessionStatus[];
  limit?: number;
}
