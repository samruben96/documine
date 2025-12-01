/**
 * Admin API Route: Stale Jobs Management
 *
 * GET /api/admin/stale-jobs - List currently stale jobs
 * POST /api/admin/stale-jobs - Mark stale jobs as failed
 *
 * Implements AC-4.7.5: Stale Job Detection (on-demand check)
 *
 * Security: Requires authenticated user with 'admin' role.
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import {
  markStaleJobsAsFailed,
  getStaleJobs,
  getStaleConfig,
} from '@/lib/documents/stale-detection';

/**
 * GET /api/admin/stale-jobs
 *
 * Returns list of currently stale jobs (processing > 10 minutes)
 * Requires admin authentication.
 */
export async function GET(): Promise<NextResponse> {
  // Verify admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { jobs, error } = await getStaleJobs();
    const config = getStaleConfig();

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
      staleJobs: jobs,
      count: jobs.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/stale-jobs
 *
 * Marks all stale jobs as failed.
 * Requires admin authentication.
 */
export async function POST(): Promise<NextResponse> {
  // Verify admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const result = await markStaleJobsAsFailed();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      markedFailed: result.markedFailed,
      message:
        result.markedFailed > 0
          ? `Marked ${result.markedFailed} stale job(s) as failed`
          : 'No stale jobs found',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
