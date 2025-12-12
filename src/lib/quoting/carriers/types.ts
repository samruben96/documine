/**
 * Carrier Types and Interfaces
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * AC-Q4.1-8: Date format MM/DD/YYYY
 * AC-Q4.1-9: Phone format (XXX) XXX-XXXX
 * AC-Q4.1-10: Tab-delimited format
 * AC-Q4.1-11: Handle blank/missing fields gracefully
 * AC-Q4.1-12: Progressive formatter sections
 * AC-Q4.1-13: Travelers formatter sections
 */

import type { QuoteClientData, QuoteType } from '@/types/quoting';

/**
 * Copy button state
 * AC-Q4.1-3: 'copied' shows green check for 2 seconds
 * AC-Q4.1-4: Resets to 'idle' after timeout
 * AC-Q4.1-6: 'error' shows retry option
 */
export type CopyState = 'idle' | 'copying' | 'copied' | 'error';

/**
 * Carrier status for tracking workflow
 * Used in Q4.2 for status badges
 */
export type CarrierStatus = 'not_started' | 'copied' | 'quote_entered';

/**
 * Validation result for missing field detection
 * AC-Q4.1-11: Handle blank/missing fields gracefully
 */
export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

/**
 * Section in formatted preview
 * Used by generatePreview for UI display
 */
export interface PreviewSection {
  label: string;
  fields: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Formatted preview for UI display
 * AC-Q4.1-12, AC-Q4.1-13: Includes all relevant sections
 */
export interface FormattedPreview {
  sections: PreviewSection[];
  rawText: string;
}

/**
 * Carrier formatter interface
 * All carrier formatters must implement this interface
 */
export interface CarrierFormatter {
  /**
   * Format client data for clipboard
   * AC-Q4.1-1, AC-Q4.1-2: Copy formatted data
   * AC-Q4.1-8: Dates as MM/DD/YYYY
   * AC-Q4.1-9: Phones as (XXX) XXX-XXXX
   * AC-Q4.1-10: Tab-delimited output
   *
   * @param data - Client data from quote session
   * @returns Tab-delimited string for clipboard
   */
  formatForClipboard(data: QuoteClientData): string;

  /**
   * Generate preview for UI display
   * Used in Q4.3 preview modal
   *
   * @param data - Client data from quote session
   * @returns Structured preview with sections
   */
  generatePreview(data: QuoteClientData): FormattedPreview;

  /**
   * Validate required fields for this carrier
   * AC-Q4.1-11: Detect missing fields
   *
   * @param data - Client data from quote session
   * @returns Validation result with missing fields
   */
  validateRequiredFields(data: QuoteClientData): ValidationResult;
}

/**
 * Carrier information
 * Registry entry for each supported carrier
 */
export interface CarrierInfo {
  /** Unique carrier code (e.g., 'progressive', 'travelers') */
  code: string;
  /** Display name (e.g., 'Progressive', 'Travelers') */
  name: string;
  /** Portal URL for manual quote entry */
  portalUrl: string;
  /** Path to carrier logo (relative to public/) */
  logoPath: string;
  /** Formatter instance for this carrier */
  formatter: CarrierFormatter;
  /** Lines of business supported */
  linesOfBusiness: Array<'home' | 'auto' | 'bundle'>;
}

/**
 * Get carriers for a specific quote type
 */
export type GetCarriersForQuoteType = (quoteType: QuoteType) => CarrierInfo[];
