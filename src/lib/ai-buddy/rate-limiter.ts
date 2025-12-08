/**
 * AI Buddy Rate Limiter
 * Story 15.3: Streaming Chat API (AC-15.3.6)
 *
 * Rate limit checking for AI Buddy API routes.
 * Uses ai_buddy_rate_limits table for tier-based limits.
 * Tracks usage in memory with sliding window algorithm.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { RateLimit } from '@/types/ai-buddy';
import type { Database } from '@/types/database.types';

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  tier: string;
}

/**
 * Default rate limits by tier (from Story 14.1 seed data)
 * These are fallbacks if database lookup fails
 */
export const AI_BUDDY_RATE_LIMITS = {
  free: { tier: 'free', messagesPerMinute: 10, messagesPerDay: 100 },
  pro: { tier: 'pro', messagesPerMinute: 20, messagesPerDay: 500 },
  enterprise: { tier: 'enterprise', messagesPerMinute: 60, messagesPerDay: 2000 },
} as const satisfies Record<string, RateLimit>;

// Default rate limit for unknown tiers
const DEFAULT_RATE_LIMIT: RateLimit = AI_BUDDY_RATE_LIMITS.free;

// In-memory rate limit tracking (per user)
// For production, consider using Redis or database-backed tracking
const rateLimitCache = new Map<string, { count: number; windowStart: Date }>();

/**
 * Check rate limit for a user (AC-15.3.6)
 *
 * Default: 20 messages per minute
 * Uses tier-based limits from database when available
 *
 * @param userId - User ID to check
 * @param agencyId - Agency ID for tier lookup
 * @param supabase - Supabase client instance
 * @returns Rate limit check result
 */
export async function checkAiBuddyRateLimit(
  userId: string,
  agencyId: string,
  supabase: SupabaseClient<Database>
): Promise<RateLimitCheck> {
  // Get rate limits for agency's tier
  const limits = await getRateLimitsFromDb(agencyId, supabase);

  const windowMs = 60 * 1000; // 1 minute window
  const now = new Date();
  const cacheKey = `ai_buddy:${userId}`;

  // Get or create rate limit entry
  let entry = rateLimitCache.get(cacheKey);

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    // Window expired or new user, reset
    entry = { count: 0, windowStart: now };
    rateLimitCache.set(cacheKey, entry);
  }

  // Check if limit exceeded
  const allowed = entry.count < limits.messagesPerMinute;
  const remaining = Math.max(0, limits.messagesPerMinute - entry.count - 1);
  const resetAt = new Date(entry.windowStart.getTime() + windowMs);

  // Increment count if allowed
  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    remaining,
    resetAt,
    limit: limits.messagesPerMinute,
    tier: limits.tier,
  };
}

/**
 * Get rate limits from database for an agency
 *
 * Looks up agency's subscription tier, then gets limits for that tier.
 * Falls back to default limits if lookup fails.
 */
async function getRateLimitsFromDb(
  agencyId: string,
  supabase: SupabaseClient<Database>
): Promise<RateLimit> {
  try {
    // Get agency's subscription tier
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('subscription_tier')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return DEFAULT_RATE_LIMIT;
    }

    const tier = agency.subscription_tier || 'free';

    // Try to get limits from database
    const { data: dbLimits, error: limitsError } = await supabase
      .from('ai_buddy_rate_limits')
      .select('tier, messages_per_minute, messages_per_day')
      .eq('tier', tier)
      .single();

    if (limitsError || !dbLimits) {
      // Fall back to hardcoded limits
      return getRateLimitsForTier(tier);
    }

    return {
      tier: dbLimits.tier as 'free' | 'pro' | 'enterprise',
      messagesPerMinute: dbLimits.messages_per_minute,
      messagesPerDay: dbLimits.messages_per_day ?? 0,
    };
  } catch {
    return DEFAULT_RATE_LIMIT;
  }
}

/**
 * Get rate limits for a tier (fallback when DB unavailable)
 */
export function getRateLimitsForTier(tier: string): RateLimit {
  if (tier === 'free' || tier === 'pro' || tier === 'enterprise') {
    return AI_BUDDY_RATE_LIMITS[tier];
  }
  return DEFAULT_RATE_LIMIT;
}

/**
 * Increment message count for rate limiting
 * (Alternative method for explicit increment without check)
 */
export function incrementMessageCount(userId: string): number {
  const windowMs = 60 * 1000;
  const now = new Date();
  const cacheKey = `ai_buddy:${userId}`;

  let entry = rateLimitCache.get(cacheKey);

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    entry = { count: 1, windowStart: now };
    rateLimitCache.set(cacheKey, entry);
    return 1;
  }

  entry.count++;
  return entry.count;
}

/**
 * Check if user has exceeded rate limit (without incrementing)
 */
export function isRateLimited(userId: string, tier: string): boolean {
  const limits = getRateLimitsForTier(tier);
  const windowMs = 60 * 1000;
  const now = new Date();
  const cacheKey = `ai_buddy:${userId}`;

  const entry = rateLimitCache.get(cacheKey);

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    return false; // No entries or expired window
  }

  return entry.count >= limits.messagesPerMinute;
}

/**
 * Reset rate limit for a user (for testing or admin purposes)
 */
export function resetRateLimit(userId: string): void {
  const cacheKey = `ai_buddy:${userId}`;
  rateLimitCache.delete(cacheKey);
}

/**
 * Get current rate limit status for a user (without incrementing)
 */
export function getRateLimitStatus(userId: string, tier: string): {
  count: number;
  limit: number;
  remaining: number;
  resetAt: Date | null;
} {
  const limits = getRateLimitsForTier(tier);
  const windowMs = 60 * 1000;
  const now = new Date();
  const cacheKey = `ai_buddy:${userId}`;

  const entry = rateLimitCache.get(cacheKey);

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    return {
      count: 0,
      limit: limits.messagesPerMinute,
      remaining: limits.messagesPerMinute,
      resetAt: null,
    };
  }

  return {
    count: entry.count,
    limit: limits.messagesPerMinute,
    remaining: Math.max(0, limits.messagesPerMinute - entry.count),
    resetAt: new Date(entry.windowStart.getTime() + windowMs),
  };
}
