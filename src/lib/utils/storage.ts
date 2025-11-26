import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const BUCKET_NAME = 'documents';
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Uploads a document to Supabase Storage.
 * Path structure: {agencyId}/{documentId}/{filename}
 *
 * @param supabase - Supabase client instance
 * @param file - File to upload
 * @param agencyId - Agency UUID for path scoping
 * @param documentId - Document UUID for path scoping
 * @returns Full storage path on success
 * @throws Error if upload fails
 */
export async function uploadDocument(
  supabase: TypedSupabaseClient,
  file: File,
  agencyId: string,
  documentId: string
): Promise<string> {
  const storagePath = `${agencyId}/${documentId}/${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file);

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  return storagePath;
}

/**
 * Generates a signed URL for secure document access.
 * URLs expire after 1 hour (3600 seconds).
 *
 * @param supabase - Supabase client instance
 * @param storagePath - Full storage path (e.g., "{agencyId}/{documentId}/{filename}")
 * @returns Signed URL string
 * @throws Error if URL generation fails
 */
export async function getDocumentUrl(
  supabase: TypedSupabaseClient,
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a document from Supabase Storage.
 *
 * @param supabase - Supabase client instance
 * @param storagePath - Full storage path (e.g., "{agencyId}/{documentId}/{filename}")
 * @throws Error if deletion fails
 */
export async function deleteDocument(
  supabase: TypedSupabaseClient,
  storagePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
