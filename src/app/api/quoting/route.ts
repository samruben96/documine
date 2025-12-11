/**
 * Quote Sessions API Route
 * Story Q2.1: Quote Sessions List Page
 *
 * GET /api/quoting - List user's quote sessions
 *
 * AC-Q2.1-1: Sessions sorted by most recently updated first
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { listQuoteSessions } from '@/lib/quoting/service';
import type { QuoteSessionStatus } from '@/types/quoting';

/**
 * Query parameters schema for GET
 */
const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const statuses = val.split(',');
      return statuses as QuoteSessionStatus[];
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

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
 * GET /api/quoting
 * List user's quote sessions
 *
 * Query params:
 * - search: Search by prospect name (optional)
 * - status: Filter by status (comma-separated, optional)
 * - limit: Max number of results (optional)
 *
 * Response:
 * {
 *   data: QuoteSession[],
 *   error: null
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    const parseResult = listQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      console.warn('Quote sessions list validation failed', {
        issues: parseResult.error.issues,
      });
      return errorResponse(
        'Invalid query parameters: ' + parseResult.error.issues[0]?.message,
        'QUOTE_001'
      );
    }

    const { search, status, limit } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Quote sessions list unauthorized');
      return errorResponse('Authentication required', 'QUOTE_002', 401);
    }

    // List sessions via service (RLS handles agency scoping)
    const sessions = await listQuoteSessions(supabase, {
      search,
      status,
      limit,
    });

    console.info('Quote sessions listed', {
      userId: user.id,
      count: sessions.length,
      filters: { search, status, limit },
    });

    return successResponse(sessions);
  } catch (error) {
    console.error('Quote sessions list error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to list quote sessions',
      'QUOTE_003',
      500
    );
  }
}
