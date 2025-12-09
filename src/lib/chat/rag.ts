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
 * Story 17.1: Added conversation attachment chunk retrieval
 * for AI Buddy document context (AC-17.1.4).
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

// ============================================================================
// Story 17.1: Conversation Attachment RAG
// ============================================================================

/**
 * Attachment info for RAG context
 */
export interface AttachmentInfo {
  documentId: string;
  documentName: string;
  status: string;
}

/**
 * Retrieved chunk with document context for AI Buddy conversations
 */
export interface ConversationChunk extends RetrievedChunk {
  documentId: string;
  documentName: string;
}

/**
 * Get attachment info for a conversation.
 *
 * Story 17.1: Retrieves document IDs linked to the conversation.
 *
 * @param supabase - Supabase client
 * @param conversationId - The conversation ID
 * @returns Array of attachment info with document IDs and names
 */
export async function getConversationAttachments(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<AttachmentInfo[]> {
  const { data, error } = await supabase
    .from('ai_buddy_conversation_documents')
    .select(`
      document_id,
      documents!inner (
        id,
        filename,
        status
      )
    `)
    .eq('conversation_id', conversationId);

  if (error) {
    log.error(
      'Failed to get conversation attachments',
      new Error(error.message),
      { conversationId }
    );
    return [];
  }

  return (data || []).map((att) => {
    const doc = att.documents as unknown as {
      id: string;
      filename: string;
      status: string;
    };
    return {
      documentId: doc.id,
      documentName: doc.filename,
      status: doc.status,
    };
  });
}

/**
 * Retrieve chunks from all conversation attachments.
 *
 * Story 17.1: AC-17.1.4 - AI references documents with page-level citations.
 *
 * @param supabase - Supabase client
 * @param conversationId - The conversation ID
 * @param query - The user's question
 * @param openaiApiKey - OpenAI API key for embeddings
 * @returns Retrieved chunks with document context
 */
export async function getConversationAttachmentChunks(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  query: string,
  openaiApiKey: string
): Promise<{ chunks: ConversationChunk[]; confidence: ConfidenceLevel; attachments: AttachmentInfo[] }> {
  const startTime = Date.now();

  // Get all attachments for the conversation
  const attachments = await getConversationAttachments(supabase, conversationId);

  // Filter to only ready documents
  const readyAttachments = attachments.filter((att) => att.status === 'ready');

  if (readyAttachments.length === 0) {
    log.info('No ready attachments for conversation', { conversationId });
    return {
      chunks: [],
      confidence: 'not_found',
      attachments,
    };
  }

  // Generate query embedding
  const embeddings = await generateEmbeddings([query], openaiApiKey);
  const queryEmbedding = embeddings[0];

  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Search across all attached documents
  const allChunks: ConversationChunk[] = [];

  for (const attachment of readyAttachments) {
    try {
      // Search for similar chunks in this document
      const chunks = await searchSimilarChunks(
        supabase,
        attachment.documentId,
        queryEmbedding,
        query,
        { limit: 5 } // Get top 5 from each document
      );

      // Add document context to each chunk
      for (const chunk of chunks) {
        allChunks.push({
          ...chunk,
          documentId: attachment.documentId,
          documentName: attachment.documentName,
        });
      }
    } catch (err) {
      log.error(
        'Failed to search document chunks',
        err instanceof Error ? err : new Error(String(err)),
        { documentId: attachment.documentId }
      );
    }
  }

  // Sort all chunks by similarity score and take top 10
  allChunks.sort((a, b) => b.similarityScore - a.similarityScore);
  const topChunks = allChunks.slice(0, 10);

  // Rerank with Cohere if enabled
  let finalChunks = topChunks;
  if (isRerankerEnabled() && topChunks.length > 0) {
    try {
      const cohereApiKey = getCohereApiKey();
      const reranked = await rerankChunks(query, topChunks, cohereApiKey, { topN: 5 });
      // Preserve document context after reranking
      finalChunks = reranked.map((chunk) => {
        const original = topChunks.find((c) => c.id === chunk.id);
        return {
          ...chunk,
          documentId: original?.documentId ?? '',
          documentName: original?.documentName ?? '',
        };
      });
    } catch (error) {
      log.warn('Reranker unavailable, using top chunks', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      finalChunks = topChunks.slice(0, 5);
    }
  } else {
    finalChunks = topChunks.slice(0, 5);
  }

  // Calculate confidence
  const firstChunk = finalChunks[0];
  const vectorScore = firstChunk?.similarityScore ?? null;
  const rerankerScore = firstChunk?.rerankerScore;
  const queryIntent = classifyIntent(query);
  const confidence = calculateConfidence(vectorScore, rerankerScore, queryIntent);

  const duration = Date.now() - startTime;
  log.info('Conversation attachment chunks retrieved', {
    conversationId,
    documentCount: readyAttachments.length,
    chunksRetrieved: finalChunks.length,
    confidence,
    duration,
  });

  return {
    chunks: finalChunks,
    confidence,
    attachments,
  };
}

/**
 * Build prompt for AI Buddy with conversation attachment context.
 *
 * Story 17.1: AC-17.1.4 - Format context with document titles and page citations.
 *
 * @param query - The user's question
 * @param chunks - Retrieved chunks from conversation attachments
 * @param conversationHistory - Previous messages
 * @returns Messages array for OpenAI chat completion
 */
export function buildConversationPrompt(
  query: string,
  chunks: ConversationChunk[],
  conversationHistory: ChatMessage[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const promptMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // System prompt for AI Buddy (slightly different from document chat)
  const aiBuddySystemPrompt = `You are AI Buddy, a knowledgeable insurance assistant for docuMINE.
You help insurance professionals understand their policy documents and answer questions about coverage.

PERSONALITY:
- Friendly and professional
- Clear and direct in your explanations
- Helpful and thorough

CRITICAL RULES:
1. ONLY answer based on the provided document context - never make assumptions
2. ALWAYS cite the document name and page number: "In [Document Name], page X..."
3. If information isn't in the documents, say so honestly
4. When quoting policy text, use quotation marks

RESPONSE STYLE:
- Start with a direct answer, then provide supporting details
- Use "your" language to make it personal
- Keep responses concise - 2-3 paragraphs max`;

  promptMessages.push({
    role: 'system',
    content: aiBuddySystemPrompt,
  });

  // Build context from chunks, grouped by document
  let contextPrompt = '';

  if (chunks.length > 0) {
    // Group chunks by document
    const chunksByDocument = new Map<string, ConversationChunk[]>();
    for (const chunk of chunks) {
      const existing = chunksByDocument.get(chunk.documentId) || [];
      existing.push(chunk);
      chunksByDocument.set(chunk.documentId, existing);
    }

    contextPrompt = 'DOCUMENT CONTEXT:\n\n';

    for (const [_docId, docChunks] of chunksByDocument) {
      const docName = docChunks[0]?.documentName ?? 'Unknown Document';
      contextPrompt += `--- ${docName} ---\n`;
      contextPrompt += docChunks
        .map((c) => `[Page ${c.pageNumber}]: ${c.content}`)
        .join('\n\n');
      contextPrompt += '\n\n';
    }
  } else {
    contextPrompt = 'DOCUMENT CONTEXT: No relevant sections found in the attached documents.\n\n';
  }

  // Add conversation history
  if (conversationHistory.length > 0) {
    contextPrompt += 'CONVERSATION HISTORY:\n';
    contextPrompt += conversationHistory
      .slice(-10) // Last 10 messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    contextPrompt += '\n\n';
  }

  // Add user question
  contextPrompt += `USER QUESTION: ${query}\n\n`;
  contextPrompt += 'Please answer based on the documents above. Cite the document name and page numbers.';

  promptMessages.push({
    role: 'user',
    content: contextPrompt,
  });

  return promptMessages;
}

/**
 * Convert conversation chunks to source citations.
 *
 * Story 17.1: AC-17.1.4 - Include document ID and name in citations.
 *
 * @param chunks - Retrieved conversation chunks
 * @returns Source citations for database storage
 */
export function conversationChunksToCitations(chunks: ConversationChunk[]): SourceCitation[] {
  return chunks.map((chunk) => ({
    pageNumber: chunk.pageNumber,
    text: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    chunkId: chunk.id,
    boundingBox: chunk.boundingBox ?? undefined,
    similarityScore: chunk.similarityScore,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
  }));
}

// ============================================================================
// Story 17.2: Project Document RAG
// ============================================================================

/**
 * Get document info for a project.
 *
 * Story 17.2: Retrieves document IDs linked to the project.
 *
 * @param supabase - Supabase client
 * @param projectId - The project ID
 * @returns Array of attachment info with document IDs and names
 */
export async function getProjectDocuments(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<AttachmentInfo[]> {
  const { data, error } = await supabase
    .from('ai_buddy_project_documents')
    .select(`
      document_id,
      documents!inner (
        id,
        filename,
        status,
        extraction_data
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    log.error(
      'Failed to get project documents',
      new Error(error.message),
      { projectId }
    );
    return [];
  }

  return (data || []).map((pd) => {
    const doc = pd.documents as unknown as {
      id: string;
      filename: string;
      status: string;
      extraction_data: unknown;
    };
    return {
      documentId: doc.id,
      documentName: doc.filename,
      status: doc.status,
    };
  });
}

/**
 * Retrieve chunks from all project documents.
 *
 * Story 17.2: AC-17.2.7 - Project documents provide context for AI responses.
 * Also includes structured extraction data from quote documents.
 *
 * @param supabase - Supabase client
 * @param projectId - The project ID
 * @param query - The user's question
 * @param openaiApiKey - OpenAI API key for embeddings
 * @returns Retrieved chunks with document context
 */
export async function getProjectDocumentChunks(
  supabase: SupabaseClient<Database>,
  projectId: string,
  query: string,
  openaiApiKey: string
): Promise<{ chunks: ConversationChunk[]; confidence: ConfidenceLevel; documents: AttachmentInfo[]; structuredContext?: string }> {
  const startTime = Date.now();

  // Get all documents for the project
  const documents = await getProjectDocuments(supabase, projectId);

  // Filter to only ready documents
  const readyDocuments = documents.filter((doc) => doc.status === 'ready');

  if (readyDocuments.length === 0) {
    log.info('No ready documents for project', { projectId });
    return {
      chunks: [],
      confidence: 'not_found',
      documents,
    };
  }

  // Generate query embedding
  const embeddings = await generateEmbeddings([query], openaiApiKey);
  const queryEmbedding = embeddings[0];

  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Search across all project documents
  const allChunks: ConversationChunk[] = [];

  for (const document of readyDocuments) {
    try {
      // Search for similar chunks in this document
      const chunks = await searchSimilarChunks(
        supabase,
        document.documentId,
        queryEmbedding,
        query,
        { limit: 5 } // Get top 5 from each document
      );

      // Add document context to each chunk
      for (const chunk of chunks) {
        allChunks.push({
          ...chunk,
          documentId: document.documentId,
          documentName: document.documentName,
        });
      }
    } catch (err) {
      log.error(
        'Failed to search project document chunks',
        err instanceof Error ? err : new Error(String(err)),
        { documentId: document.documentId }
      );
    }
  }

  // Sort all chunks by similarity score and take top 10
  allChunks.sort((a, b) => b.similarityScore - a.similarityScore);
  const topChunks = allChunks.slice(0, 10);

  // Rerank with Cohere if enabled
  let finalChunks = topChunks;
  if (isRerankerEnabled() && topChunks.length > 0) {
    try {
      const cohereApiKey = getCohereApiKey();
      const reranked = await rerankChunks(query, topChunks, cohereApiKey, { topN: 5 });
      // Preserve document context after reranking
      finalChunks = reranked.map((chunk) => {
        const original = topChunks.find((c) => c.id === chunk.id);
        return {
          ...chunk,
          documentId: original?.documentId ?? '',
          documentName: original?.documentName ?? '',
        };
      });
    } catch (error) {
      log.warn('Reranker unavailable for project docs, using top chunks', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      finalChunks = topChunks.slice(0, 5);
    }
  } else {
    finalChunks = topChunks.slice(0, 5);
  }

  // AC-17.2.7: Also get structured extraction data from quote documents
  let structuredContext: string | undefined;
  try {
    const structuredParts: string[] = [];
    for (const document of readyDocuments) {
      const extraction = await getStructuredExtractionData(supabase, document.documentId);
      if (extraction) {
        structuredParts.push(`\n--- ${document.documentName} (Extracted Data) ---`);
        structuredParts.push(formatStructuredContext(extraction));
      }
    }
    if (structuredParts.length > 0) {
      structuredContext = structuredParts.join('\n');
    }
  } catch (err) {
    log.warn('Failed to get structured extraction data for project', {
      projectId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }

  // Calculate confidence
  const firstChunk = finalChunks[0];
  const vectorScore = firstChunk?.similarityScore ?? null;
  const rerankerScore = firstChunk?.rerankerScore;
  const queryIntent = classifyIntent(query);
  const confidence = calculateConfidence(vectorScore, rerankerScore, queryIntent);

  const duration = Date.now() - startTime;
  log.info('Project document chunks retrieved', {
    projectId,
    documentCount: readyDocuments.length,
    chunksRetrieved: finalChunks.length,
    hasStructuredContext: !!structuredContext,
    confidence,
    duration,
  });

  return {
    chunks: finalChunks,
    confidence,
    documents,
    structuredContext,
  };
}
