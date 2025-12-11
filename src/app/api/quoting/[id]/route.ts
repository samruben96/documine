/**
 * Single Quote Session API Route
 * Story Q2.3: Quote Session Detail Page
 *
 * GET /api/quoting/[id] - Get a single quote session by ID
 *
 * AC-Q2.3-6: Return 404 if session not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuoteSession } from '@/lib/quoting/service';

/**
 * Standard response helper
 */
function successResponse<T>(data: T): Response {
  return NextResponse.json({ data, error: null });
}

function errorResponse(message: string, code?: string, status = 400): Response {
  return NextResponse.json(
    { data: null, error: { message, code } },
    { status }
  );
}

/**
 * GET /api/quoting/[id]
 * Get a single quote session
 *
 * Response:
 * {
 *   data: QuoteSession,
 *   error: null
 * }
 *
 * AC-Q2.3-6: Returns 404 if session not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Quote session get unauthorized');
      return errorResponse('Authentication required', 'QUOTE_002', 401);
    }

    // Get session via service (RLS handles agency scoping)
    const session = await getQuoteSession(supabase, id);

    if (!session) {
      console.warn('Quote session not found', { sessionId: id, userId: user.id });
      return errorResponse('Quote session not found', 'QUOTE_007', 404);
    }

    console.info('Quote session retrieved', {
      userId: user.id,
      sessionId: session.id,
    });

    return successResponse(session);
  } catch (error) {
    console.error('Quote session get error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get quote session',
      'QUOTE_008',
      500
    );
  }
}
