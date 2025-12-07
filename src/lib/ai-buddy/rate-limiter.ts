/**
 * AI Buddy Rate Limiter
 * Story 14.2: API Route Structure
 *
 * Rate limit checking for AI Buddy API routes.
 * Uses existing rate_limits table created in Story 14.1.
 */

import type { RateLimit } from '@/types/ai-buddy';

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  tier: string;
}

/**
 * Default rate limits by tier (from Story 14.1 seed data)
 */
export const AI_BUDDY_RATE_LIMITS = {
  free: { tier: 'free', messagesPerMinute: 10, messagesPerDay: 100 },
  pro: { tier: 'pro', messagesPerMinute: 30, messagesPerDay: 500 },
  enterprise: { tier: 'enterprise', messagesPerMinute: 60, messagesPerDay: 2000 },
} as const satisfies Record<string, RateLimit>;

// Default rate limit for unknown tiers
const DEFAULT_RATE_LIMIT: RateLimit = AI_BUDDY_RATE_LIMITS.free;

/**
 * Check rate limit for a user
 * @throws Error - Not implemented
 */
export async function checkAiBuddyRateLimit(
  _userId: string,
  _agencyTier: string
): Promise<RateLimitCheck> {
  throw new Error('Not implemented - Rate limit checking deferred to Epic 15');
}

/**
 * Get rate limits for an agency tier
 */
export function getRateLimitsForTier(tier: string): RateLimit {
  if (tier === 'free' || tier === 'pro' || tier === 'enterprise') {
    return AI_BUDDY_RATE_LIMITS[tier];
  }
  return DEFAULT_RATE_LIMIT;
}

/**
 * Increment message count for rate limiting
 * @throws Error - Not implemented
 */
export async function incrementMessageCount(
  _userId: string,
  _windowType: 'minute' | 'day'
): Promise<number> {
  throw new Error('Not implemented - Rate limit increment deferred to Epic 15');
}

/**
 * Check if user has exceeded rate limit
 * Uses in-memory check against known limits (actual implementation uses DB)
 */
export function isRateLimited(
  currentCount: number,
  tier: string,
  windowType: 'minute' | 'day'
): boolean {
  const limits = getRateLimitsForTier(tier);
  const limit = windowType === 'minute' ? limits.messagesPerMinute : limits.messagesPerDay;
  return currentCount >= limit;
}
