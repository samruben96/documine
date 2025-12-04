/**
 * Rate limiting utility using Supabase as backend
 * Story 8.5: API Rate Limiting
 */

import { createClient } from '@/lib/supabase/server';

export interface RateLimitConfig {
  entityType: 'agency' | 'user';
  entityId: string;
  endpoint: string;
  limit: number;
  windowMs: number; // milliseconds (1 hour = 3600000)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Check and increment rate limit for an entity/endpoint combination
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = await createClient();

  // Calculate window start (floor to window boundary)
  const windowStart = new Date(
    Math.floor(Date.now() / config.windowMs) * config.windowMs
  );
  const resetAt = new Date(windowStart.getTime() + config.windowMs);

  // Call RPC to increment counter
  const { data, error } = await supabase.rpc('increment_rate_limit', {
    p_entity_type: config.entityType,
    p_entity_id: config.entityId,
    p_endpoint: config.endpoint,
    p_window_start: windowStart.toISOString(),
  });

  if (error) {
    // On error, allow request but log warning
    console.warn('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: config.limit,
      resetAt,
      limit: config.limit,
    };
  }

  const requestCount = data?.[0]?.request_count ?? 1;
  const remaining = Math.max(0, config.limit - requestCount);
  const allowed = requestCount <= config.limit;

  return {
    allowed,
    remaining,
    resetAt,
    limit: config.limit,
  };
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}

/**
 * Create 429 response with rate limit headers
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  message?: string
): Response {
  const retryAfter = Math.ceil(
    (result.resetAt.getTime() - Date.now()) / 1000
  );

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message:
        message ??
        `You've reached the rate limit. Please try again in ${formatDuration(retryAfter)}.`,
      retryAfter,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        ...rateLimitHeaders(result),
      },
    }
  );
}

/**
 * Format seconds into human-readable duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes === 1) {
    return '1 minute';
  }
  return `${minutes} minutes`;
}

// Rate limit configurations
export const RATE_LIMITS = {
  compare: {
    limit: 10,
    windowMs: 3600000, // 1 hour
    entityType: 'agency' as const,
  },
  chat: {
    limit: 100,
    windowMs: 3600000, // 1 hour
    entityType: 'user' as const,
  },
} as const;
