/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Orchestrates the full RAG flow:
 * 1. Generate query embedding
 * 2. Hybrid search for similar chunks (vector + FTS)
 * 3. Rerank with Cohere (Story 5.8)
 * 4. Calculate confidence
 * 5. Build prompt with context
 *
 * Story 10.12: Enhanced with structured data from extraction_data
 * for field-specific queries (premium, carrier, dates, etc.)
 *
 * @module @/lib/chat/rag
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.types';
import { generateEmbeddings } from '@/lib/openai/embeddings';
import { searchSimilarChunks, getTopKChunks } from './vector-search';
import { rerankChunks, isRerankerEnabled, getCohereApiKey } from './reranker';
import { calculateConfidence, type ConfidenceLevel } from '@/lib/chat/confidence';
import { classifyIntent } from './intent';
import type { RAGContext, RetrievedChunk, ChatMessage, SourceCitation } from './types';
import type { QuoteExtraction } from '@/types/compare';
import { log } from '@/lib/utils/logger';

/**
 * System prompt for the insurance document assistant
 * Per tech spec RAG Prompt Template
 */
const SYSTEM_PROMPT = `You are a friendly, knowledgeable insurance document assistant for docuMINE.
Think of yourself as a helpful colleague who has thoroughly read the policy and wants to help users understand it clearly.

PERSONALITY:
- Warm and approachable, but professional
- Explain insurance jargon in plain language
- Be direct and get to the point quickly
- Show genuine interest in helping users understand their coverage

CRITICAL RULES:
1. ONLY answer based on the provided document context - never make things up
2. ALWAYS cite page numbers: "On page X, it says..."
3. If you can't find the information, be honest: "I don't see that covered in this document"
4. When the policy language is ambiguous, acknowledge it: "The policy isn't entirely clear on this, but..."
5. For complex topics, break them down into simple bullet points

RESPONSE STYLE:
- Start with a direct answer, then provide supporting details
- Use "you/your" language to make it personal: "Your policy covers..." not "The policy covers..."
- Keep responses concise - aim for 2-3 short paragraphs max
- When quoting policy text, use quotation marks

EXAMPLE PHRASES:
- "Great question! Looking at page X..."
- "Your policy does cover this - here's what I found..."
- "I want to make sure you understand this correctly..."
- "The short answer is yes/no. Here's why..."`;

/**
 * Retrieve relevant chunks and build RAG context
 *
 * Story 5.8: Updated to use hybrid search + Cohere reranking
 *
 * @param supabase - Supabase client with user auth
 * @param documentId - The document to search
 * @param query - The user's question
 * @param openaiApiKey - OpenAI API key for embeddings
 * @returns RAG context with chunks and confidence
 */
export async function retrieveContext(
  supabase: SupabaseClient<Database>,
  documentId: string,
  query: string,
  openaiApiKey: string
): Promise<RAGContext> {
  const startTime = Date.now();

  // Generate query embedding
  const embeddings = await generateEmbeddings([query], openaiApiKey);
  const queryEmbedding = embeddings[0];

  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Step 1: Hybrid search for top 20 candidates
  // AC-5.8.5: Combines vector + FTS with alpha=0.7
  let chunks = await searchSimilarChunks(
    supabase,
    documentId,
    queryEmbedding,
    query, // Pass query text for FTS
    { limit: 20 } // Get 20 candidates for reranking
  );

  // Step 2: Rerank with Cohere (if enabled)
  // AC-5.8.3: Cross-encoder reranking
  if (isRerankerEnabled() && chunks.length > 0) {
    try {
      const cohereApiKey = getCohereApiKey();
      chunks = await rerankChunks(query, chunks, cohereApiKey, { topN: 5 });
    } catch (error) {
      // AC-5.8.4: Fallback to top 5 without reranking
      log.warn('Reranker unavailable, using top 5 from hybrid search', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      chunks = getTopKChunks(chunks, 5);
    }
  } else {
    // No reranker - just take top 5
    chunks = getTopKChunks(chunks, 5);
  }

  // Story 6.2: Calculate confidence using appropriate scores and query intent
  const firstChunk = chunks[0];
  const vectorScore = firstChunk?.similarityScore ?? null;
  const rerankerScore = firstChunk?.rerankerScore;
  const queryIntent = classifyIntent(query);
  const confidence = calculateConfidence(vectorScore, rerankerScore, queryIntent);

  // Story 6.2 AC-6.2.6: Score logging for debugging
  // Keep topScore for backward compatibility with RAGContext interface
  const topScore = vectorScore;
  const duration = Date.now() - startTime;
  log.info('RAG context retrieved', {
    documentId,
    chunksRetrieved: chunks.length,
    vectorScore,
    rerankerScore: rerankerScore ?? null,
    queryIntent,
    confidence,
    rerankerUsed: isRerankerEnabled(),
    duration,
  });

  return {
    chunks,
    topScore,
    confidence,
  };
}

/**
 * Build the full prompt for the LLM
 *
 * @param query - The user's question
 * @param chunks - Retrieved document chunks
 * @param conversationHistory - Previous messages for context
 * @returns The messages array for OpenAI chat completion
 */
export function buildPrompt(
  query: string,
  chunks: RetrievedChunk[],
  conversationHistory: ChatMessage[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // System prompt
  messages.push({
    role: 'system',
    content: SYSTEM_PROMPT,
  });

  // Build context from chunks
  let contextPrompt = '';

  if (chunks.length > 0) {
    contextPrompt = 'DOCUMENT CONTEXT (from the uploaded policy):\n';
    contextPrompt += chunks
      .map((c) => `[Page ${c.pageNumber}]: ${c.content}`)
      .join('\n\n');
    contextPrompt += '\n\n';
  } else {
    contextPrompt = 'DOCUMENT CONTEXT: No relevant sections found for this query.\n\n';
  }

  // Add conversation history (last 10 messages)
  if (conversationHistory.length > 0) {
    contextPrompt += 'CONVERSATION HISTORY:\n';
    contextPrompt += conversationHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    contextPrompt += '\n\n';
  }

  // Add user question
  contextPrompt += `USER QUESTION: ${query}\n\n`;
  contextPrompt += 'Please answer the question based on the document context. Cite specific page numbers.';

  messages.push({
    role: 'user',
    content: contextPrompt,
  });

  return messages;
}

/**
 * Convert retrieved chunks to source citations for storage
 *
 * @param chunks - Retrieved chunks from vector search
 * @returns Source citations for database storage
 */
export function chunksToSourceCitations(chunks: RetrievedChunk[]): SourceCitation[] {
  return chunks.map((chunk) => ({
    pageNumber: chunk.pageNumber,
    text: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    chunkId: chunk.id,
    boundingBox: chunk.boundingBox ?? undefined,
    similarityScore: chunk.similarityScore,
  }));
}

/**
 * Get the "not found" response message
 * Per AC-5.3.7
 */
export function getNotFoundMessage(): string {
  return "I couldn't find information about that in this document.";
}

/**
 * Check if we should use the "not found" response
 *
 * @param confidence - The calculated confidence level
 * @returns True if we should show the not found message
 */
export function shouldShowNotFound(confidence: ConfidenceLevel): boolean {
  return confidence === 'not_found';
}

// ============================================================================
// Story 10.12: Structured Data Integration
// ============================================================================

/**
 * Retrieve extraction data from document for structured field queries.
 *
 * AC-10.12.6: When user asks about specific fields (premium, carrier, dates),
 * the RAG system can answer from extraction_data without requiring vector search.
 *
 * @param supabase - Supabase client
 * @param documentId - The document to retrieve extraction for
 * @returns Extraction data if available, null otherwise
 */
export async function getStructuredExtractionData(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<QuoteExtraction | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('extraction_data')
    .eq('id', documentId)
    .maybeSingle();

  if (error || !data?.extraction_data) {
    return null;
  }

  return data.extraction_data as unknown as QuoteExtraction;
}

/**
 * Format extraction data as structured context for the LLM.
 * Provides key fields in a clear, structured format.
 *
 * @param extraction - The extraction data
 * @returns Formatted string for inclusion in prompt
 */
export function formatStructuredContext(extraction: QuoteExtraction): string {
  const lines: string[] = ['STRUCTURED POLICY DATA (pre-extracted):'];

  // Basic policy info
  if (extraction.carrierName) {
    lines.push(`• Carrier: ${extraction.carrierName}`);
  }
  if (extraction.policyNumber) {
    lines.push(`• Policy Number: ${extraction.policyNumber}`);
  }
  if (extraction.namedInsured) {
    lines.push(`• Named Insured: ${extraction.namedInsured}`);
  }

  // Dates
  if (extraction.effectiveDate || extraction.expirationDate) {
    const dates = [];
    if (extraction.effectiveDate) dates.push(`Effective: ${extraction.effectiveDate}`);
    if (extraction.expirationDate) dates.push(`Expires: ${extraction.expirationDate}`);
    lines.push(`• Policy Period: ${dates.join(' to ')}`);
  }

  // Premium
  if (extraction.annualPremium) {
    lines.push(`• Annual Premium: $${extraction.annualPremium.toLocaleString()}`);
  }

  // Premium breakdown (Story 10.6)
  if (extraction.premiumBreakdown) {
    const pb = extraction.premiumBreakdown;
    if (pb.basePremium) {
      lines.push(`• Base Premium: $${pb.basePremium.toLocaleString()}`);
    }
    if (pb.taxes) {
      lines.push(`• Taxes: $${pb.taxes.toLocaleString()}`);
    }
    if (pb.fees) {
      lines.push(`• Fees: $${pb.fees.toLocaleString()}`);
    }
    if (pb.paymentPlan) {
      lines.push(`• Payment Plan: ${pb.paymentPlan}`);
    }
  }

  // Carrier info (Story 10.5)
  if (extraction.carrierInfo) {
    const ci = extraction.carrierInfo;
    if (ci.amBestRating) {
      lines.push(`• AM Best Rating: ${ci.amBestRating}`);
    }
    if (ci.admittedStatus) {
      lines.push(`• Carrier Status: ${ci.admittedStatus}`);
    }
  }

  // Coverages summary
  if (extraction.coverages && extraction.coverages.length > 0) {
    lines.push('\nCoverages:');
    for (const cov of extraction.coverages.slice(0, 10)) { // Limit to 10 for prompt length
      const limit = cov.limit ? `$${cov.limit.toLocaleString()}` : 'N/A';
      const deductible = cov.deductible ? ` (Ded: $${cov.deductible.toLocaleString()})` : '';
      const pages = cov.sourcePages?.length ? ` [Page ${cov.sourcePages.join(', ')}]` : '';
      lines.push(`  - ${cov.name}: ${limit}${deductible}${pages}`);
    }
    if (extraction.coverages.length > 10) {
      lines.push(`  ... and ${extraction.coverages.length - 10} more coverages`);
    }
  }

  // Deductibles summary
  if (extraction.deductibles && extraction.deductibles.length > 0) {
    lines.push('\nDeductibles:');
    for (const ded of extraction.deductibles.slice(0, 5)) {
      const pages = ded.sourcePages?.length ? ` [Page ${ded.sourcePages.join(', ')}]` : '';
      lines.push(`  - ${ded.type}: $${ded.amount.toLocaleString()}${pages}`);
    }
  }

  // Exclusions summary
  if (extraction.exclusions && extraction.exclusions.length > 0) {
    lines.push('\nKey Exclusions:');
    for (const exc of extraction.exclusions.slice(0, 5)) {
      const pages = exc.sourcePages?.length ? ` [Page ${exc.sourcePages.join(', ')}]` : '';
      lines.push(`  - ${exc.name}${pages}`);
    }
  }

  // Endorsements summary (Story 10.4)
  if (extraction.endorsements && extraction.endorsements.length > 0) {
    lines.push('\nEndorsements:');
    for (const end of extraction.endorsements.slice(0, 5)) {
      const pages = end.sourcePages?.length ? ` [Page ${end.sourcePages.join(', ')}]` : '';
      lines.push(`  - ${end.formNumber || 'N/A'}: ${end.name} (${end.type})${pages}`);
    }
  }

  return lines.join('\n');
}

/**
 * Build the full prompt with both structured and unstructured context.
 *
 * Story 10.12: Enhanced to include structured extraction data when available.
 *
 * @param query - The user's question
 * @param chunks - Retrieved document chunks
 * @param conversationHistory - Previous messages for context
 * @param structuredContext - Optional formatted structured data
 * @returns The messages array for OpenAI chat completion
 */
export function buildPromptWithStructuredData(
  query: string,
  chunks: RetrievedChunk[],
  conversationHistory: ChatMessage[],
  structuredContext?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // System prompt
  messages.push({
    role: 'system',
    content: SYSTEM_PROMPT,
  });

  // Build context
  let contextPrompt = '';

  // Include structured data first (if available)
  if (structuredContext) {
    contextPrompt += structuredContext;
    contextPrompt += '\n\n';
  }

  // Then unstructured chunk context
  if (chunks.length > 0) {
    contextPrompt += 'DOCUMENT CONTEXT (from the uploaded policy):\n';
    contextPrompt += chunks
      .map((c) => `[Page ${c.pageNumber}]: ${c.content}`)
      .join('\n\n');
    contextPrompt += '\n\n';
  } else if (!structuredContext) {
    contextPrompt += 'DOCUMENT CONTEXT: No relevant sections found for this query.\n\n';
  }

  // Add conversation history (last 10 messages)
  if (conversationHistory.length > 0) {
    contextPrompt += 'CONVERSATION HISTORY:\n';
    contextPrompt += conversationHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    contextPrompt += '\n\n';
  }

  // Add user question
  contextPrompt += `USER QUESTION: ${query}\n\n`;
  contextPrompt += 'Please answer the question based on the document context. Cite specific page numbers when available.';

  messages.push({
    role: 'user',
    content: contextPrompt,
  });

  return messages;
}
