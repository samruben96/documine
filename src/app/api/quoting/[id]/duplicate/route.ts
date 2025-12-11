/**
 * Duplicate Quote Session API Route
 * Story Q2.5: Delete and Duplicate Quote Sessions
 *
 * POST /api/quoting/[id]/duplicate - Duplicate an existing quote session
 *
 * AC-Q2.5-4: Creates copy with "(Copy)" suffix, same quote_type, copied client_data,
 *            no quote_results, status "draft"
 * AC-Q2.5-5: Returns new session for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { duplicateQuoteSession } from '@/lib/quoting/service';

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
 * POST /api/quoting/[id]/duplicate
 * Duplicate a quote session
 *
 * Response:
 * {
 *   data: QuoteSession, // New duplicated session
 *   error: null
 * }
 *
 * AC-Q2.5-4: New session has "(Copy)" suffix, same quote_type, copied client_data
 * AC-Q2.5-5: Returns new session with ID for redirect
 */
export async function POST(
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
      console.warn('Quote session duplicate unauthorized');
      return errorResponse('Authentication required', 'QUOTE_002', 401);
    }

    // Get user's agency_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      console.error('Failed to get user agency for duplicate', { userId: user.id, error: userError?.message });
      return errorResponse('User agency not found', 'QUOTE_005', 400);
    }

    // Duplicate session via service
    const newSession = await duplicateQuoteSession(
      supabase,
      id,
      user.id,
      userData.agency_id
    );

    if (!newSession) {
      console.warn('Quote session not found for duplication', { sessionId: id, userId: user.id });
      return errorResponse('Quote session not found', 'QUOTE_007', 404);
    }

    console.info('Quote session duplicated', {
      userId: user.id,
      originalSessionId: id,
      newSessionId: newSession.id,
    });

    return successResponse(newSession);
  } catch (error) {
    console.error('Quote session duplicate error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to duplicate quote session',
      'QUOTE_010',
      500
    );
  }
}
