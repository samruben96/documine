/**
 * AI Buddy Admin Users API Route
 * Story 14.2: API Route Structure
 *
 * GET /api/ai-buddy/admin/users - List agency users
 * POST /api/ai-buddy/admin/users - Invite new user
 * DELETE /api/ai-buddy/admin/users - Remove user
 * Admin only - requires manage_users permission.
 * Stub implementation - actual user management in Epic 20.
 */

import { notImplementedResponse } from '@/lib/ai-buddy';

/**
 * GET /api/ai-buddy/admin/users
 * List agency users with AI Buddy access
 *
 * Response:
 * {
 *   data: {
 *     users: Array<{
 *       id: string;
 *       email: string;
 *       name: string;
 *       permissions: Permission[];
 *       lastActive?: string;
 *     }>;
 *     total: number;
 *   }
 * }
 */
export async function GET(): Promise<Response> {
  return notImplementedResponse();
}

/**
 * POST /api/ai-buddy/admin/users
 * Invite a new user to AI Buddy
 *
 * Request body:
 * {
 *   email: string;
 *   permissions: Permission[];
 * }
 *
 * Response:
 * {
 *   data: {
 *     user: { id: string; email: string; permissions: Permission[] };
 *   }
 * }
 */
export async function POST(): Promise<Response> {
  return notImplementedResponse();
}

/**
 * DELETE /api/ai-buddy/admin/users
 * Remove a user's AI Buddy access
 *
 * Query params:
 * - userId: User ID to remove
 *
 * Response:
 * {
 *   data: {
 *     success: true;
 *   }
 * }
 */
export async function DELETE(): Promise<Response> {
  return notImplementedResponse();
}
