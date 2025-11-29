'use server';

import { createClient } from '@/lib/supabase/server';
import { uploadDocumentToStorage, deleteDocumentFromStorage } from '@/lib/documents/upload';
import {
  createDocumentRecord,
  createProcessingJob,
  deleteDocument as deleteDocumentService,
  updateDocumentStatus,
} from '@/lib/documents/service';
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
 * 5. Upload to Supabase Storage
 * 6. Create document record (status: 'processing')
 * 7. Create processing job
 * 8. Revalidate and return document
 *
 * Implements AC-4.1.4, AC-4.1.5, AC-4.1.7, AC-4.1.8
 */
export async function uploadDocument(formData: FormData): Promise<{
  success: boolean;
  document?: Document;
  error?: string;
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
    const documentId = crypto.randomUUID();

    // 5. Upload file to Supabase Storage (AC-4.1.7)
    const uploadResult = await uploadDocumentToStorage(
      supabase,
      file,
      agencyId,
      documentId
    );

    // 6. Create document record with status='processing' (AC-4.1.8)
    const document = await createDocumentRecord(supabase, {
      id: documentId,
      agencyId,
      uploadedBy: user.id,
      filename: file.name,
      storagePath: uploadResult.storagePath,
    });

    // 7. Create processing job to trigger Edge Function
    await createProcessingJob(supabase, documentId);

    // 8. Revalidate documents page
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
    await createProcessingJob(supabase, input.documentId);

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
 *
 * Implements AC-4.2.7
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

    // Update document status back to processing
    await updateDocumentStatus(supabase, documentId, 'processing');

    // Create new processing job
    await createProcessingJob(supabase, documentId);

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
