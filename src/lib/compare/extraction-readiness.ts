/**
 * Extraction Readiness Utilities
 *
 * Story 11.7: Comparison Page - Extraction Status Handling
 * AC-11.7.1: Extraction Status Detection
 *
 * Identifies documents by their extraction status to determine
 * if comparison can proceed or if we need to show pending/failed states.
 */

import type { ExtractionStatus } from '@/types';

/**
 * Document with extraction status information
 */
export interface DocumentWithExtraction {
  id: string;
  filename: string;
  display_name: string | null;
  status: string;
  extraction_status: ExtractionStatus | null;
  extraction_data: unknown | null;
  page_count?: number | null;
  created_at: string;
  document_type?: 'quote' | 'general' | null;
}

/**
 * Result of extraction readiness check
 */
export interface ExtractionReadiness {
  /** True if all documents are ready for comparison */
  allReady: boolean;
  /** Documents with complete extraction data */
  readyDocs: DocumentWithExtraction[];
  /** Documents waiting in queue for extraction */
  pendingDocs: DocumentWithExtraction[];
  /** Documents currently being extracted */
  extractingDocs: DocumentWithExtraction[];
  /** Documents where extraction failed */
  failedDocs: DocumentWithExtraction[];
  /** Documents where extraction was skipped (non-quote docs) */
  skippedDocs: DocumentWithExtraction[];
}

/**
 * Check extraction readiness for a set of documents
 *
 * Categorizes documents by their extraction_status:
 * - complete: Has extraction_data, ready for comparison
 * - pending: Waiting in queue for extraction
 * - extracting: Currently being processed by extract-quote-data
 * - failed: Extraction failed (may allow retry)
 * - skipped: Document type doesn't require extraction
 * - null: Legacy support - if extraction_data exists, treat as complete
 *
 * @param documents - Array of documents to check
 * @returns ExtractionReadiness object with categorized documents
 */
export function getExtractionReadiness(
  documents: DocumentWithExtraction[]
): ExtractionReadiness {
  const readyDocs: DocumentWithExtraction[] = [];
  const pendingDocs: DocumentWithExtraction[] = [];
  const extractingDocs: DocumentWithExtraction[] = [];
  const failedDocs: DocumentWithExtraction[] = [];
  const skippedDocs: DocumentWithExtraction[] = [];

  for (const doc of documents) {
    const status = doc.extraction_status;

    // Complete status - extraction finished successfully
    if (status === 'complete') {
      readyDocs.push(doc);
      continue;
    }

    // Skipped status - document doesn't require extraction (e.g., general docs)
    if (status === 'skipped') {
      skippedDocs.push(doc);
      continue;
    }

    // Pending status - waiting in queue
    if (status === 'pending') {
      // Edge case: Has extraction_data from legacy processing
      if (doc.extraction_data !== null) {
        readyDocs.push(doc);
      } else {
        pendingDocs.push(doc);
      }
      continue;
    }

    // Extracting status - currently being processed
    if (status === 'extracting') {
      extractingDocs.push(doc);
      continue;
    }

    // Failed status - extraction failed
    if (status === 'failed') {
      // Edge case: Has partial data from previous attempt
      if (doc.extraction_data !== null) {
        readyDocs.push(doc);
      } else {
        failedDocs.push(doc);
      }
      continue;
    }

    // Null status - legacy document processed before Story 11.6
    // Check if it has extraction_data from earlier processing
    if (status === null) {
      if (doc.extraction_data !== null) {
        readyDocs.push(doc);
      } else {
        // No extraction data and no status - treat as pending
        pendingDocs.push(doc);
      }
      continue;
    }
  }

  // All ready if no pending or extracting documents
  // Failed docs can optionally proceed with partial data
  const allReady =
    pendingDocs.length === 0 && extractingDocs.length === 0;

  return {
    allReady,
    readyDocs,
    pendingDocs,
    extractingDocs,
    failedDocs,
    skippedDocs,
  };
}

/**
 * Estimate extraction time based on document page count
 *
 * Based on Story 10.12 extraction timing:
 * - ~2 seconds per page for GPT-5.1 extraction
 * - Minimum 15 seconds for small documents
 * - Maximum 120 seconds cap
 *
 * @param documents - Documents to estimate
 * @returns Estimated seconds for extraction
 */
export function estimateExtractionTime(
  documents: DocumentWithExtraction[]
): number {
  const totalPages = documents.reduce(
    (sum, doc) => sum + (doc.page_count || 10), // Default 10 pages if unknown
    0
  );

  const estimatedSeconds = Math.ceil(totalPages * 2);

  // Apply min/max bounds
  return Math.min(Math.max(estimatedSeconds, 15), 120);
}

/**
 * Get summary message for extraction readiness
 *
 * @param readiness - ExtractionReadiness object
 * @returns Human-readable status message
 */
export function getReadinessMessage(readiness: ExtractionReadiness): string {
  const { pendingDocs, extractingDocs, failedDocs, readyDocs } = readiness;

  const notReady = pendingDocs.length + extractingDocs.length;
  const total = notReady + readyDocs.length + failedDocs.length;

  if (readiness.allReady && failedDocs.length === 0) {
    return 'All documents ready for comparison';
  }

  if (readiness.allReady && failedDocs.length > 0) {
    return `${readyDocs.length} of ${total} ready (${failedDocs.length} failed)`;
  }

  if (extractingDocs.length > 0) {
    return `Analyzing ${extractingDocs.length} document${extractingDocs.length > 1 ? 's' : ''}...`;
  }

  if (pendingDocs.length > 0) {
    return `Waiting for ${pendingDocs.length} document${pendingDocs.length > 1 ? 's' : ''}`;
  }

  return `${readyDocs.length} of ${total} documents ready`;
}
