/**
 * AI Buddy Project [id] API Route
 * Story 16.3: Project Management - Rename & Archive
 *
 * GET /api/ai-buddy/projects/[id] - Get a single project
 * PATCH /api/ai-buddy/projects/[id] - Update project (rename)
 * DELETE /api/ai-buddy/projects/[id] - Archive project (soft delete)
 *
 * AC-16.3.3: Enter saves renamed project
 * AC-16.3.4: Renamed project updates immediately (via API)
 * AC-16.3.6: Confirming archive sets archived_at
 * AC-16.3.8: Restoring project clears archived_at
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { aiBuddySuccessResponse, aiBuddyErrorResponse } from '@/lib/ai-buddy';
import { getProject, archiveProject, restoreProject } from '@/lib/ai-buddy/project-service';
import { log } from '@/lib/utils/logger';

/**
 * Request body schema for PATCH
 */
const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name exceeds 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Project description exceeds 500 characters')
    .nullable()
    .optional(),
  restore: z.boolean().optional(),
});

/**
 * GET /api/ai-buddy/projects/[id]
 * Get a single project
 *
 * Response:
 * {
 *   data: Project,
 *   error: null
 * }
 *
 * Error codes:
 * - AIB_104: Project not found
 * - AIB_105: Not authorized to view this project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: projectId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy get project unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Get project via service (RLS will filter)
    const result = await getProject(supabase, projectId);

    if (result.error) {
      if (result.error.code === 'AIB_005') {
        return aiBuddyErrorResponse('AIB_104', 'Project not found');
      }
      return aiBuddyErrorResponse('AIB_006', result.error.message);
    }

    // Verify ownership
    if (result.data?.userId !== user.id) {
      return aiBuddyErrorResponse('AIB_105', 'Not authorized to view this project');
    }

    log.info('AI Buddy project retrieved', {
      userId: user.id,
      projectId,
    });

    return aiBuddySuccessResponse(result.data);
  } catch (error) {
    log.error(
      'AI Buddy get project error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}

/**
 * PATCH /api/ai-buddy/projects/[id]
 * Update project name/description or restore archived project
 *
 * Request body:
 * {
 *   name?: string;          // Max 100 chars
 *   description?: string;   // Max 500 chars
 *   restore?: boolean;      // If true, restore archived project
 * }
 *
 * Response:
 * {
 *   data: Project,
 *   error: null
 * }
 *
 * Error codes:
 * - AIB_102: Name exceeds 100 characters
 * - AIB_104: Project not found
 * - AIB_105: Not authorized to modify this project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: projectId } = await params;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return aiBuddyErrorResponse('AIB_004', 'Invalid JSON body');
    }

    const parseResult = updateProjectSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      if (issue?.path[0] === 'name' && issue.code === 'too_big') {
        return aiBuddyErrorResponse('AIB_102', 'Project name exceeds 100 characters');
      }
      return aiBuddyErrorResponse('AIB_004', issue?.message ?? 'Invalid request body');
    }

    const { name, description, restore } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy update project unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Verify project exists and user owns it (via SELECT)
    const { data: existing, error: existingError } = await supabase
      .from('ai_buddy_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .maybeSingle();

    if (existingError || !existing) {
      return aiBuddyErrorResponse('AIB_104', 'Project not found');
    }

    if (existing.user_id !== user.id) {
      return aiBuddyErrorResponse('AIB_105', 'Not authorized to modify this project');
    }

    // Handle restore
    if (restore === true) {
      const result = await restoreProject(supabase, projectId);
      if (result.error) {
        return aiBuddyErrorResponse('AIB_006', result.error.message);
      }

      log.info('AI Buddy project restored', {
        userId: user.id,
        projectId,
      });

      return aiBuddySuccessResponse(result.data);
    }

    // Build update object
    const updates: Record<string, string | null> = {};
    if (name !== undefined) {
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      // Nothing to update
      const result = await getProject(supabase, projectId);
      return aiBuddySuccessResponse(result.data);
    }

    // Update via direct query
    const { data: updated, error: updateError } = await supabase
      .from('ai_buddy_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select(
        `
        id,
        agency_id,
        user_id,
        name,
        description,
        archived_at,
        created_at,
        updated_at
      `
      )
      .single();

    if (updateError) {
      log.warn('Failed to update project', { error: updateError });
      return aiBuddyErrorResponse('AIB_006', 'Failed to update project');
    }

    // Map to Project type
    const project = {
      id: updated.id,
      agencyId: updated.agency_id,
      userId: updated.user_id,
      name: updated.name,
      description: updated.description,
      archivedAt: updated.archived_at,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      documentCount: 0, // Not included in update response
    };

    log.info('AI Buddy project updated', {
      userId: user.id,
      projectId,
      updates: Object.keys(updates),
    });

    return aiBuddySuccessResponse(project);
  } catch (error) {
    log.error(
      'AI Buddy update project error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}

/**
 * DELETE /api/ai-buddy/projects/[id]
 * Archive project (soft delete)
 *
 * Response:
 * {
 *   data: { success: true, archivedAt: string },
 *   error: null
 * }
 *
 * Error codes:
 * - AIB_104: Project not found
 * - AIB_105: Not authorized to delete this project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: projectId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy archive project unauthorized');
      return aiBuddyErrorResponse('AIB_001', 'Authentication required');
    }

    // Verify project exists and user owns it (via SELECT)
    const { data: existing, error: existingError } = await supabase
      .from('ai_buddy_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .maybeSingle();

    if (existingError || !existing) {
      return aiBuddyErrorResponse('AIB_104', 'Project not found');
    }

    if (existing.user_id !== user.id) {
      return aiBuddyErrorResponse('AIB_105', 'Not authorized to delete this project');
    }

    // Archive via service
    const result = await archiveProject(supabase, projectId);

    if (result.error) {
      return aiBuddyErrorResponse('AIB_006', result.error.message);
    }

    log.info('AI Buddy project archived', {
      userId: user.id,
      projectId,
    });

    return aiBuddySuccessResponse({
      success: true,
      archivedAt: result.data?.archivedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    log.error(
      'AI Buddy archive project error',
      error instanceof Error ? error : new Error(String(error))
    );
    return aiBuddyErrorResponse('AIB_006', 'Something went wrong');
  }
}
