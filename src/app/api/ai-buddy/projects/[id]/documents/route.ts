/**
 * AI Buddy Project Documents API Route
 * Story 17.2: Project Document Management
 *
 * GET /api/ai-buddy/projects/[id]/documents - List project documents
 * POST /api/ai-buddy/projects/[id]/documents - Add documents (from library or upload)
 *
 * AC-17.2.1: Add Document shows "Upload New" and "Select from Library" options
 * AC-17.2.2: Uploaded documents appear in project's document list
 * AC-17.2.3: Select from Library allows searching/filtering docuMINE documents
 * AC-17.2.4: Library documents link to project (not duplicated)
 * AC-17.2.7: Documents from Comparison have extraction context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createDocumentRecord, createProcessingJob } from '@/lib/documents/service';
import { log } from '@/lib/utils/logger';
import type { ProjectDocument, AiBuddyApiResponse } from '@/types/ai-buddy';

// Max 25 documents per project per tech-spec constraint
const MAX_DOCUMENTS_PER_PROJECT = 25;

// Supported file types per AC-17.1.1 (same as conversation attachments)
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

// Max file size: 50MB per constraint
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Error codes per tech spec
const PROJECT_DOC_ERRORS = {
  AIB_401: 'Project not found',
  AIB_402: 'Document not found',
  AIB_403: 'Maximum documents exceeded (25 per project)',
  AIB_404: 'Document already added to project',
  AIB_405: 'Invalid file type. Allowed: PDF, PNG, JPG, JPEG',
  AIB_406: 'File too large. Maximum size: 50MB',
  AIB_407: 'No files or document IDs provided',
} as const;

type ProjectDocErrorCode = keyof typeof PROJECT_DOC_ERRORS;

// Request body schema for adding library documents
const addDocumentsSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(MAX_DOCUMENTS_PER_PROJECT),
});

function createErrorResponse(
  code: ProjectDocErrorCode | 'UNAUTHORIZED' | 'INTERNAL_ERROR',
  message: string,
  status: number
): NextResponse<AiBuddyApiResponse<{ documents: ProjectDocument[] }>> {
  return NextResponse.json(
    {
      data: null,
      error: { code, message },
    },
    { status }
  );
}

/**
 * GET /api/ai-buddy/projects/[id]/documents
 * List all documents attached to a project
 * AC-17.2.7: Includes extraction_data for quote documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AiBuddyApiResponse<{ documents: ProjectDocument[] }>>> {
  try {
    const { id: projectId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Verify project exists and belongs to user (RLS handles this, but verify explicitly)
    const { data: project, error: projError } = await supabase
      .from('ai_buddy_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      return createErrorResponse('AIB_401', PROJECT_DOC_ERRORS.AIB_401, 404);
    }

    if (project.user_id !== user.id) {
      return createErrorResponse('AIB_401', PROJECT_DOC_ERRORS.AIB_401, 404);
    }

    // Get project documents with document details
    // AC-17.2.7: Include extraction_data for comparison context
    const { data: projectDocs, error: docsError } = await supabase
      .from('ai_buddy_project_documents')
      .select(`
        document_id,
        attached_at,
        documents!inner (
          id,
          filename,
          status,
          page_count,
          created_at,
          metadata,
          extraction_data
        )
      `)
      .eq('project_id', projectId)
      .order('attached_at', { ascending: false });

    if (docsError) {
      log.error('Failed to fetch project documents', docsError);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch documents', 500);
    }

    // Transform to response format
    const formattedDocs: ProjectDocument[] = (projectDocs || []).map((pd) => {
      const doc = pd.documents as unknown as {
        id: string;
        filename: string;
        status: string;
        page_count: number | null;
        created_at: string;
        metadata: Record<string, unknown> | null;
        extraction_data: Record<string, unknown> | null;
      };

      // Get file type from metadata or filename
      const fileType = (doc.metadata?.mimeType as string) ||
                       doc.filename.split('.').pop()?.toLowerCase() ||
                       'unknown';

      return {
        document_id: pd.document_id,
        attached_at: pd.attached_at,
        document: {
          id: doc.id,
          name: doc.filename,
          file_type: fileType,
          status: doc.status,
          page_count: doc.page_count,
          created_at: doc.created_at,
          extraction_data: doc.extraction_data, // AC-17.2.7
        },
      };
    });

    return NextResponse.json({
      data: { documents: formattedDocs },
      error: null,
    });
  } catch (error) {
    log.error('Project documents GET error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch documents', 500);
  }
}

/**
 * POST /api/ai-buddy/projects/[id]/documents
 * Add documents to a project
 *
 * Supports two modes:
 * 1. JSON body with documentIds array - Add existing library documents (AC-17.2.3, AC-17.2.4)
 * 2. multipart/form-data with files - Upload new documents (AC-17.2.2)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AiBuddyApiResponse<{ documents: ProjectDocument[] }>>> {
  try {
    const { id: projectId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Get user's agency
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse('UNAUTHORIZED', 'User not found', 401);
    }

    const agencyId = userData.agency_id;

    // Verify project exists and belongs to user
    const { data: project, error: projError } = await supabase
      .from('ai_buddy_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      return createErrorResponse('AIB_401', PROJECT_DOC_ERRORS.AIB_401, 404);
    }

    if (project.user_id !== user.id) {
      return createErrorResponse('AIB_401', PROJECT_DOC_ERRORS.AIB_401, 404);
    }

    // Check current document count
    const { count: currentCount, error: countError } = await supabase
      .from('ai_buddy_project_documents')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (countError) {
      log.error('Failed to count project documents', countError);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to check document count', 500);
    }

    const existingCount = currentCount || 0;

    // Determine request type by Content-Type header
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    if (isMultipart) {
      // Handle file upload
      return await handleFileUpload(
        request,
        supabase,
        projectId,
        agencyId,
        user.id,
        existingCount
      );
    } else {
      // Handle adding existing library documents
      return await handleAddLibraryDocuments(
        request,
        supabase,
        projectId,
        existingCount
      );
    }
  } catch (error) {
    log.error('Project documents POST error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('INTERNAL_ERROR', 'Failed to add documents', 500);
  }
}

/**
 * Handle adding existing documents from library
 * AC-17.2.3: Select from Library allows searching/filtering
 * AC-17.2.4: Links to project without duplicating
 */
async function handleAddLibraryDocuments(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  existingCount: number
): Promise<NextResponse<AiBuddyApiResponse<{ documents: ProjectDocument[] }>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse('AIB_407', 'Invalid JSON body', 400);
  }

  const parseResult = addDocumentsSchema.safeParse(body);
  if (!parseResult.success) {
    return createErrorResponse('AIB_407', PROJECT_DOC_ERRORS.AIB_407, 400);
  }

  const { documentIds } = parseResult.data;

  // Check max documents limit
  if (existingCount + documentIds.length > MAX_DOCUMENTS_PER_PROJECT) {
    return createErrorResponse(
      'AIB_403',
      `${PROJECT_DOC_ERRORS.AIB_403}. Current: ${existingCount}, Adding: ${documentIds.length}`,
      400
    );
  }

  // Verify all documents exist and user has access (RLS handles agency access)
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, filename, status, page_count, created_at, metadata, extraction_data')
    .in('id', documentIds);

  if (docsError) {
    log.error('Failed to verify documents', docsError);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to verify documents', 500);
  }

  if (!documents || documents.length !== documentIds.length) {
    const foundIds = new Set(documents?.map(d => d.id) || []);
    const missing = documentIds.filter(id => !foundIds.has(id));
    return createErrorResponse(
      'AIB_402',
      `${PROJECT_DOC_ERRORS.AIB_402}: ${missing.join(', ')}`,
      404
    );
  }

  // Check for duplicates already in project
  const { data: existingLinks, error: existingError } = await supabase
    .from('ai_buddy_project_documents')
    .select('document_id')
    .eq('project_id', projectId)
    .in('document_id', documentIds);

  if (existingError) {
    log.error('Failed to check existing links', existingError);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to check existing links', 500);
  }

  const alreadyLinked = new Set(existingLinks?.map(l => l.document_id) || []);
  const newDocumentIds = documentIds.filter(id => !alreadyLinked.has(id));

  if (newDocumentIds.length === 0) {
    // All documents already linked - return them anyway
    return createSuccessResponse(documents, documentIds);
  }

  // Insert new links
  const linksToInsert = newDocumentIds.map(documentId => ({
    project_id: projectId,
    document_id: documentId,
  }));

  const { error: insertError } = await supabase
    .from('ai_buddy_project_documents')
    .insert(linksToInsert);

  if (insertError) {
    log.error('Failed to link documents to project', insertError);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to add documents to project', 500);
  }

  log.info('Documents added to project', {
    projectId,
    documentIds: newDocumentIds,
    skipped: documentIds.length - newDocumentIds.length,
  });

  return createSuccessResponse(documents, documentIds);
}

/**
 * Handle file upload to project
 * AC-17.2.2: Uploaded documents appear in project's document list
 */
async function handleFileUpload(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  agencyId: string,
  userId: string,
  existingCount: number
): Promise<NextResponse<AiBuddyApiResponse<{ documents: ProjectDocument[] }>>> {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return createErrorResponse('AIB_407', PROJECT_DOC_ERRORS.AIB_407, 400);
  }

  // Check max documents limit
  if (existingCount + files.length > MAX_DOCUMENTS_PER_PROJECT) {
    return createErrorResponse(
      'AIB_403',
      `${PROJECT_DOC_ERRORS.AIB_403}. Current: ${existingCount}, Uploading: ${files.length}`,
      400
    );
  }

  // Validate all files before processing
  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return createErrorResponse(
        'AIB_405',
        `${PROJECT_DOC_ERRORS.AIB_405}. Invalid file: ${file.name}`,
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        'AIB_406',
        `${PROJECT_DOC_ERRORS.AIB_406}. File: ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        400
      );
    }
  }

  // Process each file
  const uploadedDocuments: ProjectDocument[] = [];

  for (const file of files) {
    try {
      const documentId = crypto.randomUUID();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const storagePath = `${agencyId}/${documentId}.${extension}`;

      // Upload to Supabase Storage
      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        log.error('Storage upload failed', uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      // Create document record
      await createDocumentRecord(supabase, {
        id: documentId,
        agencyId,
        uploadedBy: userId,
        filename: file.name,
        storagePath,
      });

      // Link document to project
      const { error: linkError } = await supabase
        .from('ai_buddy_project_documents')
        .insert({
          project_id: projectId,
          document_id: documentId,
        });

      if (linkError) {
        log.error('Failed to link document to project', linkError);
        throw new Error(`Failed to link ${file.name} to project`);
      }

      // Create processing job (async processing via pg_cron)
      await createProcessingJob(documentId);

      uploadedDocuments.push({
        document_id: documentId,
        attached_at: new Date().toISOString(),
        document: {
          id: documentId,
          name: file.name,
          file_type: extension,
          status: 'processing',
          page_count: null,
          created_at: new Date().toISOString(),
        },
      });

      log.info('Document uploaded to project', {
        projectId,
        documentId,
        filename: file.name,
        userId,
      });
    } catch (fileError) {
      log.error('Failed to process file', fileError instanceof Error ? fileError : new Error(String(fileError)));
      // Continue processing other files
    }
  }

  if (uploadedDocuments.length === 0) {
    return createErrorResponse('INTERNAL_ERROR', 'Failed to upload any files', 500);
  }

  return NextResponse.json({
    data: { documents: uploadedDocuments },
    error: null,
  });
}

/**
 * Helper to create success response from document records
 */
function createSuccessResponse(
  documents: Array<{
    id: string;
    filename: string;
    status: string;
    page_count: number | null;
    created_at: string;
    metadata: unknown;
    extraction_data: unknown;
  }>,
  requestedIds: string[]
): NextResponse<AiBuddyApiResponse<{ documents: ProjectDocument[] }>> {
  const now = new Date().toISOString();
  const docMap = new Map(documents.map(d => [d.id, d]));

  const formattedDocs: ProjectDocument[] = requestedIds
    .filter(id => docMap.has(id))
    .map(id => {
      const doc = docMap.get(id)!;
      const fileType = (doc.metadata as Record<string, unknown>)?.mimeType as string ||
                       doc.filename.split('.').pop()?.toLowerCase() ||
                       'unknown';
      return {
        document_id: doc.id,
        attached_at: now,
        document: {
          id: doc.id,
          name: doc.filename,
          file_type: fileType,
          status: doc.status,
          page_count: doc.page_count,
          created_at: doc.created_at,
          extraction_data: doc.extraction_data as Record<string, unknown> | null,
        },
      };
    });

  return NextResponse.json({
    data: { documents: formattedDocs },
    error: null,
  });
}
