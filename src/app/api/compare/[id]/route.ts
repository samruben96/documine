import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import type { ComparisonData } from '@/types/compare';

/**
 * Comparison GET API Endpoint
 *
 * Story 7.2: Fetch comparison by ID for polling status during extraction.
 * Returns comparison data including extraction status and results.
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: comparisonId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user's agency
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return NextResponse.json(
        { error: { code: 'NO_AGENCY', message: 'User not associated with an agency' } },
        { status: 403 }
      );
    }

    const agencyId = userData.agency_id;

    // Fetch comparison (RLS ensures agency scope)
    const { data: comparison, error: fetchError } = await supabase
      .from('comparisons')
      .select('*')
      .eq('id', comparisonId)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (fetchError) {
      log.warn('Failed to fetch comparison', {
        comparisonId,
        error: fetchError.message,
      });
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch comparison' } },
        { status: 500 }
      );
    }

    if (!comparison) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Comparison not found' } },
        { status: 404 }
      );
    }

    const comparisonData = comparison.comparison_data as unknown as ComparisonData;

    return NextResponse.json({
      comparisonId: comparison.id,
      status: comparisonData.status,
      documents: comparisonData.documents,
      extractions: comparisonData.extractions,
      createdAt: comparisonData.createdAt,
      completedAt: comparisonData.completedAt,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Comparison GET error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
