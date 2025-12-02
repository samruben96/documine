import { describe, it, expect } from 'vitest';
import { estimateProcessingTime, formatBytes } from '@/lib/documents/processing';

/**
 * Tests for document processing helpers
 * Story 5.8.1: Large Document Processing Reliability (AC-5.8.1.3)
 */
describe('Document Processing Helpers', () => {
  describe('estimateProcessingTime', () => {
    it('returns "<1 min" for files under 5MB', () => {
      const size1MB = 1 * 1024 * 1024;
      expect(estimateProcessingTime(size1MB)).toBe('<1 min');

      const size4MB = 4 * 1024 * 1024;
      expect(estimateProcessingTime(size4MB)).toBe('<1 min');
    });

    it('returns "1-2 min" for files between 5-20MB', () => {
      const size5MB = 5 * 1024 * 1024;
      expect(estimateProcessingTime(size5MB)).toBe('1-2 min');

      const size10MB = 10 * 1024 * 1024;
      expect(estimateProcessingTime(size10MB)).toBe('1-2 min');

      const size19MB = 19 * 1024 * 1024;
      expect(estimateProcessingTime(size19MB)).toBe('1-2 min');
    });

    it('returns "3-5 min" for files 20MB and above', () => {
      const size20MB = 20 * 1024 * 1024;
      expect(estimateProcessingTime(size20MB)).toBe('3-5 min');

      const size30MB = 30 * 1024 * 1024;
      expect(estimateProcessingTime(size30MB)).toBe('3-5 min');

      const size50MB = 50 * 1024 * 1024;
      expect(estimateProcessingTime(size50MB)).toBe('3-5 min');
    });
  });

  describe('formatBytes', () => {
    it('formats 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes', () => {
      expect(formatBytes(500)).toBe('500.0 Bytes');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(10485760)).toBe('10.0 MB');
      expect(formatBytes(52428800)).toBe('50.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.0 GB');
    });
  });
});
