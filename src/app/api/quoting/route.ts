/**
 * Quote Sessions API Route
 * Story Q2.1: Quote Sessions List Page
 * Story Q2.2: Create New Quote Session
 *
 * GET /api/quoting - List user's quote sessions
 * POST /api/quoting - Create a new quote session
 *
 * AC-Q2.1-1: Sessions sorted by most recently updated first
 * AC-Q2.2-3: POST creates session and returns for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { listQuoteSessions, createQuoteSession } from '@/lib/quoting/service';
import type { QuoteSessionStatus, QuoteType } from '@/types/quoting';

/**
 * Request body schema for POST
 * AC-Q2.2-4: Prospect name required, minimum 2 characters
 */
const createSessionSchema = z.object({
  prospectName: z
    .string()
    .min(1, 'Prospect name is required')
    .min(2, 'Prospect name must be at least 2 characters'),
  quoteType: z.enum(['home', 'auto', 'bundle'] as const),
});

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

/**
 * POST /api/quoting
 * Create a new quote session
 * Story Q2.2: Create New Quote Session
 *
 * Request body:
 * {
 *   prospectName: string (required, min 2 chars)
 *   quoteType: 'home' | 'auto' | 'bundle'
 * }
 *
 * Response:
 * {
 *   data: QuoteSession,
 *   error: null
 * }
 *
 * AC-Q2.2-3: Creates session and returns for redirect
 * AC-Q2.2-4: Validates prospect name
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = createSessionSchema.safeParse(body);

    if (!parseResult.success) {
      console.warn('Quote session create validation failed', {
        issues: parseResult.error.issues,
      });
      return errorResponse(
        parseResult.error.issues[0]?.message ?? 'Invalid request body',
        'QUOTE_004'
      );
    }

    const { prospectName, quoteType } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Quote session create unauthorized');
      return errorResponse('Authentication required', 'QUOTE_002', 401);
    }

    // Get user's agency_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      console.error('Failed to get user agency', { error: userError?.message });
      return errorResponse('User agency not found', 'QUOTE_005', 400);
    }

    // Create session via service
    const session = await createQuoteSession(supabase, user.id, userData.agency_id, {
      prospectName,
      quoteType,
    });

    console.info('Quote session created', {
      userId: user.id,
      sessionId: session.id,
      prospectName,
      quoteType,
    });

    return successResponse(session);
  } catch (error) {
    console.error('Quote session create error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create quote session',
      'QUOTE_006',
      500
    );
  }
}
