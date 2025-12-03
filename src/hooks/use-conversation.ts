'use client';

/**
 * useConversation Hook
 *
 * Manages conversation state and persistence for Story 5.6.
 * AC-5.6.1: Conversation history visible in chat panel
 * AC-5.6.4: Returning to document shows previous conversation
 * AC-5.6.11: Error handling for database operations
 *
 * @module @/hooks/use-conversation
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation, ChatMessage, SourceCitation } from '@/lib/chat/types';
import type { ConfidenceLevel } from '@/components/chat/confidence-badge';
import type { ChatMessageData } from '@/components/chat/chat-message';

/**
 * Return type for the useConversation hook
 */
export interface UseConversationReturn {
  /** Current conversation record */
  conversation: Conversation | null;
  /** Messages loaded from database (converted to ChatMessageData format) */
  messages: ChatMessageData[];
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Refetch conversation after new message */
  refetch: () => Promise<void>;
  /** Create new conversation (New Chat) */
  createNew: () => Promise<Conversation | null>;
}

/**
 * useConversation Hook
 *
 * Loads and manages conversation state for a document.
 *
 * @param documentId - The ID of the document
 * @returns UseConversationReturn object with conversation state and actions
 */
export function useConversation(documentId: string): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load conversation and messages from database
   */
  const loadConversation = useCallback(async () => {
    if (!documentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // Try to get existing conversation (most recent by updated_at)
      // Use maybeSingle() instead of single() to handle 0 rows gracefully
      // single() returns 406 error when 0 rows match, maybeSingle() returns null
      // Reference: https://github.com/orgs/supabase/discussions/2284
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        // Log the actual error for debugging (RLS rejection vs other issues)
        console.error('Conversation load error:', {
          code: findError.code,
          message: findError.message,
          hint: findError.hint,
        });
        throw new Error('Failed to load conversation');
      }

      if (existingConversation) {
        setConversation({
          id: existingConversation.id,
          agencyId: existingConversation.agency_id,
          documentId: existingConversation.document_id,
          userId: existingConversation.user_id,
          createdAt: new Date(existingConversation.created_at),
          updatedAt: new Date(existingConversation.updated_at),
        });

        // Load messages for this conversation
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', existingConversation.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          throw new Error('Failed to load messages');
        }

        // Convert database ChatMessage to ChatMessageData format
        // (null -> undefined for optional fields)
        setMessages(
          (messagesData ?? []).map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            createdAt: new Date(msg.created_at),
            // Convert null to undefined for ChatMessageData compatibility
            sources: (msg.sources as SourceCitation[] | null) ?? undefined,
            confidence: (msg.confidence as ConfidenceLevel | null) ?? undefined,
          }))
        );
      } else {
        // No existing conversation - empty state
        setConversation(null);
        setMessages([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      console.error('useConversation load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  /**
   * Refetch conversation (call after new message)
   */
  const refetch = useCallback(async () => {
    await loadConversation();
  }, [loadConversation]);

  /**
   * Create a new conversation (for New Chat)
   * AC-5.6.9: Creates new conversation record, clears chat
   */
  const createNew = useCallback(async (): Promise<Conversation | null> => {
    if (!documentId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Authentication required');
        return null;
      }

      // Get user's agency
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        setError('User not found');
        return null;
      }

      // Create new conversation
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({
          document_id: documentId,
          user_id: user.id,
          agency_id: userData.agency_id,
        })
        .select()
        .single();

      if (createError || !created) {
        throw new Error('Failed to create new conversation');
      }

      const newConversation: Conversation = {
        id: created.id,
        agencyId: created.agency_id,
        documentId: created.document_id,
        userId: created.user_id,
        createdAt: new Date(created.created_at),
        updatedAt: new Date(created.updated_at),
      };

      setConversation(newConversation);
      setMessages([]);

      return newConversation;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create new conversation';
      setError(errorMessage);
      console.error('useConversation createNew error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  // Load conversation on mount and documentId change
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  return {
    conversation,
    messages,
    isLoading,
    error,
    refetch,
    createNew,
  };
}
