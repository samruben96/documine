/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeDate } from '@/lib/utils/date';

describe('formatRelativeDate', () => {
  const mockNow = new Date('2025-11-30T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('AC-4.3.2: Relative date formatting', () => {
    it('returns "Just now" for < 1 minute ago', () => {
      const date = new Date('2025-11-30T11:59:30.000Z'); // 30 seconds ago
      expect(formatRelativeDate(date.toISOString())).toBe('Just now');
    });

    it('returns "Just now" for 0 seconds ago', () => {
      const date = new Date('2025-11-30T12:00:00.000Z'); // exactly now
      expect(formatRelativeDate(date.toISOString())).toBe('Just now');
    });

    it('returns "1 minute ago" for exactly 1 minute', () => {
      const date = new Date('2025-11-30T11:59:00.000Z'); // 1 minute ago
      expect(formatRelativeDate(date.toISOString())).toBe('1 minute ago');
    });

    it('returns "X minutes ago" for < 1 hour', () => {
      const date = new Date('2025-11-30T11:45:00.000Z'); // 15 minutes ago
      expect(formatRelativeDate(date.toISOString())).toBe('15 minutes ago');
    });

    it('returns "59 minutes ago" at the edge of hour threshold', () => {
      const date = new Date('2025-11-30T11:01:00.000Z'); // 59 minutes ago
      expect(formatRelativeDate(date.toISOString())).toBe('59 minutes ago');
    });

    it('returns "1 hour ago" for exactly 1 hour', () => {
      const date = new Date('2025-11-30T11:00:00.000Z'); // 1 hour ago
      expect(formatRelativeDate(date.toISOString())).toBe('1 hour ago');
    });

    it('returns "X hours ago" for < 24 hours', () => {
      const date = new Date('2025-11-30T06:00:00.000Z'); // 6 hours ago
      expect(formatRelativeDate(date.toISOString())).toBe('6 hours ago');
    });

    it('returns "23 hours ago" at the edge of day threshold', () => {
      const date = new Date('2025-11-29T13:00:00.000Z'); // 23 hours ago
      expect(formatRelativeDate(date.toISOString())).toBe('23 hours ago');
    });

    it('returns "Yesterday" for 1 day ago', () => {
      const date = new Date('2025-11-29T12:00:00.000Z'); // exactly 24 hours ago
      expect(formatRelativeDate(date.toISOString())).toBe('Yesterday');
    });

    it('returns short date format for 2+ days ago', () => {
      const date = new Date('2025-11-28T12:00:00.000Z'); // 2 days ago
      expect(formatRelativeDate(date.toISOString())).toBe('Nov 28');
    });

    it('returns short date format for older dates', () => {
      const date = new Date('2025-10-15T12:00:00.000Z'); // ~1.5 months ago
      expect(formatRelativeDate(date.toISOString())).toBe('Oct 15');
    });

    it('returns short date format for much older dates', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      expect(formatRelativeDate(date.toISOString())).toBe('Jan 1');
    });
  });

  describe('edge cases', () => {
    it('handles dates from different years', () => {
      const date = new Date('2024-12-25T12:00:00.000Z');
      expect(formatRelativeDate(date.toISOString())).toBe('Dec 25');
    });

    it('handles future dates (shows as "Just now")', () => {
      const date = new Date('2025-11-30T12:05:00.000Z'); // 5 minutes in future
      // Since the diff will be negative, it should return "Just now"
      expect(formatRelativeDate(date.toISOString())).toBe('Just now');
    });
  });
});
