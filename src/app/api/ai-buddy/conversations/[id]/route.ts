/**
 * AI Buddy Conversation Detail API Route
 * Story 15.4: Conversation Persistence
 *
 * GET /api/ai-buddy/conversations/[id] - Get conversation with all messages
 *
 * AC-15.4.3: Full conversation history loads when returning to existing conversation
 * AC-15.4.7: Returns conversation with all messages
 */

// Use Edge Runtime for proper auth cookie handling with RLS
export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { aiBuddySuccessResponse, aiBuddyErrorResponse } from '@/lib/ai-buddy';
import { log } from '@/lib/utils/logger';
import type { Conversation, Message } from '@/types/ai-buddy';

/**
 * GET /api/ai-buddy/conversations/[id]
 * Get a single conversation with all its messages
 *
 * Response:
 * {
 *   data: {
 *     conversation: Conversation,
 *     messages: Message[]
 *   },
 *   error: null
 * }
 */
/**
 * DELETE /api/ai-buddy/conversations/[id]
 * Soft delete a conversation (sets deleted_at timestamp)
 *
 * Response:
 * {
 *   data: { deleted: true },
 *   error: null
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return aiBuddyErrorResponse('AIB_004', 'Invalid conversation ID format');
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy conversation delete unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // First verify the user owns this conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('ai_buddy_conversations')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !conversation) {
      log.warn('AI Buddy conversation not found or not owned by user', {
        conversationId: id,
        userId: user.id,
      });
      return aiBuddyErrorResponse('AIB_005', 'Conversation not found');
    }

    // Use service client for the update to bypass RLS UPDATE policy issues
    // We've already verified ownership above
    const serviceClient = createServiceClient();
    const { error: deleteError } = await serviceClient
      .from('ai_buddy_conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      log.error('Failed to delete conversation', deleteError);
      return aiBuddyErrorResponse('AIB_006', 'Failed to delete conversation');
    }

    log.info('AI Buddy conversation deleted', {
      conversationId: id,
      userId: user.id,
    });

    return aiBuddySuccessResponse({ deleted: true });
  } catch (error) {
    log.error(
      'AI Buddy conversation delete error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}

/**
 * GET /api/ai-buddy/conversations/[id]
 * Get a single conversation with all its messages
 *
 * Response:
 * {
 *   data: {
 *     conversation: Conversation,
 *     messages: Message[]
 *   },
 *   error: null
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return aiBuddyErrorResponse('AIB_004', 'Invalid conversation ID format');
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy conversation detail unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Fetch conversation - RLS ensures user only sees their own
    const { data: conversationRow, error: convError } = await supabase
      .from('ai_buddy_conversations')
      .select(
        `
        id,
        agency_id,
        user_id,
        project_id,
        title,
        deleted_at,
        created_at,
        updated_at
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (convError || !conversationRow) {
      log.warn('AI Buddy conversation not found', { conversationId: id, userId: user.id });
      return aiBuddyErrorResponse('AIB_005', 'Conversation not found');
    }

    // Fetch all messages for this conversation, sorted by creation (oldest first)
    const { data: messageRows, error: msgError } = await supabase
      .from('ai_buddy_messages')
      .select(
        `
        id,
        conversation_id,
        agency_id,
        role,
        content,
        sources,
        confidence,
        created_at
      `
      )
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      log.error('Failed to fetch conversation messages', msgError);
      return aiBuddyErrorResponse('AIB_006', 'Failed to fetch messages');
    }

    // Map to TypeScript types
    const conversation: Conversation = {
      id: conversationRow.id,
      agencyId: conversationRow.agency_id,
      userId: conversationRow.user_id,
      projectId: conversationRow.project_id,
      title: conversationRow.title,
      deletedAt: conversationRow.deleted_at,
      createdAt: conversationRow.created_at,
      updatedAt: conversationRow.updated_at,
      messageCount: messageRows?.length || 0,
    };

    const messages: Message[] = (messageRows || []).map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      agencyId: row.agency_id,
      role: row.role as Message['role'],
      content: row.content,
      sources: row.sources as Message['sources'],
      confidence: row.confidence as Message['confidence'],
      createdAt: row.created_at,
    }));

    log.info('AI Buddy conversation loaded', {
      conversationId: id,
      userId: user.id,
      messageCount: messages.length,
    });

    return aiBuddySuccessResponse({
      conversation,
      messages,
    });
  } catch (error) {
    log.error(
      'AI Buddy conversation detail error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}
