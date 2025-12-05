/**
 * Comparison Types
 *
 * Types for comparison data and document summaries.
 * Story 7.3+
 *
 * @module @/types/compare/comparison
 */

import type { QuoteExtraction } from './extraction';

/**
 * Document summary in comparison.
 */
export interface DocumentSummary {
  id: string;
  filename: string;
  carrierName: string | null;
  extractedAt: string;
  extracted: boolean;
  error?: string;
}

/**
 * Comparison data stored in comparisons table.
 */
export interface ComparisonData {
  status: 'processing' | 'complete' | 'partial' | 'failed';
  documents: DocumentSummary[];
  extractions?: QuoteExtraction[];
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}
