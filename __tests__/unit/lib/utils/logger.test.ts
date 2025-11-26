import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '@/lib/utils/logger';

describe('log', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('log.info', () => {
    it('should output JSON with level "info"', () => {
      log.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string);
      expect(output.level).toBe('info');
    });

    it('should include message in output', () => {
      log.info('User logged in');

      const output = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string);
      expect(output.message).toBe('User logged in');
    });

    it('should include timestamp in ISO-8601 format', () => {
      log.info('Test');

      const output = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string);
      expect(output.timestamp).toBeDefined();
      // ISO-8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include additional data when provided', () => {
      log.info('User action', { userId: '123', action: 'login' });

      const output = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string);
      expect(output.userId).toBe('123');
      expect(output.action).toBe('login');
    });

    it('should work without additional data', () => {
      log.info('Simple message');

      const output = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string);
      expect(output).toHaveProperty('level');
      expect(output).toHaveProperty('message');
      expect(output).toHaveProperty('timestamp');
    });
  });

  describe('log.warn', () => {
    it('should output JSON with level "warn"', () => {
      log.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
      expect(output.level).toBe('warn');
    });

    it('should include message in output', () => {
      log.warn('Deprecated API used');

      const output = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
      expect(output.message).toBe('Deprecated API used');
    });

    it('should include timestamp in ISO-8601 format', () => {
      log.warn('Test warning');

      const output = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include additional data when provided', () => {
      log.warn('Rate limit approaching', { currentRate: 95, limit: 100 });

      const output = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
      expect(output.currentRate).toBe(95);
      expect(output.limit).toBe(100);
    });
  });

  describe('log.error', () => {
    it('should output JSON with level "error"', () => {
      const error = new Error('Test error');
      log.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(output.level).toBe('error');
    });

    it('should include message in output', () => {
      const error = new Error('DB connection failed');
      log.error('Database error', error);

      const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(output.message).toBe('Database error');
    });

    it('should include error message', () => {
      const error = new Error('Connection timeout');
      log.error('Failed to connect', error);

      const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(output.error).toBe('Connection timeout');
    });

    it('should include error stack', () => {
      const error = new Error('Stack trace test');
      log.error('Error with stack', error);

      const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(output.stack).toBeDefined();
      expect(output.stack).toContain('Error: Stack trace test');
    });

    it('should include timestamp in ISO-8601 format', () => {
      const error = new Error('Test');
      log.error('Error', error);

      const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include additional data when provided', () => {
      const error = new Error('Failed');
      log.error('Operation failed', error, { operation: 'upload', documentId: 'doc-123' });

      const output = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(output.operation).toBe('upload');
      expect(output.documentId).toBe('doc-123');
    });
  });
});
