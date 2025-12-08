/**
 * AI Buddy Projects API Route
 * Story 16.1: Project Creation & Sidebar
 *
 * GET /api/ai-buddy/projects - List user's projects
 * POST /api/ai-buddy/projects - Create a new project
 *
 * AC-16.1.4: Create project via API
 * AC-16.1.7: Return AIB_102 if name exceeds 100 characters
 * AC-16.1.8: List projects for sidebar
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { aiBuddySuccessResponse, aiBuddyErrorResponse } from '@/lib/ai-buddy';
import { listProjects, createProject } from '@/lib/ai-buddy/project-service';
import { log } from '@/lib/utils/logger';

/**
 * Query parameters schema for GET
 */
const listQuerySchema = z.object({
  includeArchived: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sortBy: z.enum(['name', 'updated_at', 'created_at']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Request body schema for POST
 */
const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name exceeds 100 characters'),
  description: z
    .string()
    .max(500, 'Project description exceeds 500 characters')
    .optional()
    .nullable(),
});

/**
 * GET /api/ai-buddy/projects
 * List user's projects
 *
 * Query params:
 * - includeArchived: Include archived projects (default: false)
 * - sortBy: Sort field (name | updated_at | created_at, default: name)
 * - sortOrder: Sort order (asc | desc, default: asc for name, desc for dates)
 *
 * Response:
 * {
 *   data: Project[],
 *   error: null
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      includeArchived: searchParams.get('includeArchived') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const parseResult = listQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      log.warn('AI Buddy projects list validation failed', {
        issues: parseResult.error.issues,
      });
      return aiBuddyErrorResponse(
        'AIB_004',
        'Invalid query parameters: ' + parseResult.error.issues[0]?.message
      );
    }

    const { includeArchived, sortBy, sortOrder } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy projects list unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // List projects via service
    const result = await listProjects(supabase, user.id, {
      includeArchived,
      sortBy,
      sortOrder,
    });

    if (result.error) {
      log.warn('Failed to list projects', { error: result.error });
      return aiBuddyErrorResponse(
        result.error.code as 'AIB_006',
        result.error.message
      );
    }

    log.info('AI Buddy projects listed', {
      userId: user.id,
      count: result.data?.length ?? 0,
      includeArchived,
    });

    return aiBuddySuccessResponse(result.data);
  } catch (error) {
    log.error(
      'AI Buddy projects list error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}

/**
 * POST /api/ai-buddy/projects
 * Create a new project
 *
 * Request body:
 * {
 *   name: string;          // Required, max 100 chars
 *   description?: string;  // Optional, max 500 chars
 * }
 *
 * Response:
 * {
 *   data: Project,
 *   error: null
 * }
 *
 * Error codes:
 * - AIB_101: Name is required
 * - AIB_102: Name exceeds 100 characters
 * - AIB_103: Description exceeds 500 characters
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return aiBuddyErrorResponse('AIB_004', 'Invalid JSON body');
    }

    const parseResult = createProjectSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      // Map Zod errors to specific error codes
      if (issue?.path[0] === 'name') {
        if (issue.code === 'too_big') {
          return aiBuddyErrorResponse('AIB_102', 'Project name exceeds 100 characters');
        }
        if (issue.code === 'too_small' || issue.message.includes('required')) {
          return aiBuddyErrorResponse('AIB_101', 'Project name is required');
        }
      }
      if (issue?.path[0] === 'description' && issue.code === 'too_big') {
        return aiBuddyErrorResponse('AIB_103', 'Project description exceeds 500 characters');
      }
      return aiBuddyErrorResponse('AIB_004', issue?.message ?? 'Invalid request body');
    }

    const { name, description } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy create project unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Get user's agency ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      log.warn('Failed to get user agency', { error: userError });
      return aiBuddyErrorResponse('AIB_006', 'Failed to get user agency');
    }

    // Create project via service
    const result = await createProject(supabase, user.id, userData.agency_id, {
      name,
      description: description ?? undefined,
    });

    if (result.error) {
      log.warn('Failed to create project', { error: result.error });
      return aiBuddyErrorResponse(
        result.error.code as 'AIB_101' | 'AIB_102' | 'AIB_103' | 'AIB_006',
        result.error.message
      );
    }

    log.info('AI Buddy project created', {
      userId: user.id,
      projectId: result.data?.id,
      name,
    });

    return aiBuddySuccessResponse(result.data, 201);
  } catch (error) {
    log.error(
      'AI Buddy create project error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}
