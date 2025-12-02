'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessageData } from '@/components/chat/chat-message';
import type { ConfidenceLevel } from '@/components/chat/confidence-badge';
import type { SourceCitation, SSEEvent } from '@/lib/chat/types';

/**
 * Extended message data with streaming support
 */
export interface ExtendedChatMessageData extends ChatMessageData {
  confidence?: ConfidenceLevel;
  sources?: SourceCitation[];
  isStreaming?: boolean;
  error?: {
    code: string;
    message: string;
    canRetry: boolean;
  };
}

/**
 * Return type for the useChat hook
 */
export interface UseChatReturn {
  messages: ExtendedChatMessageData[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  conversationId: string | null;
}

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse SSE event from stream line
 */
function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith('data: ')) {
    return null;
  }

  const data = line.slice(6);
  if (data === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(data) as SSEEvent;
  } catch {
    return null;
  }
}

/**
 * Options for the useChat hook
 */
export interface UseChatOptions {
  /** Initial conversation ID (from useConversation) */
  initialConversationId?: string | null;
  /** Initial messages to display (from useConversation) */
  initialMessages?: ExtendedChatMessageData[];
}

/**
 * useChat Hook
 *
 * Implements AC-5.2.7: Message send behavior with optimistic UI updates
 * Implements AC-5.2.8: Loading/thinking state tracking
 * Implements AC-5.2.9: Loading state for input disabled control
 * Implements AC-5.3.1: SSE streaming response parsing
 * Implements AC-5.3.2: Confidence and sources storage after streaming
 *
 * @param documentId - The ID of the document being chatted about
 * @param options - Optional configuration including initial conversation state
 * @returns UseChatReturn object with messages, state, and actions
 */
export function useChat(documentId: string, options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ExtendedChatMessageData[]>(
    options?.initialMessages ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    options?.initialConversationId ?? null
  );

  // Track pending retry message content
  const pendingRetryRef = useRef<{ messageId: string; content: string } | null>(null);

  // Sync conversation ID when it changes externally (e.g., from useConversation)
  useEffect(() => {
    if (options?.initialConversationId && conversationId !== options.initialConversationId) {
      setConversationId(options.initialConversationId);
    }
  }, [options?.initialConversationId, conversationId]);

  // Sync messages when they change externally (e.g., loaded from useConversation)
  useEffect(() => {
    if (options?.initialMessages && options.initialMessages.length > 0 && messages.length === 0) {
      setMessages(options.initialMessages);
    }
  }, [options?.initialMessages, messages.length]);

  /**
   * Send a message and stream the response
   * Implements optimistic UI and SSE streaming
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Clear any previous errors
    setError(null);

    // Create user message with optimistic update
    const userMessage: ExtendedChatMessageData = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    // Create placeholder assistant message for streaming
    const assistantMessageId = generateId();
    const assistantMessage: ExtendedChatMessageData = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      isStreaming: true,
    };

    // Add both messages immediately (optimistic UI - AC-5.2.7)
    setMessages(prev => [...prev, userMessage, assistantMessage]);

    // Set loading state (AC-5.2.8)
    setIsLoading(true);

    try {
      // Make streaming request to chat API
      // Only include conversationId if it's not null (Zod expects string | undefined)
      const requestBody: { documentId: string; message: string; conversationId?: string } = {
        documentId,
        message: content.trim(),
      };
      if (conversationId) {
        requestBody.conversationId = conversationId;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle non-streaming error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
        throw new Error(errorData.error?.message || 'Something went wrong. Please try again.');
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let collectedContent = '';
      let collectedSources: SourceCitation[] = [];
      let collectedConfidence: ConfidenceLevel | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseSSELine(line);
          if (!event) continue;

          switch (event.type) {
            case 'text':
              // Append text to message content
              collectedContent += event.content;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: collectedContent }
                    : msg
                )
              );
              break;

            case 'source':
              // Collect source citations
              collectedSources.push(event.content);
              break;

            case 'confidence':
              // Store confidence level
              collectedConfidence = event.content;
              break;

            case 'done':
              // Update conversation ID and finalize message
              setConversationId(event.content.conversationId);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: collectedContent,
                        confidence: collectedConfidence,
                        sources: collectedSources,
                        isStreaming: false,
                      }
                    : msg
                )
              );
              break;

            case 'error':
              // Handle error event from stream
              const canRetry = event.content.code !== 'RATE_LIMIT';
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: event.content.message,
                        isStreaming: false,
                        error: {
                          code: event.content.code,
                          message: event.content.message,
                          canRetry,
                        },
                      }
                    : msg
                )
              );
              // Store retry info if applicable
              if (canRetry) {
                pendingRetryRef.current = {
                  messageId: assistantMessageId,
                  content: content.trim(),
                };
              }
              break;
          }
        }
      }

      // Ensure streaming is marked complete if we got here normally
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId && msg.isStreaming
            ? {
                ...msg,
                confidence: collectedConfidence,
                sources: collectedSources,
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (err) {
      // Handle fetch errors
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);

      // Update the assistant message to show error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: errorMessage,
                isStreaming: false,
                error: {
                  code: 'FETCH_ERROR',
                  message: errorMessage,
                  canRetry: true,
                },
              }
            : msg
        )
      );

      // Store for retry
      pendingRetryRef.current = {
        messageId: assistantMessageId,
        content: content.trim(),
      };

      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, conversationId]);

  /**
   * Retry a failed message
   */
  const retryMessage = useCallback(async (messageId: string) => {
    // Find the failed message and its preceding user message
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex < 0) return;

    const failedMessage = messages[msgIndex];
    if (!failedMessage || !failedMessage.error?.canRetry) return;

    // Find the user message that triggered this
    let userContent = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg?.role === 'user') {
        userContent = msg.content;
        break;
      }
    }

    if (!userContent && pendingRetryRef.current?.messageId === messageId) {
      userContent = pendingRetryRef.current.content;
    }

    if (!userContent) return;

    // Remove the failed message and resend
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await sendMessage(userContent);
  }, [messages, sendMessage]);

  /**
   * Clear all messages (for "New Chat" functionality)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setConversationId(null);
    pendingRetryRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    clearMessages,
    conversationId,
  };
}
