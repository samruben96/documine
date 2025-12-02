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
import type { ConfidenceLevel } from '@/components/chat/confidence-badge';
import type { SourceCitation, Conversation, ChatMessage } from './types';
import { log } from '@/lib/utils/logger';

const MAX_HISTORY_MESSAGES = 10;

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
  // Try to find existing conversation
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

  // Create new conversation
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
    log.error('Failed to create conversation', createError ?? new Error('No data'), {
      documentId,
      userId,
    });
    throw new Error('Failed to create conversation');
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
 * Get conversation history for RAG context
 * Returns last 10 messages for the conversation
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

  return messages.map((msg) => ({
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
