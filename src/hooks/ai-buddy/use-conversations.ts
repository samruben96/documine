/**
 * AI Buddy Conversations Hook
 * Story 15.4: Conversation Persistence
 *
 * Hook for managing conversations list, loading, and CRUD operations.
 *
 * AC-15.4.4: Conversations listed sorted by most recent activity
 * AC-15.4.8: Clicking conversation loads that conversation's messages
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Conversation, Message } from '@/types/ai-buddy';

export interface UseConversationsOptions {
  /** Initial project filter */
  projectId?: string;
  /** Auto-fetch conversations on mount */
  autoFetch?: boolean;
}

export interface UseConversationsReturn {
  /** List of conversations, sorted by most recent */
  conversations: Conversation[];
  /** Currently active conversation with messages */
  activeConversation: {
    conversation: Conversation;
    messages: Message[];
  } | null;
  /** Loading state for list fetch */
  isLoading: boolean;
  /** Loading state for single conversation */
  isLoadingConversation: boolean;
  /** Error state */
  error: Error | null;
  /** Pagination cursor for next page */
  nextCursor: string | null;
  /** Fetch conversations list */
  fetchConversations: (options?: { cursor?: string; search?: string }) => Promise<void>;
  /** Load a specific conversation with messages */
  loadConversation: (id: string) => Promise<void>;
  /** Create a new conversation (manual creation) */
  createConversation: (projectId?: string) => Promise<Conversation | null>;
  /** Delete a conversation (soft delete) */
  deleteConversation: (id: string) => Promise<void>;
  /** Search conversations by title */
  searchConversations: (query: string) => Promise<Conversation[]>;
  /** Clear active conversation */
  clearActiveConversation: () => void;
  /** Refresh conversations list */
  refresh: () => Promise<void>;
  /** Add a new conversation to the list (for optimistic updates) */
  addConversation: (conversation: Conversation) => void;
}

/**
 * API Response types
 */
interface ConversationsListResponse {
  data: {
    data: Conversation[];
    nextCursor?: string;
  };
  error: null | { code: string; message: string };
}

interface ConversationDetailResponse {
  data: {
    conversation: Conversation;
    messages: Message[];
  };
  error: null | { code: string; message: string };
}

/**
 * Conversations management hook for AI Buddy
 */
export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const { projectId, autoFetch = true } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<{
    conversation: Conversation;
    messages: Message[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);

  /**
   * Fetch conversations list with optional pagination and search
   */
  const fetchConversations = useCallback(
    async (options?: { cursor?: string; search?: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (projectId) params.set('projectId', projectId);
        if (options?.cursor) params.set('cursor', options.cursor);
        if (options?.search) params.set('search', options.search);
        params.set('limit', '50');

        const response = await fetch(`/api/ai-buddy/conversations?${params.toString()}`);
        const result: ConversationsListResponse = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to fetch conversations');
        }

        // If using cursor, append to existing list; otherwise replace
        if (options?.cursor) {
          setConversations((prev) => [...prev, ...result.data.data]);
        } else {
          setConversations(result.data.data);
        }

        setNextCursor(result.data.nextCursor ?? null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch conversations');
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  /**
   * Load a specific conversation with all messages
   */
  const loadConversation = useCallback(async (id: string) => {
    setIsLoadingConversation(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai-buddy/conversations/${id}`);
      const result: ConversationDetailResponse = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to load conversation');
      }

      setActiveConversation({
        conversation: result.data.conversation,
        messages: result.data.messages,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load conversation');
      setError(error);
      setActiveConversation(null);
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  /**
   * Create a new conversation manually
   * Note: Most conversations are created automatically via the chat API
   */
  const createConversation = useCallback(
    async (targetProjectId?: string): Promise<Conversation | null> => {
      try {
        // Send empty message to create conversation
        // The chat API will create the conversation
        const response = await fetch('/api/ai-buddy/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: targetProjectId ?? projectId,
            message: 'New conversation',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create conversation');
        }

        // Parse SSE response to get conversation ID
        // Note: This is a simplified approach; in practice, the useChat hook handles this
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let conversationId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'done' && data.conversationId) {
                  conversationId = data.conversationId;
                }
              } catch {
                // Skip parse errors
              }
            }
          }
        }

        if (conversationId) {
          // Refresh to get the new conversation
          await fetchConversations();

          return (
            conversations.find((c) => c.id === conversationId) ?? {
              id: conversationId,
              agencyId: '',
              userId: '',
              projectId: targetProjectId ?? projectId ?? null,
              title: 'New conversation',
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          );
        }

        return null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create conversation');
        setError(error);
        return null;
      }
    },
    [projectId, fetchConversations, conversations]
  );

  /**
   * Soft delete a conversation
   */
  const deleteConversation = useCallback(
    async (id: string) => {
      // Optimistic update
      const previousConversations = [...conversations];
      setConversations((prev) => prev.filter((c) => c.id !== id));

      // Clear active if it's being deleted
      if (activeConversation?.conversation.id === id) {
        setActiveConversation(null);
      }

      try {
        const response = await fetch(`/api/ai-buddy/conversations/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          // Revert on failure
          setConversations(previousConversations);
          throw new Error('Failed to delete conversation');
        }
      } catch (err) {
        // Revert on error
        setConversations(previousConversations);
        const error = err instanceof Error ? err : new Error('Failed to delete conversation');
        setError(error);
        throw error;
      }
    },
    [conversations, activeConversation]
  );

  /**
   * Search conversations by title
   */
  const searchConversations = useCallback(
    async (query: string): Promise<Conversation[]> => {
      if (!query.trim()) {
        return conversations;
      }

      try {
        const params = new URLSearchParams();
        if (projectId) params.set('projectId', projectId);
        params.set('search', query);
        params.set('limit', '50');

        const response = await fetch(`/api/ai-buddy/conversations?${params.toString()}`);
        const result: ConversationsListResponse = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Search failed');
        }

        return result.data.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Search failed');
        setError(error);
        return [];
      }
    },
    [projectId, conversations]
  );

  /**
   * Clear the active conversation
   */
  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null);
  }, []);

  /**
   * Refresh the conversations list
   */
  const refresh = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  /**
   * Add a conversation to the list (for optimistic updates from useChat)
   */
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      // Check if already exists
      if (prev.some((c) => c.id === conversation.id)) {
        // Update existing
        return prev.map((c) =>
          c.id === conversation.id ? { ...c, ...conversation } : c
        );
      }
      // Add to front (most recent)
      return [conversation, ...prev];
    });
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConversations();
    }
  }, [autoFetch, fetchConversations]);

  return {
    conversations,
    activeConversation,
    isLoading,
    isLoadingConversation,
    error,
    nextCursor,
    fetchConversations,
    loadConversation,
    createConversation,
    deleteConversation,
    searchConversations,
    clearActiveConversation,
    refresh,
    addConversation,
  };
}
