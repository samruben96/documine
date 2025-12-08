/**
 * AI Buddy Conversations API Route
 * Story 15.4: Conversation Persistence
 *
 * GET /api/ai-buddy/conversations - List user's conversations
 *
 * AC-15.4.4: Conversations listed sorted by most recent activity
 * AC-15.4.6: Returns user's conversations with pagination
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { aiBuddySuccessResponse, aiBuddyErrorResponse } from '@/lib/ai-buddy';
import { log } from '@/lib/utils/logger';
import type { Conversation } from '@/types/ai-buddy';

/**
 * Query parameters validation schema
 */
const queryParamsSchema = z.object({
  projectId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

/**
 * Parse cursor for pagination
 * Cursor format: "updatedAt|id"
 */
function parseCursor(cursor: string): { updatedAt: string; id: string } | null {
  try {
    const [updatedAt, id] = cursor.split('|');
    if (updatedAt && id) {
      return { updatedAt, id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create cursor from conversation
 */
function createCursor(conversation: Conversation): string {
  return `${conversation.updatedAt}|${conversation.id}`;
}

/**
 * GET /api/ai-buddy/conversations
 * List user's conversations with optional filters and cursor-based pagination
 *
 * Query params:
 * - projectId: Filter by project (optional)
 * - search: Search in title (optional)
 * - limit: Number of results (default 50, max 100)
 * - cursor: Pagination cursor (format: "updatedAt|id")
 *
 * Response:
 * {
 *   data: Conversation[],
 *   nextCursor?: string,
 *   error: null
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      projectId: searchParams.get('projectId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      limit: searchParams.get('limit') ?? 50,
      cursor: searchParams.get('cursor') ?? undefined,
    };

    const parseResult = queryParamsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      log.warn('AI Buddy conversations list validation failed', {
        issues: parseResult.error.issues,
      });
      return aiBuddyErrorResponse(
        'AIB_004',
        'Invalid query parameters: ' + parseResult.error.issues[0]?.message
      );
    }

    const { projectId, search, limit, cursor } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy conversations list unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Build query
    // RLS policy ensures user only sees their own conversations
    let query = supabase
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
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });

    // Apply project filter if specified
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Apply search filter if specified (case-insensitive title search)
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply cursor-based pagination
    // Get conversations where (updated_at, id) < cursor
    if (cursor) {
      const parsed = parseCursor(cursor);
      if (parsed) {
        // Use compound comparison for stable pagination
        query = query.or(
          `updated_at.lt.${parsed.updatedAt},and(updated_at.eq.${parsed.updatedAt},id.lt.${parsed.id})`
        );
      }
    }

    // Fetch one extra to determine if there's a next page
    query = query.limit(limit + 1);

    const { data: rows, error: queryError } = await query;

    if (queryError) {
      log.error('Failed to fetch conversations', queryError);
      return aiBuddyErrorResponse('AIB_006', 'Failed to fetch conversations');
    }

    // Map database rows to Conversation type
    const conversations: Conversation[] = (rows || []).map((row) => ({
      id: row.id,
      agencyId: row.agency_id,
      userId: row.user_id,
      projectId: row.project_id,
      title: row.title,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Check if there's a next page
    const hasNextPage = conversations.length > limit;
    const resultConversations = hasNextPage ? conversations.slice(0, limit) : conversations;
    const lastConversation = resultConversations[resultConversations.length - 1];
    const nextCursor = hasNextPage && lastConversation ? createCursor(lastConversation) : undefined;

    log.info('AI Buddy conversations listed', {
      userId: user.id,
      count: resultConversations.length,
      hasNextPage,
      projectId,
      search,
    });

    return aiBuddySuccessResponse({
      data: resultConversations,
      nextCursor,
    });
  } catch (error) {
    log.error(
      'AI Buddy conversations list error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}
