/**
 * AI Buddy Projects API Route
 * Story 14.2: API Route Structure
 *
 * GET /api/ai-buddy/projects - List user's projects
 * POST /api/ai-buddy/projects - Create a new project
 * Stub implementation - actual project CRUD in Epic 16.
 */

import { notImplementedResponse } from '@/lib/ai-buddy';

/**
 * GET /api/ai-buddy/projects
 * List user's projects
 *
 * Response:
 * {
 *   data: {
 *     projects: Project[];
 *     total: number;
 *   }
 * }
 */
export async function GET(): Promise<Response> {
  return notImplementedResponse();
}

/**
 * POST /api/ai-buddy/projects
 * Create a new project
 *
 * Request body:
 * {
 *   name: string;
 *   description?: string;
 * }
 *
 * Response:
 * {
 *   data: {
 *     project: Project;
 *   }
 * }
 */
export async function POST(): Promise<Response> {
  return notImplementedResponse();
}
