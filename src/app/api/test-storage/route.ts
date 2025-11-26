import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getDocumentUrl } from '@/lib/utils/storage';

/**
 * Test endpoint to verify storage configuration and utilities.
 * GET /api/test-storage - Tests bucket config and signed URL generation
 *
 * Tests:
 * 1. Bucket exists with correct settings
 * 2. Signed URL generation works
 * 3. Storage policies are applied (via user context)
 */
export async function GET() {
  try {
    const serviceClient = createServiceClient();
    const userClient = await createClient();

    // Test 1: Verify bucket exists with correct configuration
    const { data: buckets, error: bucketError } = await serviceClient.storage.listBuckets();

    const documentsBucket = buckets?.find((b) => b.id === 'documents');
    const bucketConfig = documentsBucket
      ? {
          exists: true,
          public: documentsBucket.public,
          file_size_limit: documentsBucket.file_size_limit,
          allowed_mime_types: documentsBucket.allowed_mime_types,
        }
      : { exists: false };

    // Test 2: Test signed URL generation (using a test path)
    // Note: This will fail if no file exists, but tests the function works
    let signedUrlTest: { success: boolean; error?: string; urlGenerated?: boolean } = {
      success: false,
    };

    try {
      // Try to generate a signed URL for a non-existent test path
      // The function should work even if the file doesn't exist
      const testPath = 'test-agency/test-doc/test.pdf';
      const url = await getDocumentUrl(serviceClient, testPath);
      signedUrlTest = {
        success: true,
        urlGenerated: !!url,
      };
    } catch (error) {
      signedUrlTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Test 3: Check current auth state
    const {
      data: { user },
    } = await userClient.auth.getUser();

    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      tests: {
        bucketConfiguration: {
          description: 'Documents bucket configuration',
          ...bucketConfig,
          expected: {
            public: false,
            file_size_limit: 52428800,
            allowed_mime_types: ['application/pdf'],
          },
          error: bucketError?.message || null,
        },
        signedUrlGeneration: {
          description: 'Signed URL generation test',
          ...signedUrlTest,
        },
        storagePolicies: {
          description: 'Storage RLS policies (verify in Supabase dashboard)',
          expected: [
            'Upload to agency folder',
            'Read from agency folder',
            'Update in agency folder',
            'Delete from agency folder',
          ],
          note: 'Policies created via migration 00004_storage_bucket.sql',
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
