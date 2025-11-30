/**
 * OpenAI Embeddings Service
 *
 * Generates vector embeddings for document chunks using OpenAI's API.
 * Implements AC-4.6.6: OpenAI embeddings with batching.
 *
 * @module @/lib/openai/embeddings
 */

import OpenAI from 'openai';
import { EmbeddingError } from '@/lib/errors';
import { log } from '@/lib/utils/logger';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
  totalTokens: number;
}

/**
 * Generate embeddings for an array of texts.
 *
 * Features:
 * - Uses text-embedding-3-small model (1536 dimensions)
 * - Batches requests (max 20 texts per API call)
 * - Implements retry with exponential backoff
 *
 * @param texts - Array of text strings to embed
 * @param apiKey - OpenAI API key
 * @returns Array of 1536-dimension embedding vectors
 * @throws EmbeddingError on API failures after retries
 */
export async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const openai = new OpenAI({ apiKey });
  const startTime = Date.now();
  const embeddings: number[][] = [];
  let totalTokens = 0;

  // Process in batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResult = await generateBatchEmbeddings(openai, batch);

    embeddings.push(...batchResult.embeddings);
    totalTokens += batchResult.totalTokens;
  }

  const duration = Date.now() - startTime;
  log.info('Embeddings generated', {
    count: texts.length,
    batches: Math.ceil(texts.length / BATCH_SIZE),
    totalTokens,
    duration,
  });

  return embeddings;
}

/**
 * Generate embeddings for a single batch with retry logic
 */
async function generateBatchEmbeddings(
  openai: OpenAI,
  texts: string[]
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  let lastError: Error | null = null;
  let delay = INITIAL_RETRY_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      // Sort by index to maintain order
      const sorted = response.data.sort((a, b) => a.index - b.index);
      const embeddings = sorted.map((item) => item.embedding);

      return {
        embeddings,
        totalTokens: response.usage?.total_tokens ?? 0,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw new EmbeddingError(`OpenAI embedding failed: ${lastError.message}`);
      }

      log.warn('Embedding batch failed, retrying', {
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

  throw new EmbeddingError(
    `OpenAI embedding failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * Check if an error is retryable (rate limit, server error)
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
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate embedding dimensions
 */
export function validateEmbedding(embedding: number[]): boolean {
  return Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSIONS;
}

/**
 * Get embedding model info
 */
export function getEmbeddingModelInfo(): { model: string; dimensions: number } {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
  };
}
