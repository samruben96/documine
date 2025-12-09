/**
 * AI Buddy Conversation Attachments API Route
 * Story 17.1: Document Upload to Conversation with Status
 *
 * POST /api/ai-buddy/conversations/[id]/attachments - Upload files to conversation
 * GET /api/ai-buddy/conversations/[id]/attachments - List conversation attachments
 *
 * AC-17.1.1: File picker opens for PDF and image files
 * AC-17.1.2: Attachments appear as pending with file names
 * AC-17.1.3: Status indicator per file: Uploading → Processing → Ready
 * AC-17.1.8: File type and size validation (PDF, PNG, JPG, 50MB)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createDocumentRecord, createProcessingJob } from '@/lib/documents/service';
import { log } from '@/lib/utils/logger';
import type { ConversationAttachment, AiBuddyApiResponse } from '@/types/ai-buddy';

// Supported file types per AC-17.1.1
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

// Max file size: 50MB per constraint
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Max attachments per message: 5 per AC-17.1.2
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

// Error codes per tech spec
const ATTACHMENT_ERRORS = {
  AIB_301: 'Conversation not found',
  AIB_302: 'Maximum attachments exceeded (5 per message)',
  AIB_303: 'Invalid file type. Allowed: PDF, PNG, JPG, JPEG',
  AIB_304: 'File too large. Maximum size: 50MB',
  AIB_305: 'No files provided',
} as const;

type AttachmentErrorCode = keyof typeof ATTACHMENT_ERRORS;

function createErrorResponse(
  code: AttachmentErrorCode | 'UNAUTHORIZED' | 'INTERNAL_ERROR',
  message: string,
  status: number
): NextResponse<AiBuddyApiResponse<{ attachments: ConversationAttachment[] }>> {
  return NextResponse.json(
    {
      data: null,
      error: { code, message },
    },
    { status }
  );
}

/**
 * GET /api/ai-buddy/conversations/[id]/attachments
 * List all attachments for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AiBuddyApiResponse<{ attachments: ConversationAttachment[] }>>> {
  try {
    const { id: conversationId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Verify conversation exists and belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('ai_buddy_conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return createErrorResponse('AIB_301', ATTACHMENT_ERRORS.AIB_301, 404);
    }

    // Get attachments with document details
    const { data: attachments, error: attachError } = await supabase
      .from('ai_buddy_conversation_documents')
      .select(`
        document_id,
        attached_at,
        documents!inner (
          id,
          filename,
          status,
          page_count,
          metadata
        )
      `)
      .eq('conversation_id', conversationId)
      .order('attached_at', { ascending: false });

    if (attachError) {
      log.error('Failed to fetch conversation attachments', attachError);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch attachments', 500);
    }

    // Transform to response format
    const formattedAttachments: ConversationAttachment[] = (attachments || []).map((att) => {
      const doc = att.documents as unknown as {
        id: string;
        filename: string;
        status: string;
        page_count: number | null;
        metadata: Record<string, unknown> | null;
      };

      // Get file type from metadata or filename
      const fileType = (doc.metadata?.mimeType as string) ||
                       doc.filename.split('.').pop()?.toLowerCase() ||
                       'unknown';

      return {
        document_id: att.document_id,
        attached_at: att.attached_at,
        document: {
          id: doc.id,
          name: doc.filename,
          file_type: fileType,
          status: doc.status,
          page_count: doc.page_count,
        },
      };
    });

    return NextResponse.json({
      data: { attachments: formattedAttachments },
      error: null,
    });
  } catch (error) {
    log.error('Conversation attachments GET error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch attachments', 500);
  }
}

/**
 * POST /api/ai-buddy/conversations/[id]/attachments
 * Upload files to a conversation
 * Accepts multipart/form-data with 'files' field
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AiBuddyApiResponse<{ attachments: ConversationAttachment[] }>>> {
  try {
    const { id: conversationId } = await params;

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

    // Verify conversation exists and belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('ai_buddy_conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return createErrorResponse('AIB_301', ATTACHMENT_ERRORS.AIB_301, 404);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return createErrorResponse('AIB_305', ATTACHMENT_ERRORS.AIB_305, 400);
    }

    // AC-17.1.2: Max 5 files per message
    if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      return createErrorResponse('AIB_302', ATTACHMENT_ERRORS.AIB_302, 400);
    }

    // Validate all files before processing
    for (const file of files) {
      // Check file type (AC-17.1.8)
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(extension) && !ALLOWED_MIME_TYPES.includes(file.type)) {
        return createErrorResponse(
          'AIB_303',
          `${ATTACHMENT_ERRORS.AIB_303}. Invalid file: ${file.name}`,
          400
        );
      }

      // Check file size (AC-17.1.8: 50MB limit)
      if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse(
          'AIB_304',
          `${ATTACHMENT_ERRORS.AIB_304}. File: ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
          400
        );
      }
    }

    // Process each file
    const uploadedAttachments: ConversationAttachment[] = [];

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
        const document = await createDocumentRecord(supabase, {
          id: documentId,
          agencyId,
          uploadedBy: user.id,
          filename: file.name,
          storagePath,
        });

        // Link document to conversation
        const { error: linkError } = await supabase
          .from('ai_buddy_conversation_documents')
          .insert({
            conversation_id: conversationId,
            document_id: documentId,
          });

        if (linkError) {
          log.error('Failed to link document to conversation', linkError);
          throw new Error(`Failed to link ${file.name} to conversation`);
        }

        // Create processing job (async processing via pg_cron)
        await createProcessingJob(documentId);

        uploadedAttachments.push({
          document_id: documentId,
          attached_at: new Date().toISOString(),
          document: {
            id: documentId,
            name: file.name,
            file_type: extension,
            status: 'processing',
            page_count: null,
          },
        });

        log.info('Document attached to conversation', {
          conversationId,
          documentId,
          filename: file.name,
          userId: user.id,
        });
      } catch (fileError) {
        log.error('Failed to process file', fileError instanceof Error ? fileError : new Error(String(fileError)));
        // Continue processing other files, but log the error
      }
    }

    if (uploadedAttachments.length === 0) {
      return createErrorResponse('INTERNAL_ERROR', 'Failed to upload any files', 500);
    }

    return NextResponse.json({
      data: { attachments: uploadedAttachments },
      error: null,
    });
  } catch (error) {
    log.error('Conversation attachments POST error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse('INTERNAL_ERROR', 'Failed to upload attachments', 500);
  }
}
