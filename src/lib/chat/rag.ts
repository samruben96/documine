/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Orchestrates the full RAG flow for Story 5.3:
 * 1. Generate query embedding
 * 2. Search for similar chunks
 * 3. Calculate confidence
 * 4. Build prompt with context
 *
 * @module @/lib/chat/rag
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { generateEmbeddings } from '@/lib/openai/embeddings';
import { searchSimilarChunks } from './vector-search';
import { calculateConfidence, type ConfidenceLevel } from '@/lib/chat/confidence';
import type { RAGContext, RetrievedChunk, ChatMessage, SourceCitation } from './types';
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

  // Search for similar chunks
  const chunks = await searchSimilarChunks(supabase, documentId, queryEmbedding);

  // Calculate confidence from top score
  const firstChunk = chunks[0];
  const topScore = firstChunk ? firstChunk.similarityScore : null;
  const confidence = calculateConfidence(topScore);

  const duration = Date.now() - startTime;
  log.info('RAG context retrieved', {
    documentId,
    chunksRetrieved: chunks.length,
    topScore,
    confidence,
    duration,
  });

  return {
    chunks,
    topScore,
    confidence,
  };
}

/**
 * Build the full prompt for GPT-4o
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
