'use server';

import { createClient } from '@/lib/supabase/server';
import { uploadDocumentToStorage, deleteDocumentFromStorage } from '@/lib/documents/upload';
import {
  createDocumentRecord,
  createProcessingJob,
  deleteDocument as deleteDocumentService,
  updateDocumentStatus,
} from '@/lib/documents/service';
import { checkUploadRateLimit, getRateLimitInfo } from '@/lib/documents/rate-limit';
import { validateUploadFile } from '@/lib/validations/documents';
import { revalidatePath } from 'next/cache';
import type { Tables } from '@/types/database.types';

export type Document = Tables<'documents'>;

export interface UserAgencyInfo {
  userId: string;
  agencyId: string;
}

/**
 * Upload Document Server Action
 *
 * Orchestrates the complete upload flow:
 * 1. Get file from form data
 * 2. Validate file using Zod schema (PDF, <50MB)
 * 3. Get authenticated user
 * 4. Get user's agency_id
 * 5. Check rate limits (AC-4.7.7)
 * 6. Upload to Supabase Storage
 * 7. Create document record (status: 'processing')
 * 8. Create processing job
 * 9. Revalidate and return document
 *
 * Implements AC-4.1.4, AC-4.1.5, AC-4.1.7, AC-4.1.8, AC-4.7.7
 */
export async function uploadDocument(formData: FormData): Promise<{
  success: boolean;
  document?: Document;
  error?: string;
  rateLimitExceeded?: boolean;
  rateLimitInfo?: {
    remaining: number;
    limit: number;
    resetInSeconds: number;
    tier: string;
  };
}> {
  try {
    // 1. Get file from form data
    const file = formData.get('file') as File | null;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // 2. Validate file using Zod schema (AC-4.1.4, AC-4.1.5)
    const validation = validateUploadFile(file);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    // 3. Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // 4. Get user's agency_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    const agencyId = userData.agency_id;

    // 5. Check rate limits (AC-4.7.7)
    const rateLimit = await checkUploadRateLimit(agencyId);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: rateLimit.reason || 'Rate limit exceeded',
        rateLimitExceeded: true,
        rateLimitInfo: {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          resetInSeconds: rateLimit.resetInSeconds,
          tier: rateLimit.tier,
        },
      };
    }

    const documentId = crypto.randomUUID();

    // 6. Upload file to Supabase Storage (AC-4.1.7)
    const uploadResult = await uploadDocumentToStorage(
      supabase,
      file,
      agencyId,
      documentId
    );

    // 7. Create document record with status='processing' (AC-4.1.8)
    const document = await createDocumentRecord(supabase, {
      id: documentId,
      agencyId,
      uploadedBy: user.id,
      filename: file.name,
      storagePath: uploadResult.storagePath,
    });

    // 8. Create processing job to trigger Edge Function
    await createProcessingJob(documentId);

    // 9. Revalidate documents page
    revalidatePath('/documents');

    return { success: true, document };
  } catch (error) {
    console.error('Upload document failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete Document Server Action
 *
 * Deletes document record (cascades to chunks, conversations) and storage file.
 */
export async function deleteDocumentAction(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // 2. Delete document (returns storage path)
    const storagePath = await deleteDocumentService(supabase, documentId);

    // 3. Delete from storage (non-blocking, errors logged but not thrown)
    await deleteDocumentFromStorage(supabase, storagePath);

    // 4. Revalidate documents page
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('Delete document failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Get Rate Limit Info Server Action
 *
 * Returns current rate limit status for the user's agency.
 *
 * Implements AC-4.7.7: Rate Limiting (UI display)
 */
export async function getRateLimitInfoAction(): Promise<{
  success: boolean;
  data?: {
    tier: string;
    uploadsPerHour: number;
    uploadsThisHour: number;
    remaining: number;
    maxConcurrentProcessing: number;
    currentProcessing: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    const info = await getRateLimitInfo(userData.agency_id);

    return { success: true, data: info };
  } catch (error) {
    console.error('Get rate limit info failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rate limit info',
    };
  }
}

/**
 * Get Documents Server Action
 *
 * Returns list of documents for the current user's agency.
 */
export async function getDocuments(): Promise<{
  success: boolean;
  documents?: Document[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // RLS policies ensure we only get agency-scoped documents
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: 'Failed to load documents' };
    }

    return { success: true, documents: data ?? [] };
  } catch (error) {
    console.error('Get documents failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load documents',
    };
  }
}

/**
 * Get User Agency Info Server Action
 *
 * Returns the current user's ID and agency ID for client-side upload.
 * Used to construct storage paths before uploading.
 */
export async function getUserAgencyInfo(): Promise<{
  success: boolean;
  data?: UserAgencyInfo;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        agencyId: userData.agency_id,
      },
    };
  } catch (error) {
    console.error('Get user agency info failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user info',
    };
  }
}

/**
 * Create Document From Upload Server Action
 *
 * Creates document record after client-side upload completes.
 * Used with client-side progress tracking upload flow.
 *
 * Implements AC-4.1.8, AC-4.2.1
 */
export async function createDocumentFromUpload(input: {
  documentId: string;
  filename: string;
  storagePath: string;
}): Promise<{
  success: boolean;
  document?: Document;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    // Create document record with status='processing'
    const document = await createDocumentRecord(supabase, {
      id: input.documentId,
      agencyId: userData.agency_id,
      uploadedBy: user.id,
      filename: input.filename,
      storagePath: input.storagePath,
    });

    // Create processing job to trigger Edge Function
    await createProcessingJob(input.documentId);

    // Revalidate documents page
    revalidatePath('/documents');

    return { success: true, document };
  } catch (error) {
    console.error('Create document from upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create document',
    };
  }
}

/**
 * Retry Document Processing Server Action
 *
 * Retries processing for a failed document by creating a new processing job.
 * Validates document is in 'failed' status before allowing retry.
 *
 * Implements AC-4.7.6: Retry Mechanism
 */
export async function retryDocumentProcessing(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify document exists and check status
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, status, storage_path, agency_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return { success: false, error: 'Document not found' };
    }

    // Only allow retry for failed documents
    if (document.status !== 'failed') {
      return {
        success: false,
        error: `Cannot retry document with status '${document.status}'. Only failed documents can be retried.`,
      };
    }

    // Update document status back to processing
    await updateDocumentStatus(supabase, documentId, 'processing');

    // Create new processing job (this triggers the Edge Function via database hook)
    await createProcessingJob(documentId);

    // Revalidate documents page
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('Retry document processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Retry failed',
    };
  }
}

/**
 * Get Document Queue Position Server Action
 *
 * Returns the queue position for a processing document.
 *
 * Implements AC-4.7.4: Queue Position Display
 */
export async function getDocumentQueuePosition(documentId: string): Promise<{
  success: boolean;
  position?: number;
  isProcessing?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Call the database function to get queue position
    const { data, error } = await supabase.rpc('get_queue_position', {
      p_document_id: documentId,
    });

    if (error) {
      console.error('Get queue position failed:', error);
      return { success: false, error: 'Failed to get queue position' };
    }

    const position = data as number;

    return {
      success: true,
      position,
      isProcessing: position === 0,
    };
  } catch (error) {
    console.error('Get queue position failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get queue position',
    };
  }
}

/**
 * Rename Document Server Action
 *
 * Updates the display_name of a document. Original filename is preserved.
 *
 * Implements AC-4.5.3, AC-4.5.4
 */
export async function renameDocument(
  documentId: string,
  displayName: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate input
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      return { success: false, error: 'Name cannot be empty' };
    }

    if (trimmedName.length > 255) {
      return { success: false, error: 'Name too long (max 255 characters)' };
    }

    if (trimmedName.includes('/') || trimmedName.includes('\\')) {
      return { success: false, error: 'Name cannot contain path separators' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update display_name (RLS ensures agency isolation)
    const { error } = await supabase
      .from('documents')
      .update({ display_name: trimmedName })
      .eq('id', documentId);

    if (error) {
      console.error('Rename document failed:', error);
      return { success: false, error: 'Failed to rename document' };
    }

    // Revalidate documents page
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('Rename document failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rename failed',
    };
  }
}

// ============================================================================
// Label Server Actions - AC-4.5.5, AC-4.5.6, AC-4.5.8, AC-4.5.10
// ============================================================================

export type Label = Tables<'labels'>;

/**
 * Label color palette - auto-assigned based on hash of label name
 * Muted Tailwind colors for consistent appearance
 */
const LABEL_COLORS = [
  '#64748b', // slate-500 (default)
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
];

/**
 * Get color for a label based on name hash
 */
function getLabelColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % LABEL_COLORS.length;
  return LABEL_COLORS[index] ?? '#64748b';
}

/**
 * Get Labels Server Action
 *
 * Fetches all labels for the current user's agency.
 *
 * Implements AC-4.5.5, AC-4.5.10
 */
export async function getLabels(): Promise<{
  success: boolean;
  labels?: Label[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // RLS policies ensure we only get agency-scoped labels
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Get labels failed:', error);
      return { success: false, error: 'Failed to load labels' };
    }

    return { success: true, labels: data ?? [] };
  } catch (error) {
    console.error('Get labels failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load labels',
    };
  }
}

/**
 * Create Label Server Action
 *
 * Creates a new label for the current agency.
 * Handles duplicate prevention (case-insensitive).
 *
 * Implements AC-4.5.6, AC-4.5.10
 */
export async function createLabel(name: string): Promise<{
  success: boolean;
  label?: Label;
  error?: string;
}> {
  try {
    // Validate input
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Label name cannot be empty' };
    }

    if (trimmedName.length > 50) {
      return { success: false, error: 'Label name too long (max 50 characters)' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's agency_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return { success: false, error: 'Failed to get user data' };
    }

    // Create label with auto-assigned color
    const color = getLabelColor(trimmedName);
    const { data, error } = await supabase
      .from('labels')
      .insert({
        agency_id: userData.agency_id,
        name: trimmedName,
        color,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate (unique constraint on agency_id + LOWER(name))
      if (error.code === '23505') {
        return { success: false, error: 'Label already exists' };
      }
      console.error('Create label failed:', error);
      return { success: false, error: 'Failed to create label' };
    }

    return { success: true, label: data };
  } catch (error) {
    console.error('Create label failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create label',
    };
  }
}

/**
 * Add Label to Document Server Action
 *
 * Associates a label with a document.
 *
 * Implements AC-4.5.5
 */
export async function addLabelToDocument(
  documentId: string,
  labelId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Insert junction record (RLS ensures agency isolation)
    const { error } = await supabase
      .from('document_labels')
      .insert({
        document_id: documentId,
        label_id: labelId,
      });

    if (error) {
      // Handle duplicate (already has this label)
      if (error.code === '23505') {
        return { success: true }; // Silently succeed - already has label
      }
      console.error('Add label to document failed:', error);
      return { success: false, error: 'Failed to add label' };
    }

    // Revalidate documents page
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('Add label to document failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add label',
    };
  }
}

/**
 * Remove Label from Document Server Action
 *
 * Removes a label association from a document.
 * Does not delete the label from the agency pool.
 *
 * Implements AC-4.5.8
 */
export async function removeLabelFromDocument(
  documentId: string,
  labelId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Delete junction record (RLS ensures agency isolation)
    const { error } = await supabase
      .from('document_labels')
      .delete()
      .eq('document_id', documentId)
      .eq('label_id', labelId);

    if (error) {
      console.error('Remove label from document failed:', error);
      return { success: false, error: 'Failed to remove label' };
    }

    // Revalidate documents page
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('Remove label from document failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove label',
    };
  }
}

/**
 * Get Document Labels Server Action
 *
 * Fetches all labels associated with a specific document.
 *
 * Implements AC-4.5.7
 */
export async function getDocumentLabels(documentId: string): Promise<{
  success: boolean;
  labels?: Label[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Join through document_labels to get labels
    const { data, error } = await supabase
      .from('document_labels')
      .select('labels(*)')
      .eq('document_id', documentId);

    if (error) {
      console.error('Get document labels failed:', error);
      return { success: false, error: 'Failed to load document labels' };
    }

    // Extract labels from nested structure
    const labels = data
      ?.map((dl) => dl.labels)
      .filter((l): l is Label => l !== null) ?? [];

    return { success: true, labels };
  } catch (error) {
    console.error('Get document labels failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load document labels',
    };
  }
}

/**
 * Get Processing Job Error Message Server Action
 *
 * Story 5.13 (AC-5.13.1): Fetch the error message for a failed document.
 * Uses server-side client to bypass RLS restrictions on processing_jobs table.
 */
export async function getProcessingJobError(documentId: string): Promise<{
  success: boolean;
  errorMessage?: string | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // First verify user has access to this document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, agency_id')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return { success: false, error: 'Document not found' };
    }

    // Get the most recent processing job for this document
    // Note: Using server-side client which has elevated permissions
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('error_message, status, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Get processing job error failed:', error);
      return { success: false, error: 'Failed to fetch error details' };
    }

    const job = data?.[0];
    if (!job) {
      return { success: true, errorMessage: null };
    }

    return { success: true, errorMessage: job.error_message };
  } catch (error) {
    console.error('Get processing job error failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch error details',
    };
  }
}

/**
 * Get Documents with Labels Server Action
 *
 * Returns list of documents with their associated labels for the current user's agency.
 * Enhanced version of getDocuments that includes label data.
 */
export async function getDocumentsWithLabels(): Promise<{
  success: boolean;
  documents?: (Document & { labels: Label[] })[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get documents with their labels via junction table
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_labels(
          labels(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get documents with labels failed:', error);
      return { success: false, error: 'Failed to load documents' };
    }

    // Transform data to flatten labels
    const documents = (data ?? []).map((doc) => ({
      ...doc,
      labels: doc.document_labels
        ?.map((dl: { labels: Label | null }) => dl.labels)
        .filter((l: Label | null): l is Label => l !== null) ?? [],
      document_labels: undefined, // Remove nested structure
    }));

    return { success: true, documents };
  } catch (error) {
    console.error('Get documents with labels failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load documents',
    };
  }
}
