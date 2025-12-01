import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert } from '@/types/database.types';
import { DocumentNotFoundError, ProcessingError } from '@/lib/errors';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Document Database Service
 *
 * Handles CRUD operations for document records and processing jobs.
 * All operations respect RLS policies scoped to agency_id.
 */

export type Document = Tables<'documents'>;
export type DocumentInsert = TablesInsert<'documents'>;
export type ProcessingJob = Tables<'processing_jobs'>;

export interface CreateDocumentInput {
  id: string;
  agencyId: string;
  uploadedBy: string;
  filename: string;
  storagePath: string;
}

/**
 * Create a new document record with processing status
 *
 * Implements AC-4.1.8: Document record created with status='processing'
 *
 * @param supabase - Supabase client instance
 * @param input - Document creation data
 * @returns Created document record
 */
export async function createDocumentRecord(
  supabase: SupabaseClient<Database>,
  input: CreateDocumentInput
): Promise<Document> {
  const { id, agencyId, uploadedBy, filename, storagePath } = input;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      id,
      agency_id: agencyId,
      uploaded_by: uploadedBy,
      filename,
      storage_path: storagePath,
      status: 'processing',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create document record:', {
      documentId: id,
      agencyId,
      error: error.message,
    });
    throw new ProcessingError(`Failed to create document record: ${error.message}`);
  }

  return data;
}

/**
 * Create a processing job for a document and trigger the Edge Function
 *
 * Uses service role client internally because processing_jobs table has RLS
 * policies that only allow service_role access. This is by design - processing
 * jobs are meant to be managed by the system (Edge Functions), not directly
 * by users.
 *
 * After creating the job, invokes the Edge Function to start processing.
 *
 * @param documentId - Document ID to process
 * @returns Created processing job record
 */
export async function createProcessingJob(
  documentId: string
): Promise<ProcessingJob> {
  // Use service client to bypass RLS - processing_jobs requires service_role
  const serviceClient = createServiceClient();

  // First, get the document details needed for Edge Function invocation
  const { data: document, error: docError } = await serviceClient
    .from('documents')
    .select('storage_path, agency_id')
    .eq('id', documentId)
    .single();

  if (docError || !document) {
    console.error('Failed to get document for processing job:', {
      documentId,
      error: docError?.message,
    });
    throw new ProcessingError(`Failed to get document: ${docError?.message || 'Not found'}`);
  }

  const { data, error } = await serviceClient
    .from('processing_jobs')
    .insert({
      document_id: documentId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create processing job:', {
      documentId,
      error: error.message,
    });
    throw new ProcessingError(`Failed to create processing job: ${error.message}`);
  }

  // Trigger the Edge Function to start processing (fire-and-forget)
  triggerEdgeFunction(documentId, document.storage_path, document.agency_id).catch((err) => {
    console.error('Failed to trigger Edge Function (will be processed on next poll):', {
      documentId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return data;
}

/**
 * Trigger the process-document Edge Function
 *
 * This is a fire-and-forget call - errors are logged but not thrown.
 * The Edge Function implements its own retry logic and queue management.
 */
async function triggerEdgeFunction(
  documentId: string,
  storagePath: string,
  agencyId: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration for Edge Function invocation');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      documentId,
      storagePath,
      agencyId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge Function returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('Edge Function triggered successfully:', {
    documentId,
    result,
  });
}

/**
 * Get a document by ID
 *
 * @param supabase - Supabase client instance
 * @param documentId - Document ID to fetch
 * @returns Document record
 * @throws DocumentNotFoundError if document doesn't exist or user lacks access
 */
export async function getDocument(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !data) {
    throw new DocumentNotFoundError(documentId);
  }

  return data;
}

/**
 * List all documents for the current user's agency
 *
 * @param supabase - Supabase client instance
 * @param options - Query options
 * @returns List of document records sorted by created_at DESC
 */
export async function listDocuments(
  supabase: SupabaseClient<Database>,
  options?: {
    search?: string;
    status?: string;
    limit?: number;
  }
): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.ilike('filename', `%${options.search}%`);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list documents:', { error: error.message });
    return [];
  }

  return data ?? [];
}

/**
 * Update document status
 *
 * @param supabase - Supabase client instance
 * @param documentId - Document ID to update
 * @param status - New status value
 * @param pageCount - Optional page count (set when processing completes)
 */
export async function updateDocumentStatus(
  supabase: SupabaseClient<Database>,
  documentId: string,
  status: 'processing' | 'ready' | 'failed',
  pageCount?: number
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (pageCount !== undefined) {
    updateData.page_count = pageCount;
  }

  const { error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId);

  if (error) {
    console.error('Failed to update document status:', {
      documentId,
      status,
      error: error.message,
    });
    throw new ProcessingError(`Failed to update document status: ${error.message}`);
  }
}

/**
 * Delete a document and its related records
 *
 * Cascades to document_chunks, conversations, chat_messages via FK constraints.
 *
 * @param supabase - Supabase client instance
 * @param documentId - Document ID to delete
 * @returns Storage path of deleted document (for storage cleanup)
 */
export async function deleteDocument(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<string> {
  // First get the storage path for cleanup
  const document = await getDocument(supabase, documentId);

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Failed to delete document:', {
      documentId,
      error: error.message,
    });
    throw new ProcessingError(`Failed to delete document: ${error.message}`);
  }

  return document.storage_path;
}

/**
 * Get processing job status for a document
 *
 * @param supabase - Supabase client instance
 * @param documentId - Document ID
 * @returns Latest processing job or null
 */
export async function getProcessingJobStatus(
  supabase: SupabaseClient<Database>,
  documentId: string
): Promise<ProcessingJob | null> {
  const { data, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
