/**
 * Mock Supabase client for testing.
 *
 * Usage:
 * ```ts
 * import { createMockSupabaseClient, mockStorageFrom } from '@/__tests__/mocks/supabase';
 *
 * const mockSupabase = createMockSupabaseClient();
 *
 * // Configure storage mock behavior
 * mockStorageFrom.mockReturnValue({
 *   upload: vi.fn().mockResolvedValue({ error: null }),
 *   createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://...' }, error: null }),
 *   remove: vi.fn().mockResolvedValue({ error: null }),
 * });
 *
 * // Use in tests
 * await uploadDocument(mockSupabase, file, agencyId, documentId);
 * ```
 */
import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Mock storage bucket methods.
 * Configure return values per test as needed.
 */
export const mockStorageUpload = vi.fn();
export const mockStorageCreateSignedUrl = vi.fn();
export const mockStorageRemove = vi.fn();

/**
 * Mock storage.from() that returns configured mock methods.
 */
export const mockStorageFrom = vi.fn(() => ({
  upload: mockStorageUpload,
  createSignedUrl: mockStorageCreateSignedUrl,
  remove: mockStorageRemove,
}));

/**
 * Creates a mock Supabase client with configurable storage methods.
 *
 * @returns Mock Supabase client typed as TypedSupabaseClient
 *
 * @example
 * ```ts
 * const mockSupabase = createMockSupabaseClient();
 *
 * // Configure for successful upload
 * mockStorageUpload.mockResolvedValue({ error: null });
 *
 * // Configure for upload error
 * mockStorageUpload.mockResolvedValue({ error: { message: 'Upload failed' } });
 * ```
 */
export function createMockSupabaseClient(): TypedSupabaseClient {
  return {
    storage: {
      from: mockStorageFrom,
    },
  } as unknown as TypedSupabaseClient;
}

/**
 * Resets all mock functions to their initial state.
 * Call this in beforeEach or afterEach to ensure clean state between tests.
 */
export function resetMocks(): void {
  mockStorageUpload.mockReset();
  mockStorageCreateSignedUrl.mockReset();
  mockStorageRemove.mockReset();
  mockStorageFrom.mockReset();

  // Re-apply default implementation for from()
  mockStorageFrom.mockImplementation(() => ({
    upload: mockStorageUpload,
    createSignedUrl: mockStorageCreateSignedUrl,
    remove: mockStorageRemove,
  }));
}

/**
 * Helper to create a mock File for testing uploads.
 *
 * @param name - File name
 * @param content - File content (default: empty string)
 * @param type - MIME type (default: 'application/pdf')
 * @returns Mock File instance
 */
export function createMockFile(
  name: string,
  content = '',
  type = 'application/pdf'
): File {
  return new File([content], name, { type });
}
