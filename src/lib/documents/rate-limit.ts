/**
 * Rate Limiting Service
 *
 * Manages upload rate limits per agency based on subscription tier.
 * Prevents system overload and ensures fair resource usage.
 *
 * Implements AC-4.7.7: Rate Limiting
 *
 * @module @/lib/documents/rate-limit
 */

import { createServiceClient } from '@/lib/supabase/server';

/**
 * Rate limit configuration per subscription tier.
 * Limits are defined as uploads per time window (hour).
 */
interface TierLimits {
  uploadsPerHour: number;
  maxConcurrentProcessing: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    uploadsPerHour: 10,
    maxConcurrentProcessing: 1,
  },
  starter: {
    uploadsPerHour: 50,
    maxConcurrentProcessing: 3,
  },
  pro: {
    uploadsPerHour: 200,
    maxConcurrentProcessing: 5,
  },
  enterprise: {
    uploadsPerHour: 1000,
    maxConcurrentProcessing: 10,
  },
};

/** Default limits for unknown tiers */
const DEFAULT_LIMITS: TierLimits = {
  uploadsPerHour: 10,
  maxConcurrentProcessing: 1,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSeconds: number;
  tier: string;
  reason?: string;
}

/**
 * Check if an agency is allowed to upload based on rate limits.
 *
 * Counts uploads in the past hour and compares against tier limit.
 *
 * @param agencyId - Agency ID to check
 * @returns Rate limit result with remaining quota
 */
export async function checkUploadRateLimit(
  agencyId: string
): Promise<RateLimitResult> {
  const serviceClient = createServiceClient();

  // Get agency subscription tier
  const { data: agency, error: agencyError } = await serviceClient
    .from('agencies')
    .select('subscription_tier')
    .eq('id', agencyId)
    .single();

  if (agencyError || !agency) {
    console.error('Failed to get agency tier:', { agencyId, error: agencyError?.message });
    // Fail open with default limits
    return {
      allowed: true,
      remaining: DEFAULT_LIMITS.uploadsPerHour,
      limit: DEFAULT_LIMITS.uploadsPerHour,
      resetInSeconds: 3600,
      tier: 'unknown',
    };
  }

  const tier = agency.subscription_tier || 'free';
  const limits = TIER_LIMITS[tier] || DEFAULT_LIMITS;

  // Count uploads in the past hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await serviceClient
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gte('created_at', oneHourAgo);

  if (countError) {
    console.error('Failed to count uploads:', { agencyId, error: countError.message });
    // Fail open - allow upload
    return {
      allowed: true,
      remaining: limits.uploadsPerHour,
      limit: limits.uploadsPerHour,
      resetInSeconds: 3600,
      tier,
    };
  }

  const uploadsThisHour = count ?? 0;
  const remaining = Math.max(0, limits.uploadsPerHour - uploadsThisHour);
  const allowed = remaining > 0;

  // Calculate reset time (seconds until next hour boundary)
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  const resetInSeconds = Math.ceil((nextHour.getTime() - now.getTime()) / 1000);

  return {
    allowed,
    remaining,
    limit: limits.uploadsPerHour,
    resetInSeconds,
    tier,
    reason: allowed ? undefined : `Rate limit exceeded. ${tier} tier allows ${limits.uploadsPerHour} uploads per hour.`,
  };
}

/**
 * Check if an agency can start processing a new document.
 *
 * Limits concurrent processing jobs per tier to prevent system overload.
 *
 * @param agencyId - Agency ID to check
 * @returns Whether processing is allowed
 */
export async function checkProcessingRateLimit(
  agencyId: string
): Promise<{
  allowed: boolean;
  currentProcessing: number;
  maxConcurrent: number;
  tier: string;
}> {
  const serviceClient = createServiceClient();

  // Get agency subscription tier
  const { data: agency, error: agencyError } = await serviceClient
    .from('agencies')
    .select('subscription_tier')
    .eq('id', agencyId)
    .single();

  const tier = agency?.subscription_tier || 'free';
  const limits = TIER_LIMITS[tier] || DEFAULT_LIMITS;

  if (agencyError) {
    console.error('Failed to get agency tier:', { agencyId, error: agencyError.message });
    // Fail safe - limit to 1
    return {
      allowed: true,
      currentProcessing: 0,
      maxConcurrent: 1,
      tier: 'unknown',
    };
  }

  // Count currently processing jobs
  const { count, error: countError } = await serviceClient
    .from('processing_jobs')
    .select('id, documents!inner(agency_id)', { count: 'exact', head: true })
    .eq('status', 'processing')
    .eq('documents.agency_id', agencyId);

  if (countError) {
    console.error('Failed to count processing jobs:', { agencyId, error: countError.message });
    return {
      allowed: true,
      currentProcessing: 0,
      maxConcurrent: limits.maxConcurrentProcessing,
      tier,
    };
  }

  const currentProcessing = count ?? 0;
  const allowed = currentProcessing < limits.maxConcurrentProcessing;

  return {
    allowed,
    currentProcessing,
    maxConcurrent: limits.maxConcurrentProcessing,
    tier,
  };
}

/**
 * Get rate limit info for an agency (for display purposes).
 *
 * @param agencyId - Agency ID
 * @returns Current rate limit status
 */
export async function getRateLimitInfo(agencyId: string): Promise<{
  tier: string;
  uploadsPerHour: number;
  uploadsThisHour: number;
  remaining: number;
  maxConcurrentProcessing: number;
  currentProcessing: number;
}> {
  const serviceClient = createServiceClient();

  // Get agency tier
  const { data: agency } = await serviceClient
    .from('agencies')
    .select('subscription_tier')
    .eq('id', agencyId)
    .single();

  const tier = agency?.subscription_tier || 'free';
  const limits = TIER_LIMITS[tier] || DEFAULT_LIMITS;

  // Count uploads this hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: uploadCount } = await serviceClient
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gte('created_at', oneHourAgo);

  // Count currently processing
  const { count: processingCount } = await serviceClient
    .from('processing_jobs')
    .select('id, documents!inner(agency_id)', { count: 'exact', head: true })
    .eq('status', 'processing')
    .eq('documents.agency_id', agencyId);

  const uploadsThisHour = uploadCount ?? 0;
  const currentProcessing = processingCount ?? 0;

  return {
    tier,
    uploadsPerHour: limits.uploadsPerHour,
    uploadsThisHour,
    remaining: Math.max(0, limits.uploadsPerHour - uploadsThisHour),
    maxConcurrentProcessing: limits.maxConcurrentProcessing,
    currentProcessing,
  };
}

/**
 * Get tier limits configuration.
 *
 * @param tier - Subscription tier name
 * @returns Tier limits
 */
export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || DEFAULT_LIMITS;
}
