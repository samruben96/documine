/**
 * AI Buddy Rate Limiter Tests
 * Story 15.3: Streaming Chat API (AC-15.3.6)
 *
 * Tests for rate limiting functionality including:
 * - Tier-based rate limits
 * - Sliding window algorithm
 * - Rate limit checking and incrementing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkAiBuddyRateLimit,
  getRateLimitsForTier,
  incrementMessageCount,
  isRateLimited,
  resetRateLimit,
  getRateLimitStatus,
  AI_BUDDY_RATE_LIMITS,
} from '@/lib/ai-buddy/rate-limiter';

// Mock Supabase client
const createMockSupabase = (agencyTier = 'free', rateLimits = null) => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  // Default behavior for agencies table
  mockSingle.mockImplementation(() => {
    return Promise.resolve({
      data: { subscription_tier: agencyTier },
      error: null,
    });
  });

  // Chain for rate limits table (second call)
  const mockRateLimitSingle = vi.fn().mockImplementation(() => {
    if (rateLimits) {
      return Promise.resolve({
        data: rateLimits,
        error: null,
      });
    }
    return Promise.resolve({
      data: null,
      error: { message: 'Not found' },
    });
  });
  const mockRateLimitEq = vi.fn().mockReturnValue({ single: mockRateLimitSingle });
  const mockRateLimitSelect = vi.fn().mockReturnValue({ eq: mockRateLimitEq });

  // Track which table is being queried
  let callCount = 0;
  mockFrom.mockImplementation((table: string) => {
    callCount++;
    if (table === 'agencies') {
      return { select: mockSelect };
    }
    if (table === 'ai_buddy_rate_limits') {
      return { select: mockRateLimitSelect };
    }
    return { select: mockSelect };
  });

  return { from: mockFrom } as any;
};

describe('AI Buddy Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset rate limit cache before each test
    resetRateLimit('test-user');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getRateLimitsForTier', () => {
    it('returns free tier limits', () => {
      const limits = getRateLimitsForTier('free');
      expect(limits).toEqual(AI_BUDDY_RATE_LIMITS.free);
      expect(limits.messagesPerMinute).toBe(10);
      expect(limits.messagesPerDay).toBe(100);
    });

    it('returns pro tier limits', () => {
      const limits = getRateLimitsForTier('pro');
      expect(limits).toEqual(AI_BUDDY_RATE_LIMITS.pro);
      expect(limits.messagesPerMinute).toBe(20);
      expect(limits.messagesPerDay).toBe(500);
    });

    it('returns enterprise tier limits', () => {
      const limits = getRateLimitsForTier('enterprise');
      expect(limits).toEqual(AI_BUDDY_RATE_LIMITS.enterprise);
      expect(limits.messagesPerMinute).toBe(60);
      expect(limits.messagesPerDay).toBe(2000);
    });

    it('returns free tier limits for unknown tier', () => {
      const limits = getRateLimitsForTier('unknown');
      expect(limits).toEqual(AI_BUDDY_RATE_LIMITS.free);
    });
  });

  describe('incrementMessageCount', () => {
    it('returns 1 for first message', () => {
      const count = incrementMessageCount('new-user');
      expect(count).toBe(1);
      resetRateLimit('new-user');
    });

    it('increments count for subsequent messages', () => {
      incrementMessageCount('counter-user');
      incrementMessageCount('counter-user');
      const count = incrementMessageCount('counter-user');
      expect(count).toBe(3);
      resetRateLimit('counter-user');
    });

    it('resets count after window expires', () => {
      incrementMessageCount('window-user');
      incrementMessageCount('window-user');

      // Advance past the 1-minute window
      vi.advanceTimersByTime(61 * 1000);

      const count = incrementMessageCount('window-user');
      expect(count).toBe(1);
      resetRateLimit('window-user');
    });
  });

  describe('isRateLimited', () => {
    it('returns false when no messages sent', () => {
      expect(isRateLimited('fresh-user', 'free')).toBe(false);
    });

    it('returns false when under limit', () => {
      for (let i = 0; i < 9; i++) {
        incrementMessageCount('under-limit-user');
      }
      expect(isRateLimited('under-limit-user', 'free')).toBe(false);
      resetRateLimit('under-limit-user');
    });

    it('returns true when at limit', () => {
      for (let i = 0; i < 10; i++) {
        incrementMessageCount('at-limit-user');
      }
      expect(isRateLimited('at-limit-user', 'free')).toBe(true);
      resetRateLimit('at-limit-user');
    });

    it('returns false after window expires', () => {
      for (let i = 0; i < 10; i++) {
        incrementMessageCount('expired-user');
      }
      expect(isRateLimited('expired-user', 'free')).toBe(true);

      // Advance past window
      vi.advanceTimersByTime(61 * 1000);

      expect(isRateLimited('expired-user', 'free')).toBe(false);
      resetRateLimit('expired-user');
    });

    it('respects tier-specific limits', () => {
      // Free tier: 10/min
      for (let i = 0; i < 10; i++) {
        incrementMessageCount('tier-user');
      }
      expect(isRateLimited('tier-user', 'free')).toBe(true);
      expect(isRateLimited('tier-user', 'pro')).toBe(false); // Pro allows 20/min
      expect(isRateLimited('tier-user', 'enterprise')).toBe(false); // Enterprise allows 60/min
      resetRateLimit('tier-user');
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns full capacity for new user', () => {
      const status = getRateLimitStatus('status-user', 'free');
      expect(status.count).toBe(0);
      expect(status.limit).toBe(10);
      expect(status.remaining).toBe(10);
      expect(status.resetAt).toBeNull();
    });

    it('returns correct count after messages', () => {
      incrementMessageCount('status-count-user');
      incrementMessageCount('status-count-user');
      incrementMessageCount('status-count-user');

      const status = getRateLimitStatus('status-count-user', 'free');
      expect(status.count).toBe(3);
      expect(status.remaining).toBe(7);
      expect(status.resetAt).not.toBeNull();
      resetRateLimit('status-count-user');
    });

    it('returns 0 remaining when at limit', () => {
      for (let i = 0; i < 10; i++) {
        incrementMessageCount('status-limit-user');
      }

      const status = getRateLimitStatus('status-limit-user', 'free');
      expect(status.remaining).toBe(0);
      resetRateLimit('status-limit-user');
    });

    it('uses correct limit for tier', () => {
      const freeStatus = getRateLimitStatus('tier-status-user', 'free');
      const proStatus = getRateLimitStatus('tier-status-user', 'pro');
      const entStatus = getRateLimitStatus('tier-status-user', 'enterprise');

      expect(freeStatus.limit).toBe(10);
      expect(proStatus.limit).toBe(20);
      expect(entStatus.limit).toBe(60);
    });
  });

  describe('resetRateLimit', () => {
    it('clears rate limit entry', () => {
      incrementMessageCount('reset-user');
      incrementMessageCount('reset-user');

      expect(isRateLimited('reset-user', 'free')).toBe(false);

      // Fill up the limit
      for (let i = 0; i < 8; i++) {
        incrementMessageCount('reset-user');
      }
      expect(isRateLimited('reset-user', 'free')).toBe(true);

      // Reset
      resetRateLimit('reset-user');

      expect(isRateLimited('reset-user', 'free')).toBe(false);
      const status = getRateLimitStatus('reset-user', 'free');
      expect(status.count).toBe(0);
    });
  });

  describe('checkAiBuddyRateLimit', () => {
    it('returns allowed=true when under limit', async () => {
      const supabase = createMockSupabase('free');

      const result = await checkAiBuddyRateLimit('check-user-1', 'agency-1', supabase);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.tier).toBe('free');
      resetRateLimit('check-user-1');
    });

    it('returns allowed=false when at limit', async () => {
      const supabase = createMockSupabase('free');

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        incrementMessageCount('check-user-2');
      }

      const result = await checkAiBuddyRateLimit('check-user-2', 'agency-1', supabase);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      resetRateLimit('check-user-2');
    });

    it('increments count when allowed', async () => {
      const supabase = createMockSupabase('free');

      await checkAiBuddyRateLimit('check-user-3', 'agency-1', supabase);
      const status = getRateLimitStatus('check-user-3', 'free');

      expect(status.count).toBe(1);
      resetRateLimit('check-user-3');
    });

    it('does not increment count when denied', async () => {
      const supabase = createMockSupabase('free');

      // Fill to limit
      for (let i = 0; i < 10; i++) {
        incrementMessageCount('check-user-4');
      }

      const beforeStatus = getRateLimitStatus('check-user-4', 'free');
      await checkAiBuddyRateLimit('check-user-4', 'agency-1', supabase);
      const afterStatus = getRateLimitStatus('check-user-4', 'free');

      expect(afterStatus.count).toBe(beforeStatus.count);
      resetRateLimit('check-user-4');
    });

    it('returns resetAt time', async () => {
      const supabase = createMockSupabase('free');

      incrementMessageCount('check-user-5');
      const result = await checkAiBuddyRateLimit('check-user-5', 'agency-1', supabase);

      expect(result.resetAt).toBeInstanceOf(Date);
      // Reset time should be ~1 minute from window start
      const now = new Date();
      const resetTime = result.resetAt.getTime();
      expect(resetTime).toBeGreaterThan(now.getTime());
      expect(resetTime - now.getTime()).toBeLessThanOrEqual(60 * 1000);
      resetRateLimit('check-user-5');
    });

    it('uses agency tier from database', async () => {
      const supabase = createMockSupabase('pro');

      const result = await checkAiBuddyRateLimit('check-user-6', 'agency-1', supabase);

      expect(result.tier).toBe('pro');
      expect(result.limit).toBe(20); // Pro tier limit
      resetRateLimit('check-user-6');
    });

    it('falls back to free tier on database error', async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any;

      const result = await checkAiBuddyRateLimit('check-user-7', 'agency-1', supabase);

      expect(result.tier).toBe('free');
      expect(result.limit).toBe(10);
      resetRateLimit('check-user-7');
    });
  });

  describe('Sliding window behavior', () => {
    it('window resets after 1 minute', async () => {
      const supabase = createMockSupabase('free');

      // Use up the limit
      for (let i = 0; i < 10; i++) {
        await checkAiBuddyRateLimit('window-user', 'agency-1', supabase);
      }

      let result = await checkAiBuddyRateLimit('window-user', 'agency-1', supabase);
      expect(result.allowed).toBe(false);

      // Advance 30 seconds - still in window
      vi.advanceTimersByTime(30 * 1000);
      result = await checkAiBuddyRateLimit('window-user', 'agency-1', supabase);
      expect(result.allowed).toBe(false);

      // Advance past 1 minute total - window resets
      vi.advanceTimersByTime(31 * 1000);
      result = await checkAiBuddyRateLimit('window-user', 'agency-1', supabase);
      expect(result.allowed).toBe(true);

      resetRateLimit('window-user');
    });

    it('different users have independent limits', async () => {
      const supabase = createMockSupabase('free');

      // Fill up user 1's limit
      for (let i = 0; i < 10; i++) {
        await checkAiBuddyRateLimit('independent-user-1', 'agency-1', supabase);
      }

      // User 1 should be limited
      let result1 = await checkAiBuddyRateLimit('independent-user-1', 'agency-1', supabase);
      expect(result1.allowed).toBe(false);

      // User 2 should still be allowed
      let result2 = await checkAiBuddyRateLimit('independent-user-2', 'agency-1', supabase);
      expect(result2.allowed).toBe(true);

      resetRateLimit('independent-user-1');
      resetRateLimit('independent-user-2');
    });
  });
});
