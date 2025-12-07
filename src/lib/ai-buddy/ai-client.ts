/**
 * AI Buddy AI Client
 * Story 14.2: API Route Structure
 *
 * OpenAI client wrapper for AI Buddy chat functionality.
 * Stub implementation - actual AI integration in Epic 15.
 */

import type { Message, StreamChunk, ConfidenceLevel, Citation } from '@/types/ai-buddy';

export interface ChatStreamOptions {
  messages: Message[];
  projectId?: string;
  documentContext?: string;
}

export interface ChatStreamResult {
  stream: AsyncIterable<StreamChunk>;
  conversationId: string;
}

/**
 * Create a streaming chat response
 * @throws Error - Not implemented
 */
export async function createChatStream(
  _options: ChatStreamOptions
): Promise<ChatStreamResult> {
  throw new Error('Not implemented - AI client integration deferred to Epic 15');
}

/**
 * Generate a chat completion (non-streaming)
 * @throws Error - Not implemented
 */
export async function generateChatCompletion(
  _messages: Message[],
  _documentContext?: string
): Promise<{
  content: string;
  sources: Citation[];
  confidence: ConfidenceLevel;
}> {
  throw new Error('Not implemented - AI client integration deferred to Epic 15');
}

/**
 * Validate OpenAI API key is configured
 */
export function validateAiConfig(): { valid: boolean; error?: string } {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { valid: false, error: 'OPENAI_API_KEY not configured' };
  }
  return { valid: true };
}
