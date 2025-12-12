/**
 * Quote Session Client Data API Route
 * Story Q3.1: Data Capture Forms
 *
 * PATCH /api/quoting/[id]/client-data - Update client data (partial merge)
 *
 * AC-Q3.1 (all): Wire up data persistence with partial update merging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateQuoteSessionClientData } from '@/lib/quoting/service';
import type { QuoteClientData } from '@/types/quoting';

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
 * PATCH /api/quoting/[id]/client-data
 * Update client data with partial merge
 *
 * Request body: Partial<QuoteClientData>
 * {
 *   personal?: { firstName?: string, ... },
 *   property?: { yearBuilt?: number, ... },
 *   auto?: { vehicles?: Vehicle[], drivers?: Driver[], coverage?: AutoCoverage }
 * }
 *
 * Response:
 * {
 *   data: { updatedAt: string },
 *   error: null
 * }
 */
export async function PATCH(
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
      console.warn('Quote client data update unauthorized');
      return errorResponse('Authentication required', 'QUOTE_002', 401);
    }

    // Parse request body
    let clientDataPatch: Partial<QuoteClientData>;
    try {
      clientDataPatch = await request.json();
    } catch {
      return errorResponse('Invalid request body', 'QUOTE_010', 400);
    }

    // Validate body is an object
    if (!clientDataPatch || typeof clientDataPatch !== 'object' || Array.isArray(clientDataPatch)) {
      return errorResponse('Request body must be an object', 'QUOTE_010', 400);
    }

    // Update via service (RLS handles authorization)
    const updated = await updateQuoteSessionClientData(supabase, id, clientDataPatch);

    if (!updated) {
      console.warn('Quote session not found for client data update', { sessionId: id, userId: user.id });
      return errorResponse('Quote session not found', 'QUOTE_007', 404);
    }

    console.info('Quote session client data updated', {
      userId: user.id,
      sessionId: id,
      sections: Object.keys(clientDataPatch),
    });

    return successResponse({ updatedAt: updated.updatedAt });
  } catch (error) {
    console.error('Quote client data update error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update client data',
      'QUOTE_011',
      500
    );
  }
}
