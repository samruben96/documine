/**
 * AI Buddy AI Client
 * Story 15.3: Streaming Chat API (AC-15.3.1, AC-15.3.2)
 *
 * OpenRouter wrapper for AI Buddy chat functionality.
 * Uses Claude Sonnet 4.5 via OpenRouter API.
 */

import OpenAI from 'openai';
import type { Message, StreamChunk, ConfidenceLevel, Citation } from '@/types/ai-buddy';
import { getLLMClient, getModelId } from '@/lib/llm/config';
import { log } from '@/lib/utils/logger';

export interface ChatStreamOptions {
  messages: Message[];
  projectId?: string;
  documentContext?: string;
  signal?: AbortSignal;
}

export interface ChatStreamResult {
  stream: AsyncIterable<StreamChunk>;
  conversationId: string;
}

export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onSources?: (sources: Citation[]) => void;
  onConfidence?: (level: ConfidenceLevel) => void;
  onDone: (conversationId: string, messageId: string) => void;
  onError: (error: Error, code?: string) => void;
}

/**
 * Stream a chat completion from OpenRouter Claude
 *
 * @param messages - Array of chat messages for context
 * @param systemPrompt - System prompt for AI behavior
 * @param callbacks - Callback functions for streaming events
 * @param signal - Optional abort signal for cancellation
 */
export async function streamAiBuddyChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const openai = getLLMClient();
  const modelId = getModelId();

  log.info('AI Buddy streaming chat started', {
    messageCount: messages.length,
    model: modelId,
  });

  const startTime = Date.now();

  try {
    const stream = await openai.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    let fullResponse = '';
    let firstChunkTime: number | null = null;

    for await (const chunk of stream) {
      // Check for abort
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        if (firstChunkTime === null) {
          firstChunkTime = Date.now();
          const ttfb = firstChunkTime - startTime;
          log.info('AI Buddy first token received', { ttfb });
        }

        fullResponse += content;
        callbacks.onChunk(content);
      }
    }

    const duration = Date.now() - startTime;
    log.info('AI Buddy streaming complete', {
      responseLength: fullResponse.length,
      duration,
    });

    return;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      log.error('OpenRouter API error', error, {
        status: error.status,
        message: error.message,
      });

      if (error.status === 429) {
        callbacks.onError(new Error('AI rate limit exceeded'), 'AIB_003');
        return;
      }

      callbacks.onError(new Error('AI provider error'), 'AIB_004');
      return;
    }

    log.error(
      'AI Buddy streaming error',
      error instanceof Error ? error : new Error(String(error))
    );
    callbacks.onError(
      error instanceof Error ? error : new Error('Unknown error'),
      'AIB_004'
    );
  }
}

/**
 * Create a streaming chat response (non-API version for testing)
 */
export async function createChatStream(
  options: ChatStreamOptions
): Promise<ChatStreamResult> {
  const { messages, projectId } = options;

  // Convert Message[] to LLM format
  const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Create async iterable for streaming
  const stream = createAsyncIterableStream(llmMessages);

  return {
    stream,
    conversationId: 'pending', // Set by API after creation
  };
}

/**
 * Create an async iterable stream from messages
 */
async function* createAsyncIterableStream(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): AsyncIterable<StreamChunk> {
  const openai = getLLMClient();
  const modelId = getModelId();

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
  });

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield { type: 'chunk', content };
    }
  }

  // Emit sources and confidence at end
  yield { type: 'sources', citations: [] };
  yield { type: 'confidence', level: 'medium' };
  yield { type: 'done' };
}

/**
 * Generate a chat completion (non-streaming)
 * Useful for testing or simple queries
 */
export async function generateChatCompletion(
  messages: Message[],
  documentContext?: string
): Promise<{
  content: string;
  sources: Citation[];
  confidence: ConfidenceLevel;
}> {
  const openai = getLLMClient();
  const modelId = getModelId();

  const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Add document context if provided
  if (documentContext) {
    llmMessages.unshift({
      role: 'system',
      content: `Document context:\n${documentContext}`,
    });
  }

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages: llmMessages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content || '';

  return {
    content,
    sources: [],
    confidence: 'medium',
  };
}

/**
 * Validate OpenRouter API key is configured
 */
export function validateAiConfig(): { valid: boolean; error?: string } {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { valid: false, error: 'OPENROUTER_API_KEY not configured' };
  }
  return { valid: true };
}
