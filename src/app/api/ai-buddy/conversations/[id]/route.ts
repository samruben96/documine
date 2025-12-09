/**
 * AI Buddy Conversation Detail API Route
 * Story 15.4: Conversation Persistence
 * Story 16.6: Conversation Management - Delete & Move
 *
 * GET /api/ai-buddy/conversations/[id] - Get conversation with all messages
 * DELETE /api/ai-buddy/conversations/[id] - Soft delete conversation
 * PATCH /api/ai-buddy/conversations/[id] - Move conversation to project
 *
 * AC-15.4.3: Full conversation history loads when returning to existing conversation
 * AC-15.4.7: Returns conversation with all messages
 * AC-16.6.3: Confirming delete sets deleted_at (soft delete)
 * AC-16.6.5: Audit log records deletion event with conversation_deleted action
 * AC-16.6.8: Selecting project updates conversation's project_id
 */

// Use Edge Runtime for proper auth cookie handling with RLS
export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { aiBuddySuccessResponse, aiBuddyErrorResponse, logAuditEvent } from '@/lib/ai-buddy';
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

    // First verify the user owns this conversation and get details for audit
    const { data: conversation, error: fetchError } = await supabase
      .from('ai_buddy_conversations')
      .select('id, user_id, agency_id, title')
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

    // AC-16.6.5: Log deletion to audit trail
    await logAuditEvent({
      agencyId: conversation.agency_id,
      userId: user.id,
      conversationId: id,
      action: 'conversation_deleted',
      metadata: {
        title: conversation.title,
        deletedAt: new Date().toISOString(),
      },
    });

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

/**
 * PATCH /api/ai-buddy/conversations/[id]
 * Move conversation to a different project
 * Story 16.6: Conversation Management
 *
 * Request body:
 * { projectId: string | null }  // null = move to general chat
 *
 * Response:
 * {
 *   data: Conversation,
 *   error: null
 * }
 *
 * AC-16.6.8: Selecting project updates conversation's project_id
 * AC-16.6.9: Moved conversation appears in target project's history
 * AC-16.6.12: Can move from project to "No Project" (general chat)
 */
export async function PATCH(
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

    // Parse request body
    let body: { projectId?: string | null };
    try {
      body = await request.json();
    } catch {
      return aiBuddyErrorResponse('AIB_004', 'Invalid request body');
    }

    // Validate projectId if provided (not null)
    const { projectId } = body;
    if (projectId !== null && projectId !== undefined) {
      if (typeof projectId !== 'string' || !uuidRegex.test(projectId)) {
        return aiBuddyErrorResponse('AIB_004', 'Invalid project ID format');
      }
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy conversation move unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Verify the user owns this conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('ai_buddy_conversations')
      .select('id, user_id, agency_id, project_id, title')
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

    // If moving to a project, verify the project exists and belongs to user's agency
    let targetProjectName: string | null = null;
    if (projectId !== null && projectId !== undefined) {
      const { data: project, error: projectError } = await supabase
        .from('ai_buddy_projects')
        .select('id, name, agency_id')
        .eq('id', projectId)
        .eq('agency_id', conversation.agency_id)
        .is('archived_at', null)
        .single();

      if (projectError || !project) {
        log.warn('Target project not found or not accessible', {
          projectId,
          agencyId: conversation.agency_id,
        });
        return aiBuddyErrorResponse('AIB_005', 'Target project not found');
      }
      targetProjectName = project.name;
    }

    // Use service client for the update to bypass RLS UPDATE policy issues
    const serviceClient = createServiceClient();
    const { data: updatedRow, error: updateError } = await serviceClient
      .from('ai_buddy_conversations')
      .update({
        project_id: projectId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updatedRow) {
      log.error('Failed to move conversation', updateError);
      return aiBuddyErrorResponse('AIB_006', 'Failed to move conversation');
    }

    // Map to TypeScript type
    const updatedConversation: Conversation = {
      id: updatedRow.id,
      agencyId: updatedRow.agency_id,
      userId: updatedRow.user_id,
      projectId: updatedRow.project_id,
      title: updatedRow.title,
      deletedAt: updatedRow.deleted_at,
      createdAt: updatedRow.created_at,
      updatedAt: updatedRow.updated_at,
    };

    log.info('AI Buddy conversation moved', {
      conversationId: id,
      userId: user.id,
      fromProjectId: conversation.project_id,
      toProjectId: projectId ?? null,
      toProjectName: targetProjectName,
    });

    return aiBuddySuccessResponse(updatedConversation);
  } catch (error) {
    log.error(
      'AI Buddy conversation move error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}
