/**
 * AI Buddy Conversations API Route
 * Story 14.2: API Route Structure
 *
 * GET /api/ai-buddy/conversations - List user's conversations
 * Stub implementation - actual conversation listing in Epic 16.
 */

import { notImplementedResponse } from '@/lib/ai-buddy';

/**
 * GET /api/ai-buddy/conversations
 * List user's conversations with optional filters
 *
 * Query params:
 * - projectId: Filter by project
 * - search: Full-text search
 * - limit: Pagination (default 20)
 * - offset: Pagination (default 0)
 *
 * Response:
 * {
 *   data: {
 *     conversations: Conversation[];
 *     total: number;
 *   }
 * }
 */
export async function GET(): Promise<Response> {
  return notImplementedResponse();
}
