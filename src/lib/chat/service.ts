/**
 * Chat Service
 *
 * Handles conversation and message persistence for Story 5.3.
 * Implements AC-5.3.2: Save messages with sources and confidence.
 *
 * @module @/lib/chat/service
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { ConfidenceLevel } from '@/lib/chat/confidence';
import type { SourceCitation, Conversation, ChatMessage } from './types';
import { log } from '@/lib/utils/logger';

const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_TOKENS = 6000;
const CHARS_PER_TOKEN = 4;

/**
 * Get or create a conversation for a document
 *
 * @param supabase - Supabase client with user auth context
 * @param documentId - The document ID
 * @param userId - The user ID
 * @param agencyId - The agency ID
 * @returns The conversation record
 */
export async function getOrCreateConversation(
  supabase: SupabaseClient<Database>,
  documentId: string,
  userId: string,
  agencyId: string
): Promise<Conversation> {
  // Try to find existing conversation (most recent by updated_at)
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (existing && !findError) {
    return {
      id: existing.id,
      agencyId: existing.agency_id,
      documentId: existing.document_id,
      userId: existing.user_id,
      createdAt: new Date(existing.created_at),
      updatedAt: new Date(existing.updated_at),
    };
  }

  // Create new conversation with race condition handling (AC-5.6.12)
  // If another request creates a conversation simultaneously, we catch the
  // unique violation and return the existing one
  try {
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        document_id: documentId,
        user_id: userId,
        agency_id: agencyId,
      })
      .select()
      .single();

    if (createError) {
      // Check if this is a unique constraint violation (race condition)
      if (createError.code === '23505') {
        // Another request created the conversation, fetch it
        const { data: raceExisting } = await supabase
          .from('conversations')
          .select('*')
          .eq('document_id', documentId)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (raceExisting) {
          log.info('Conversation found after race condition', {
            conversationId: raceExisting.id,
            documentId,
          });
          return {
            id: raceExisting.id,
            agencyId: raceExisting.agency_id,
            documentId: raceExisting.document_id,
            userId: raceExisting.user_id,
            createdAt: new Date(raceExisting.created_at),
            updatedAt: new Date(raceExisting.updated_at),
          };
        }
      }
      throw createError;
    }

    if (!created) {
      throw new Error('No data returned from insert');
    }

    log.info('Conversation created', { conversationId: created.id, documentId });

    return {
      id: created.id,
      agencyId: created.agency_id,
      documentId: created.document_id,
      userId: created.user_id,
      createdAt: new Date(created.created_at),
      updatedAt: new Date(created.updated_at),
    };
  } catch (error) {
    log.error('Failed to create conversation', error instanceof Error ? error : new Error(String(error)), {
      documentId,
      userId,
    });
    throw new Error('Failed to create conversation');
  }
}

/**
 * Save a user message to the database
 *
 * @param supabase - Supabase client with user auth context
 * @param conversationId - The conversation ID
 * @param agencyId - The agency ID
 * @param content - The message content
 * @returns The saved message record
 */
export async function saveUserMessage(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  agencyId: string,
  content: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      agency_id: agencyId,
      role: 'user',
      content,
      sources: null,
      confidence: null,
    })
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to save user message', error ?? new Error('No data'), {
      conversationId,
    });
    throw new Error('Failed to save user message');
  }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    id: data.id,
    conversationId: data.conversation_id,
    agencyId: data.agency_id,
    role: 'user',
    content: data.content,
    sources: null,
    confidence: null,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Save an assistant message to the database
 *
 * @param supabase - Supabase client with user auth context
 * @param conversationId - The conversation ID
 * @param agencyId - The agency ID
 * @param content - The message content
 * @param sources - Source citations from RAG
 * @param confidence - Confidence level
 * @returns The saved message record
 */
export async function saveAssistantMessage(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  agencyId: string,
  content: string,
  sources: SourceCitation[] | null,
  confidence: ConfidenceLevel | null
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      agency_id: agencyId,
      role: 'assistant',
      content,
      sources: sources as unknown as Database['public']['Tables']['chat_messages']['Insert']['sources'],
      confidence,
    })
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to save assistant message', error ?? new Error('No data'), {
      conversationId,
    });
    throw new Error('Failed to save assistant message');
  }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    id: data.id,
    conversationId: data.conversation_id,
    agencyId: data.agency_id,
    role: 'assistant',
    content: data.content,
    sources: data.sources as SourceCitation[] | null,
    confidence: data.confidence as ConfidenceLevel | null,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Get ALL messages for a conversation (for UI display)
 * AC-5.6.4: Returns all messages for displaying conversation history
 *
 * @param supabase - Supabase client with user auth context
 * @param conversationId - The conversation ID
 * @returns Array of messages ordered by creation time ascending
 */
export async function getConversationMessages(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    log.error('Failed to get conversation messages', error, { conversationId });
    throw new Error('Failed to load conversation messages');
  }

  return (data ?? []).map((msg) => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    agencyId: msg.agency_id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    sources: msg.sources as SourceCitation[] | null,
    confidence: msg.confidence as ConfidenceLevel | null,
    createdAt: new Date(msg.created_at),
  }));
}

/**
 * Estimate token count for a message
 * AC-5.6.6: ~4 chars per token approximation
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate messages to fit within token budget
 * AC-5.6.6: 6000 token max, truncate oldest first
 */
export function truncateHistoryToTokenBudget(
  messages: ChatMessage[],
  maxTokens: number = MAX_HISTORY_TOKENS
): ChatMessage[] {
  const result: ChatMessage[] = [];
  let tokenCount = 0;

  // Work backwards from most recent, keeping within budget
  for (let i = messages.length - 1; i >= 0 && result.length < MAX_HISTORY_MESSAGES; i--) {
    const msg = messages[i];
    if (!msg) continue;
    const msgTokens = estimateTokens(msg.content);
    if (tokenCount + msgTokens > maxTokens) break;
    result.unshift(msg);
    tokenCount += msgTokens;
  }

  return result;
}

/**
 * Get conversation history for RAG context
 * Returns last 10 messages for the conversation, truncated by token budget
 * AC-5.6.6: Max 10 messages, 6000 token budget
 *
 * @param supabase - Supabase client with user auth context
 * @param conversationId - The conversation ID
 * @returns Array of messages ordered by creation time ascending
 */
export async function getConversationHistory(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);

  if (error) {
    log.error('Failed to get conversation history', error, { conversationId });
    return [];
  }

  // Reverse to get chronological order
  const messages = (data ?? []).reverse();

  const mapped = messages.map((msg) => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    agencyId: msg.agency_id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    sources: msg.sources as SourceCitation[] | null,
    confidence: msg.confidence as ConfidenceLevel | null,
    createdAt: new Date(msg.created_at),
  }));

  // Apply token budget truncation
  return truncateHistoryToTokenBudget(mapped);
}

/**
 * Create a new conversation for a document (for "New Chat" feature)
 * AC-5.6.9: Always creates a fresh conversation, doesn't reuse existing
 *
 * @param supabase - Supabase client with user auth context
 * @param documentId - The document ID
 * @param userId - The user ID
 * @param agencyId - The agency ID
 * @returns The new conversation record
 */
export async function createNewConversation(
  supabase: SupabaseClient<Database>,
  documentId: string,
  userId: string,
  agencyId: string
): Promise<Conversation> {
  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({
      document_id: documentId,
      user_id: userId,
      agency_id: agencyId,
    })
    .select()
    .single();

  if (createError || !created) {
    log.error('Failed to create new conversation', createError ?? new Error('No data'), {
      documentId,
      userId,
    });
    throw new Error('Failed to create new conversation');
  }

  log.info('New conversation created (New Chat)', { conversationId: created.id, documentId });

  return {
    id: created.id,
    agencyId: created.agency_id,
    documentId: created.document_id,
    userId: created.user_id,
    createdAt: new Date(created.created_at),
    updatedAt: new Date(created.updated_at),
  };
}
