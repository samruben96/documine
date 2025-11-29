import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { ProcessingError } from '@/lib/errors';

/**
 * Document Upload Service
 *
 * Handles file uploads to Supabase Storage with agency-scoped paths.
 * Storage path structure: {agency_id}/{document_id}/{filename}
 */

export interface UploadResult {
  storagePath: string;
  size: number;
}

/**
 * Sanitize a filename to prevent path traversal and other security issues.
 *
 * - Removes path traversal sequences (.., /, \)
 * - Trims whitespace
 * - Replaces problematic characters with underscores
 * - Ensures a fallback filename if result is empty
 *
 * @param filename - Original filename from file upload
 * @returns Sanitized filename safe for storage paths
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal sequences and directory separators
  let sanitized = filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/[/\\]/g, '') // Remove / and \
    .trim();

  // Replace other potentially problematic characters with underscores
  // Keep alphanumeric, dots, hyphens, underscores, and spaces
  sanitized = sanitized.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');

  // Ensure filename isn't empty or just dots/spaces
  if (!sanitized || /^[.\s]+$/.test(sanitized)) {
    sanitized = 'document.pdf';
  }

  return sanitized;
}

/**
 * Upload a document file to Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param file - File to upload
 * @param agencyId - Agency ID for path scoping (RLS enforcement)
 * @param documentId - Pre-generated document UUID
 * @returns Upload result with storage path
 * @throws ProcessingError if upload fails
 *
 * Implements AC-4.1.7: Storage path structure {agency_id}/{document_id}/{filename}
 */
export async function uploadDocumentToStorage(
  supabase: SupabaseClient<Database>,
  file: File,
  agencyId: string,
  documentId: string
): Promise<UploadResult> {
  // Sanitize filename to prevent path traversal attacks
  const safeFilename = sanitizeFilename(file.name);

  // Construct storage path per AC-4.1.7
  const storagePath = `${agencyId}/${documentId}/${safeFilename}`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false, // Prevent accidental overwrites
    });

  if (error) {
    console.error('Storage upload failed:', {
      documentId,
      agencyId,
      originalFilename: file.name,
      sanitizedFilename: safeFilename,
      error: error.message,
    });
    throw new ProcessingError(`Failed to upload file: ${error.message}`);
  }

  return {
    storagePath,
    size: file.size,
  };
}

/**
 * Delete a document from Supabase Storage
 *
 * @param supabase - Supabase client instance
 * @param storagePath - Full storage path to delete
 * @returns true if deletion succeeded
 */
export async function deleteDocumentFromStorage(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from('documents')
    .remove([storagePath]);

  if (error) {
    // Log but don't throw - orphaned files are acceptable per tech spec
    console.error('Storage deletion failed:', {
      storagePath,
      error: error.message,
    });
    return false;
  }

  return true;
}

/**
 * Generate a signed URL for document viewing
 *
 * @param supabase - Supabase client instance
 * @param storagePath - Full storage path
 * @param expiresIn - Expiration time in seconds (default 1 hour)
 * @returns Signed URL for document access
 */
export async function getDocumentSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Failed to create signed URL:', {
      storagePath,
      error: error.message,
    });
    return null;
  }

  return data.signedUrl;
}
