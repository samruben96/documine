/**
 * Quote Extraction Service
 *
 * GPT-5.1 structured outputs for data extraction from insurance quote documents.
 * Uses OpenAI SDK's zodResponseFormat for guaranteed schema-compliant responses.
 *
 * Story 7.2: AC-7.2.1, AC-7.2.2, AC-7.2.3, AC-7.2.4, AC-7.2.7, AC-7.2.8
 *
 * @module @/lib/compare/extraction
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import {
  QuoteExtraction,
  ExtractionResult,
  ExtractionOptions,
  EXTRACTION_VERSION,
  quoteExtractionSchema,
} from '@/types/compare';
import { log } from '@/lib/utils/logger';

// ============================================================================
// Configuration
// ============================================================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const EXTRACTION_TIMEOUT_MS = 60000; // 60 seconds per AC-7.2.7
const MODEL = 'gpt-5.1';

/**
 * System prompt for insurance document extraction.
 * Guides GPT-5.1 to extract structured data from quote documents.
 */
const EXTRACTION_SYSTEM_PROMPT = `You are an expert insurance document analyst.
Your task is to extract structured data from insurance quote documents.

IMPORTANT GUIDELINES:
- Extract exact values as they appear in the document
- For each extracted item, include the page number(s) where it appears
- If a field is not found in the document, omit it or set to null
- Do NOT guess or infer values that are not explicitly stated
- For currency amounts, extract the numeric value only (no $ or commas)
- For dates, use YYYY-MM-DD format

COVERAGE TYPE MAPPINGS:
- "General Liability", "CGL", "Commercial General Liability" → general_liability
- "Property", "Building", "Business Personal Property", "BPP" → property
- "Auto Liability", "Automobile Liability", "Commercial Auto" → auto_liability
- "Physical Damage", "Collision", "Comprehensive", "Auto Physical" → auto_physical_damage
- "Umbrella", "Excess Liability", "Excess" → umbrella
- "Workers Compensation", "WC", "Workers' Comp" → workers_comp
- "Professional Liability", "E&O", "Errors and Omissions", "Malpractice" → professional_liability
- "Cyber Liability", "Data Breach", "Network Security" → cyber
- Other coverages → other

EXCLUSION CATEGORY MAPPINGS:
- Flood, water damage, rising water → flood
- Earthquake, earth movement, seismic → earthquake
- Pollution, contamination, environmental → pollution
- Mold, fungus, mildew → mold
- Cyber, data breach, network (when excluded) → cyber
- Employment practices, EPLI, discrimination → employment
- Other exclusions → other

LIMIT TYPE MAPPINGS:
- "Each Occurrence", "Per Occurrence", "Per Claim" → per_occurrence
- "Aggregate", "Annual Aggregate", "Policy Aggregate" → aggregate
- "Per Person", "Each Person" → per_person
- "CSL", "Combined Single Limit" → combined_single`;

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract structured quote data from a document.
 *
 * AC-7.2.1: Uses GPT-4o function calling with defined schema
 * AC-7.2.4: Source reference tracking via page numbers
 * AC-7.2.7: Completes within 60 seconds per document
 * AC-7.2.8: Returns partial results on failure
 *
 * @param supabase - Authenticated Supabase client
 * @param documentId - Document to extract from
 * @param agencyId - Agency owning the document
 * @param options - Extraction options
 * @returns Extraction result with success status
 */
export async function extractQuoteData(
  supabase: SupabaseClient<Database>,
  documentId: string,
  agencyId: string,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();

  log.info('Starting quote extraction', {
    documentId,
    agencyId,
    forceRefresh: options.forceRefresh ?? false,
  });

  // Check cache first (unless forceRefresh)
  if (!options.forceRefresh) {
    const cached = await getCachedExtraction(supabase, documentId);
    if (cached) {
      log.info('Returning cached extraction', {
        documentId,
        cachedAt: cached.extractedAt,
      });
      return {
        success: true,
        extraction: cached,
        cached: true,
      };
    }
  }

  // Fetch document chunks
  const chunks = await fetchDocumentChunks(supabase, documentId);

  if (chunks.length === 0) {
    log.warn('No chunks found for document', { documentId });
    return {
      success: false,
      cached: false,
      error: {
        code: 'NO_CHUNKS',
        message: 'Document has no processed content',
        documentId,
      },
    };
  }

  // Build context from chunks
  const context = buildExtractionContext(chunks);

  // Call GPT-5.1 for extraction
  try {
    const extraction = await callGPTExtraction(context, documentId);

    // Cache the result
    await cacheExtraction(supabase, documentId, agencyId, extraction);

    const duration = Date.now() - startTime;
    log.info('Extraction completed', {
      documentId,
      duration,
      coverageCount: extraction.coverages.length,
      exclusionCount: extraction.exclusions.length,
      deductibleCount: extraction.deductibles.length,
    });

    return {
      success: true,
      extraction,
      cached: false,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log.warn('Extraction failed', {
      documentId,
      duration,
      error: errorMessage,
    });

    // Determine error code
    let code: 'TIMEOUT' | 'API_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' = 'API_ERROR';
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      code = 'TIMEOUT';
    } else if (errorMessage.includes('parse') || errorMessage.includes('Parse')) {
      code = 'PARSE_ERROR';
    } else if (errorMessage.includes('validation') || errorMessage.includes('Validation')) {
      code = 'VALIDATION_ERROR';
    }

    return {
      success: false,
      cached: false,
      error: {
        code,
        message: errorMessage,
        documentId,
      },
    };
  }
}

// ============================================================================
// Database Operations
// ============================================================================

interface DocumentChunk {
  id: string;
  content: string;
  page_number: number;
  chunk_index: number;
}

/**
 * Fetch all document chunks ordered by page and chunk index.
 * Uses all chunks (no vector search) for comprehensive extraction.
 */
async function fetchDocumentChunks(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<DocumentChunk[]> {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('id, content, page_number, chunk_index')
    .eq('document_id', documentId)
    .order('page_number', { ascending: true })
    .order('chunk_index', { ascending: true });

  if (error) {
    log.warn('Failed to fetch document chunks', { documentId, error: error.message });
    throw new Error(`Failed to fetch document chunks: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Get cached extraction from quote_extractions table.
 * AC-7.2.5: Check cache before extraction
 * AC-7.2.6: Validate extraction_version matches current
 */
async function getCachedExtraction(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<QuoteExtraction | null> {
  const { data, error } = await supabase
    .from('quote_extractions')
    .select('extracted_data, extraction_version')
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) {
    log.warn('Failed to check extraction cache', { documentId, error: error.message });
    return null;
  }

  if (!data) {
    return null;
  }

  // Check version - invalidate if different
  if (data.extraction_version !== EXTRACTION_VERSION) {
    log.info('Cache invalidated due to version mismatch', {
      documentId,
      cachedVersion: data.extraction_version,
      currentVersion: EXTRACTION_VERSION,
    });
    return null;
  }

  return data.extracted_data as unknown as QuoteExtraction;
}

/**
 * Cache extraction result in quote_extractions table.
 * AC-7.2.5: Store for future retrieval
 * AC-7.2.6: Include extraction_version
 */
async function cacheExtraction(
  supabase: SupabaseClient<Database>,
  documentId: string,
  agencyId: string,
  extraction: QuoteExtraction
): Promise<void> {
  const { error } = await supabase.from('quote_extractions').upsert(
    {
      document_id: documentId,
      agency_id: agencyId,
      extracted_data: extraction as unknown as Database['public']['Tables']['quote_extractions']['Insert']['extracted_data'],
      extraction_version: EXTRACTION_VERSION,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'document_id,extraction_version',
      ignoreDuplicates: false,
    }
  );

  if (error) {
    log.warn('Failed to cache extraction', { documentId, error: error.message });
    // Don't throw - caching failure shouldn't fail the extraction
  }
}

// ============================================================================
// Context Building
// ============================================================================

/**
 * Build extraction context from document chunks.
 * Formats chunks with page numbers for source tracking.
 */
function buildExtractionContext(chunks: DocumentChunk[]): string {
  const parts: string[] = [];
  let currentPage = -1;

  for (const chunk of chunks) {
    // Add page separator when page changes
    if (chunk.page_number !== currentPage) {
      currentPage = chunk.page_number;
      parts.push(`\n--- PAGE ${currentPage} ---\n`);
    }

    parts.push(chunk.content);
  }

  return parts.join('\n');
}

// ============================================================================
// GPT-5.1 Structured Output Extraction
// ============================================================================

/**
 * Call GPT-5.1 with zodResponseFormat for structured extraction.
 * Uses OpenAI SDK's structured outputs for guaranteed schema compliance.
 * Implements retry with exponential backoff.
 */
async function callGPTExtraction(
  context: string,
  documentId: string
): Promise<QuoteExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({ apiKey });

  let lastError: Error | null = null;
  let delay = INITIAL_RETRY_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use structured outputs with zodResponseFormat for guaranteed schema compliance
      const response = await Promise.race([
        openai.chat.completions.parse({
          model: MODEL,
          messages: [
            { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Extract structured insurance quote data from the following document:\n\n${context}`,
            },
          ],
          response_format: zodResponseFormat(quoteExtractionSchema, 'quote_extraction'),
          temperature: 0.1, // Low temperature for consistent extraction
        }),
        timeoutPromise(EXTRACTION_TIMEOUT_MS),
      ]);

      // Get parsed response - already validated against Zod schema
      const parsed = response.choices[0]?.message?.parsed;
      if (!parsed) {
        throw new Error('No parsed response from GPT-5.1');
      }

      // Build extraction with explicit null handling for optional fields
      // (Zod optional() returns undefined, but our interface expects null)
      const extraction: QuoteExtraction = {
        carrierName: parsed.carrierName ?? null,
        policyNumber: parsed.policyNumber ?? null,
        namedInsured: parsed.namedInsured ?? null,
        effectiveDate: parsed.effectiveDate ?? null,
        expirationDate: parsed.expirationDate ?? null,
        annualPremium: parsed.annualPremium ?? null,
        coverages: parsed.coverages,
        exclusions: parsed.exclusions,
        deductibles: parsed.deductibles,
        extractedAt: new Date().toISOString(),
        modelUsed: MODEL,
      };

      return extraction;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }

      log.warn('Extraction attempt failed, retrying', {
        documentId,
        attempt,
        maxRetries: MAX_RETRIES,
        error: lastError.message,
        delay,
      });

      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw new Error(`Extraction failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a timeout promise for extraction deadline.
 */
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
}

/**
 * Check if error is retryable (rate limit, server error).
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    // Retry on rate limits (429) and server errors (5xx)
    return error.status === 429 || (error.status ?? 0) >= 500;
  }

  // Retry on network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset')
    );
  }

  return false;
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
