/**
 * LLM Streaming Integration
 *
 * Handles streaming responses from OpenRouter (Claude, Gemini, GPT) or direct OpenAI.
 * Story 5.3: AC-5.3.1 Response text streams word-by-word.
 * Story 5.10: OpenRouter integration with Claude Sonnet 4.5 as primary.
 *
 * @module @/lib/chat/openai-stream
 */

import OpenAI from 'openai';
import type { ConfidenceLevel } from '@/lib/chat/confidence';
import type { SourceCitation, SSEEvent } from './types';
import { RateLimitError, TimeoutError, ChatError } from '@/lib/errors';
import { log } from '@/lib/utils/logger';
import { getLLMClient, getModelId, getModelConfig } from '@/lib/llm/config';

const TIMEOUT_MS = 30000; // 30 second timeout per AC-5.3.8

interface StreamChatOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  onText: (text: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

/**
 * Stream a chat response from the configured LLM provider.
 *
 * Uses OpenRouter (Claude, Gemini, GPT) or direct OpenAI based on config.
 * Story 5.10: Default is Claude Sonnet 4.5 via OpenRouter.
 *
 * @param options - Streaming options including messages and callbacks
 */
export async function streamChatResponse(options: StreamChatOptions): Promise<void> {
  const { messages, onText, onComplete, onError, signal } = options;

  const config = getModelConfig();
  const modelId = getModelId();

  log.info('Starting LLM stream', {
    provider: config.provider,
    model: config.chatModel,
    modelId,
    messageCount: messages.length,
  });

  const openai = getLLMClient();
  const startTime = Date.now();

  try {
    const stream = await openai.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
      temperature: 0.7, // Balanced for factual yet conversational responses
      max_tokens: 1500, // Reasonable limit for comprehensive answers
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      // Check for abort signal
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      // Check for timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new TimeoutError();
      }

      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        onText(content);
      }
    }

    const duration = Date.now() - startTime;
    log.info('LLM stream complete', {
      provider: config.provider,
      model: config.chatModel,
      modelId,
      responseLength: fullResponse.length,
      duration,
    });

    onComplete(fullResponse);
  } catch (error) {
    // Handle specific error types
    if (error instanceof OpenAI.APIError) {
      log.error('OpenAI API error caught', error, {
        status: error.status,
        message: error.message,
        code: error.code,
      });
      if (error.status === 429) {
        log.warn('OpenAI rate limit hit', { status: error.status });
        onError(new RateLimitError());
        return;
      }
      log.error('OpenAI API error', error, { status: error.status });
      onError(new ChatError(`OpenAI error: ${error.message}`));
      return;
    }

    if (error instanceof TimeoutError) {
      log.warn('OpenAI request timeout', { elapsed: Date.now() - startTime });
      onError(error);
      return;
    }

    log.error('Unexpected streaming error', error instanceof Error ? error : new Error(String(error)));
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Format an SSE event for streaming
 *
 * @param event - The event to format
 * @returns Formatted SSE string
 */
export function formatSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Format SSE done signal
 */
export function formatSSEDone(): string {
  return 'data: [DONE]\n\n';
}

/**
 * Create a streaming response for the chat API.
 *
 * Uses OpenRouter or direct OpenAI based on LLM_PROVIDER config.
 * Story 5.10: Claude Sonnet 4.5 is the default model.
 *
 * @param options - Options for the stream
 * @returns ReadableStream for the response
 */
export function createChatStream(options: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  sources: SourceCitation[];
  confidence: ConfidenceLevel;
  conversationId: string;
  onComplete: (fullResponse: string) => Promise<string>; // Returns messageId
}): ReadableStream<Uint8Array> {
  const { messages, sources, confidence, conversationId, onComplete } = options;
  const encoder = new TextEncoder();

  log.info('createChatStream called', { conversationId, sourceCount: sources.length });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      log.info('Stream start() callback executing');
      const abortController = new AbortController();

      try {
        await streamChatResponse({
          messages,
          signal: abortController.signal,
          onText: (text) => {
            const event: SSEEvent = { type: 'text', content: text };
            controller.enqueue(encoder.encode(formatSSEEvent(event)));
          },
          onComplete: async (fullResponse) => {
            try {
              // Emit sources
              for (const source of sources.slice(0, 3)) {
                const event: SSEEvent = { type: 'source', content: source };
                controller.enqueue(encoder.encode(formatSSEEvent(event)));
              }

              // Emit confidence
              const confEvent: SSEEvent = { type: 'confidence', content: confidence };
              controller.enqueue(encoder.encode(formatSSEEvent(confEvent)));

              // Save message and get ID
              const messageId = await onComplete(fullResponse);

              // Emit done
              const doneEvent: SSEEvent = {
                type: 'done',
                content: { conversationId, messageId },
              };
              controller.enqueue(encoder.encode(formatSSEEvent(doneEvent)));

              // Signal stream end
              controller.enqueue(encoder.encode(formatSSEDone()));
              controller.close();
            } catch (saveError) {
              log.error('Failed to save message', saveError instanceof Error ? saveError : new Error(String(saveError)));
              const errorEvent: SSEEvent = {
                type: 'error',
                content: { code: 'SAVE_ERROR', message: 'Failed to save message' },
              };
              controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
              controller.close();
            }
          },
          onError: (error) => {
            let errorEvent: SSEEvent;

            if (error instanceof RateLimitError) {
              errorEvent = {
                type: 'error',
                content: { code: 'RATE_LIMIT', message: error.message },
              };
            } else if (error instanceof TimeoutError) {
              errorEvent = {
                type: 'error',
                content: { code: 'TIMEOUT', message: error.message },
              };
            } else {
              errorEvent = {
                type: 'error',
                content: { code: 'CHAT_ERROR', message: 'Something went wrong. Please try again.' },
              };
            }

            controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
            controller.close();
          },
        });
      } catch (error) {
        log.error('Stream creation failed', error instanceof Error ? error : new Error(String(error)));
        const errorEvent: SSEEvent = {
          type: 'error',
          content: { code: 'STREAM_ERROR', message: 'Something went wrong. Please try again.' },
        };
        controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
        controller.close();
      }
    },
  });
}
