/**
 * AI Buddy Chat Hook
 * Story 14.5: Component Scaffolding
 *
 * Hook for managing chat state and sending messages.
 * Stub implementation - full functionality in Epic 15.
 */

import { useState, useCallback } from 'react';
import type { ChatMessageProps } from '@/components/ai-buddy';

export interface UseChatOptions {
  conversationId?: string;
  projectId?: string;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: ChatMessageProps[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(_options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessageProps = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Stub - actual API call in Epic 15
      throw new Error('Not implemented - Chat functionality deferred to Epic 15');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
