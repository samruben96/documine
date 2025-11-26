import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * Test endpoint to verify RLS policies work correctly.
 * GET /api/test-rls - Tests both user-scoped and service role queries
 *
 * Expected behavior:
 * - Unauthenticated: userClient returns empty array (RLS blocks access)
 * - Authenticated: userClient returns only user's agency data
 * - Service role: serviceClient returns all data (bypasses RLS)
 */
export async function GET() {
  try {
    // Test 1: User-scoped client (respects RLS)
    const userClient = await createClient();
    const { data: userData, error: userError } = await userClient
      .from('agencies')
      .select('id, name')
      .limit(5);

    // Test 2: Service role client (bypasses RLS)
    const serviceClient = createServiceClient();
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('agencies')
      .select('id, name')
      .limit(5);

    // Get current auth state
    const {
      data: { user },
    } = await userClient.auth.getUser();

    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      tests: {
        userScopedQuery: {
          description: 'Query with anon key (respects RLS)',
          rowCount: userData?.length ?? 0,
          error: userError?.message || null,
          data: userData,
        },
        serviceRoleQuery: {
          description: 'Query with service role key (bypasses RLS)',
          rowCount: serviceData?.length ?? 0,
          error: serviceError?.message || null,
          data: serviceData,
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
