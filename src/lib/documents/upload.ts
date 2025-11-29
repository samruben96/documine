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

export interface UploadOptions {
  /** Progress callback receiving percentage (0-100) */
  onProgress?: (percent: number) => void;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
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
 * @param options - Optional progress callback and abort signal
 * @returns Upload result with storage path
 * @throws ProcessingError if upload fails
 *
 * Implements AC-4.1.7: Storage path structure {agency_id}/{document_id}/{filename}
 * Implements AC-4.2.1: Progress callback for real-time upload progress
 */
export async function uploadDocumentToStorage(
  supabase: SupabaseClient<Database>,
  file: File,
  agencyId: string,
  documentId: string,
  options?: UploadOptions
): Promise<UploadResult> {
  // Sanitize filename to prevent path traversal attacks
  const safeFilename = sanitizeFilename(file.name);

  // Construct storage path per AC-4.1.7
  const storagePath = `${agencyId}/${documentId}/${safeFilename}`;

  // Check if already aborted before starting
  if (options?.signal?.aborted) {
    throw new ProcessingError('Upload cancelled');
  }

  // If progress callback provided, use XMLHttpRequest for real-time progress
  // Otherwise use standard Supabase upload
  if (options?.onProgress) {
    await uploadWithProgress(supabase, file, storagePath, options);
  } else {
    const { error } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
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
  }

  return {
    storagePath,
    size: file.size,
  };
}

/**
 * Upload file with XMLHttpRequest for progress tracking
 * Uses Supabase Storage REST API directly
 *
 * Implements AC-4.2.1: Real-time progress updates
 */
async function uploadWithProgress(
  supabase: SupabaseClient<Database>,
  file: File,
  storagePath: string,
  options: UploadOptions
): Promise<void> {
  // Get auth token for API request
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new ProcessingError('Not authenticated');
  }

  // Construct the storage API URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/documents/${storagePath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new ProcessingError('Upload cancelled'));
      });
    }

    // Track upload progress (AC-4.2.1)
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let errorMessage = 'Upload failed';
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || response.error || errorMessage;
        } catch {
          // Use default error message
        }
        console.error('Storage upload failed:', {
          storagePath,
          status: xhr.status,
          error: errorMessage,
        });
        reject(new ProcessingError(`Failed to upload file: ${errorMessage}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ProcessingError('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new ProcessingError('Upload cancelled'));
    });

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('Cache-Control', '3600');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.send(file);
  });
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
