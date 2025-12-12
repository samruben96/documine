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
 * All fields optional since data is stored incrementally in JSONB
 */
export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  mailingAddress?: Address;
}

/**
 * Property information
 * Story Q3.1: AC-Q3.1-10, AC-Q3.1-11, AC-Q3.1-13
 */
export interface PropertyInfo {
  sameAsMailingAddress?: boolean;
  address?: Address;
  yearBuilt?: number;
  squareFootage?: number;
  constructionType?: string; // 'frame' | 'masonry' | 'superior'
  roofType?: string; // 'asphalt' | 'tile' | 'metal' | 'slate' | 'other'
  roofYear?: number;
  // Coverage preferences (AC-Q3.1-11)
  dwellingCoverage?: number;
  liabilityCoverage?: string; // "100000" | "300000" | "500000" | "1000000"
  deductible?: string; // "500" | "1000" | "2500" | "5000"
  // Risk factors (AC-Q3.1-13)
  hasPool?: boolean;
  hasTrampoline?: boolean;
}

/**
 * Vehicle information
 * Story Q3.1: AC-Q3.1-16, AC-Q3.1-17, AC-Q3.1-18
 */
export interface Vehicle {
  id?: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  usage?: string; // 'commute' | 'pleasure' | 'business'
  annualMileage?: number;
}

/**
 * Driver information
 * Story Q3.1: AC-Q3.1-25, AC-Q3.1-26, AC-Q3.1-27
 */
export interface Driver {
  id?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  licenseState?: string;
  yearsLicensed?: number;
  relationship?: string; // 'self' | 'spouse' | 'child' | 'other'
  accidentsPast5Years?: number;
  violationsPast5Years?: number;
}

/**
 * Auto coverage preferences
 * Story Q3.1: AC-Q3.1-22
 */
export interface AutoCoverage {
  bodilyInjuryLiability?: string; // "50/100" | "100/300" | "250/500"
  propertyDamageLiability?: string; // "50000" | "100000" | "250000"
  comprehensiveDeductible?: string; // "250" | "500" | "1000"
  collisionDeductible?: string; // "250" | "500" | "1000"
  uninsuredMotorist?: boolean;
}

/**
 * Auto information section
 */
export interface AutoInfo {
  vehicles?: Vehicle[];
  drivers?: Driver[];
  coverage?: AutoCoverage;
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
