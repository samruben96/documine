/**
 * AI Buddy Chat Hook
 * Story 15.3: Streaming Chat API (AC-15.3.1, AC-15.3.5)
 *
 * Hook for managing chat state and sending messages.
 * Handles SSE streaming, optimistic updates, and error handling.
 *
 * AC-15.3.1: Consumes SSE stream from /api/ai-buddy/chat
 * AC-15.3.5: Handles errors gracefully with retry option
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Conversation, Citation, ConfidenceLevel } from '@/types/ai-buddy';

export interface UseChatOptions {
  conversationId?: string;
  projectId?: string;
  onError?: (error: Error) => void;
  onConversationCreated?: (conversation: Conversation) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  streamingCitations: Citation[];
  streamingConfidence: ConfidenceLevel | null;
  error: Error | null;
  conversation: Conversation | null;
  sendMessage: (content: string, attachments?: string[]) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

/**
 * SSE Event types from the chat API
 */
interface SSEEvent {
  type: 'chunk' | 'sources' | 'confidence' | 'done' | 'error';
  content?: string;
  citations?: Citation[];
  level?: ConfidenceLevel;
  conversationId?: string;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Create a message object
 */
function createMessage(
  role: 'user' | 'assistant',
  content: string,
  conversationId: string,
  sources?: Citation[] | null,
  confidence?: ConfidenceLevel | null
): Message {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversationId,
    agencyId: '', // Will be set by server
    role,
    content,
    sources: sources ?? null,
    confidence: confidence ?? null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * AI Buddy Chat Hook
 *
 * Manages chat state, SSE streaming, and API communication.
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { conversationId: initialConversationId, projectId, onError, onConversationCreated } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const [streamingConfidence, setStreamingConfidence] = useState<ConfidenceLevel | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(
    initialConversationId
      ? {
          id: initialConversationId,
          userId: '',
          agencyId: '',
          projectId: projectId ?? null,
          title: null,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : null
  );

  // Track last message for retry
  const lastMessageRef = useRef<{ content: string; attachments?: string[] } | null>(null);

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Send a message and stream the response (AC-15.3.1)
   */
  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      // Abort any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setStreamingContent('');
      setStreamingCitations([]);
      setStreamingConfidence(null);

      // Store for retry
      lastMessageRef.current = { content, attachments };

      // Optimistic update: add user message immediately
      const tempConversationId = conversation?.id ?? 'pending';
      const userMessage = createMessage('user', content, tempConversationId);
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch('/api/ai-buddy/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversation?.id,
            projectId,
            message: content,
            attachments: attachments?.map((id) => ({ documentId: id, type: 'pdf' })),
          }),
          signal: abortControllerRef.current.signal,
        });

        // Handle non-streaming error responses
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || 'Failed to send message';
          throw new Error(errorMessage);
        }

        // Check for SSE response
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('text/event-stream')) {
          throw new Error('Expected SSE response from chat API');
        }

        // Process SSE stream (AC-15.3.1)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let finalCitations: Citation[] = [];
        let finalConfidence: ConfidenceLevel | null = null;
        let finalConversationId: string | null = null;
        let finalMessageId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              // Skip empty data or [DONE] signal
              if (!data || data === '[DONE]') {
                continue;
              }

              try {
                const event: SSEEvent = JSON.parse(data);

                switch (event.type) {
                  case 'chunk':
                    if (event.content) {
                      fullContent += event.content;
                      setStreamingContent(fullContent);
                    }
                    break;

                  case 'sources':
                    if (event.citations) {
                      finalCitations = event.citations;
                      setStreamingCitations(event.citations);
                    }
                    break;

                  case 'confidence':
                    if (event.level) {
                      finalConfidence = event.level;
                      setStreamingConfidence(event.level);
                    }
                    break;

                  case 'done':
                    finalConversationId = event.conversationId ?? null;
                    finalMessageId = event.messageId ?? null;
                    break;

                  case 'error':
                    // Throw outside try/catch to propagate to outer handler
                    const streamError = new Error(event.error || 'Unknown streaming error');
                    throw streamError;
                }
              } catch (parseError) {
                // Re-throw actual errors (from error events), only skip parse errors
                if (parseError instanceof Error && !parseError.message.includes('JSON')) {
                  throw parseError;
                }
                // Skip unparseable events
                console.warn('Failed to parse SSE event:', data);
              }
            }
          }
        }

        // Create final assistant message
        const assistantMessage = createMessage(
          'assistant',
          fullContent,
          finalConversationId ?? tempConversationId,
          finalCitations,
          finalConfidence
        );

        if (finalMessageId) {
          assistantMessage.id = finalMessageId;
        }

        // Update messages with final assistant response
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        setStreamingCitations([]);
        setStreamingConfidence(null);

        // Update conversation if new one was created
        if (finalConversationId && !conversation?.id) {
          const newConversation: Conversation = {
            id: finalConversationId,
            userId: '',
            agencyId: '',
            projectId: projectId ?? null,
            title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setConversation(newConversation);
          onConversationCreated?.(newConversation);

          // Update user message with correct conversation ID
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, conversationId: finalConversationId! }
                : msg
            )
          );
        }
      } catch (err) {
        // Handle abort
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setStreamingContent('');
        onError?.(error);

        // Remove optimistic user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, projectId, onError, onConversationCreated]
  );

  /**
   * Retry the last failed message (AC-15.3.5)
   */
  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current) {
      return;
    }

    const { content, attachments } = lastMessageRef.current;
    setError(null);
    await sendMessage(content, attachments);
  }, [sendMessage]);

  /**
   * Clear all messages and reset state
   */
  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreamingContent('');
    setStreamingCitations([]);
    setStreamingConfidence(null);
    setConversation(null);
    lastMessageRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    streamingCitations,
    streamingConfidence,
    error,
    conversation,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}
