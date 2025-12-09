/**
 * AI Buddy Project Document [documentId] API Route
 * Story 17.2: Project Document Management
 *
 * DELETE /api/ai-buddy/projects/[id]/documents/[documentId] - Remove document from project
 *
 * AC-17.2.5: Remove (X) on project document removes from project context
 * AC-17.2.6: Removing document keeps historical citations valid (document stays in library)
 *
 * Uses verify-then-service pattern per implementation-patterns.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import type { AiBuddyApiResponse, ProjectDocumentRemoveResponse } from '@/types/ai-buddy';

// Error codes per tech spec
const PROJECT_DOC_ERRORS = {
  AIB_401: 'Project not found',
  AIB_402: 'Document not found in project',
} as const;

type ProjectDocErrorCode = keyof typeof PROJECT_DOC_ERRORS;

function createErrorResponse(
  code: ProjectDocErrorCode | 'UNAUTHORIZED' | 'INTERNAL_ERROR',
  message: string,
  status: number
): NextResponse<AiBuddyApiResponse<ProjectDocumentRemoveResponse>> {
  return NextResponse.json(
    {
      data: null,
      error: { code, message },
    },
    { status }
  );
}

/**
 * DELETE /api/ai-buddy/projects/[id]/documents/[documentId]
 * Remove a document from project context
 *
 * AC-17.2.5: Removes document from project (not from library/storage)
 * AC-17.2.6: Historical citations remain valid (document stays in library)
 *
 * Uses verify-then-service pattern because RLS UPDATE/DELETE can fail in Edge Runtime
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
): Promise<NextResponse<AiBuddyApiResponse<ProjectDocumentRemoveResponse>>> {
  try {
    const { id: projectId, documentId } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Step 1: VERIFY OWNERSHIP via SELECT (RLS works here)
    // Verify project exists and belongs to user
    const { data: project, error: projError } = await supabase
      .from('ai_buddy_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projError || !project) {
      return createErrorResponse('AIB_401', PROJECT_DOC_ERRORS.AIB_401, 404);
    }

    // Verify document is linked to project
    const { data: link, error: linkError } = await supabase
      .from('ai_buddy_project_documents')
      .select('project_id, document_id')
      .eq('project_id', projectId)
      .eq('document_id', documentId)
      .single();

    if (linkError || !link) {
      return createErrorResponse('AIB_402', PROJECT_DOC_ERRORS.AIB_402, 404);
    }

    // Step 2: PERFORM DELETION with service client (bypasses RLS)
    // Safe because ownership was verified above
    const serviceClient = createServiceClient();
    const { error: deleteError } = await serviceClient
      .from('ai_buddy_project_documents')
      .delete()
      .eq('project_id', projectId)
      .eq('document_id', documentId);

    if (deleteError) {
      log.error(
        'Failed to remove document from project',
        new Error(deleteError.message),
        { projectId, documentId }
      );
      return createErrorResponse('INTERNAL_ERROR', 'Failed to remove document', 500);
    }

    log.info('Document removed from project', {
      projectId,
      documentId,
      userId: user.id,
    });

    // AC-17.2.6: Document stays in library (no deletion from documents table)
    // Historical citations will still reference the original document

    return NextResponse.json({
      data: { removed: true },
      error: null,
    });
  } catch (error) {
    log.error('Project document DELETE error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('INTERNAL_ERROR', 'Failed to remove document', 500);
  }
}
