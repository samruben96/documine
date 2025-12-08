/**
 * AI Buddy Chat Hook
 * Story 14.5: Component Scaffolding (Updated for Story 15.2)
 *
 * Hook for managing chat state and sending messages.
 * Stub implementation - full functionality in Epic 15 Story 15.3.
 */

import { useState, useCallback } from 'react';
import type { Message, Conversation } from '@/types/ai-buddy';

export interface UseChatOptions {
  conversationId?: string;
  projectId?: string;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: Error | null;
  conversation: Conversation | null;
  sendMessage: (content: string, attachments?: string[]) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Create a mock message for stub implementation
 */
function createMockMessage(
  role: 'user' | 'assistant',
  content: string
): Message {
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversationId: 'mock-conversation',
    agencyId: 'mock-agency',
    role,
    content,
    sources: null,
    confidence: null,
    createdAt: new Date().toISOString(),
  };
}

export function useChat(_options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const sendMessage = useCallback(
    async (content: string, _attachments?: string[]) => {
      setIsLoading(true);
      setError(null);
      setStreamingContent('');

      // Add user message
      const userMessage = createMockMessage('user', content);
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Stub - actual API call in Epic 15 Story 15.3
        // For now, simulate a brief delay and add a placeholder response
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate streaming by updating content
        const responseContent =
          "I'm AI Buddy! This is a placeholder response. Full chat functionality will be implemented in Story 15.3 (Streaming Chat API).";
        setStreamingContent(responseContent);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const assistantMessage = createMockMessage('assistant', responseContent);
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');

        // Create mock conversation if none exists
        if (!conversation) {
          setConversation({
            id: 'mock-conversation',
            userId: 'mock-user',
            agencyId: 'mock-agency',
            projectId: null,
            title: content.slice(0, 50),
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setStreamingContent('');
      } finally {
        setIsLoading(false);
      }
    },
    [conversation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
    setConversation(null);
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    error,
    conversation,
    sendMessage,
    clearMessages,
  };
}
