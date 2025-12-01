'use client';

import { useState, useCallback } from 'react';
import type { ChatMessageData } from '@/components/chat/chat-message';

/**
 * Return type for the useChat hook
 */
export interface UseChatReturn {
  messages: ChatMessageData[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * useChat Hook
 *
 * Implements AC-5.2.7: Message send behavior with optimistic UI updates
 * Implements AC-5.2.8: Loading/thinking state tracking
 * Implements AC-5.2.9: Loading state for input disabled control
 *
 * This is the foundation hook - actual API integration will be added in Story 5.3.
 * For now, it provides:
 * - Message state management
 * - Optimistic UI updates for user messages
 * - Loading state tracking
 * - Placeholder sendMessage function
 *
 * @param documentId - The ID of the document being chatted about
 * @returns UseChatReturn object with messages, state, and actions
 */
export function useChat(documentId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message and get a response
   * Implements optimistic UI: user message appears immediately
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Clear any previous errors
    setError(null);

    // Create user message with optimistic update
    const userMessage: ChatMessageData = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    // Add user message immediately (optimistic UI - AC-5.2.7)
    setMessages(prev => [...prev, userMessage]);

    // Set loading state (AC-5.2.8)
    setIsLoading(true);

    try {
      // TODO: Story 5.3 will implement actual API call here
      // For now, simulate a placeholder response after a short delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Placeholder assistant response - will be replaced with actual API integration
      const assistantMessage: ChatMessageData = {
        id: generateId(),
        role: 'assistant',
        content: `I received your question about document ${documentId}: "${content}"\n\nThis is a placeholder response. Full AI integration will be implemented in Story 5.3.`,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  /**
   * Clear all messages (for "New Chat" functionality)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
