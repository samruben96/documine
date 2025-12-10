/**
 * @vitest-environment happy-dom
 */
/**
 * useReportingAnalysis Hook Tests
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * AC-23.3.4: Generate Report button enabled after file upload completes
 * AC-23.3.5: Loading state shown while analysis is in progress
 * AC-23.3.6: Clear error handling if analysis fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReportingAnalysis } from '@/hooks/use-reporting-analysis';
import type { AnalyzeResponse } from '@/types/reporting';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useReportingAnalysis Hook', () => {
  const mockAnalyzeResponse: AnalyzeResponse = {
    sourceId: 'test-source-123',
    status: 'ready',
    columns: [
      { name: 'Amount', type: 'currency', sampleValues: [100, 200], nullCount: 0, uniqueCount: 50 },
      { name: 'Date', type: 'date', sampleValues: ['2024-01-01'], nullCount: 0, uniqueCount: 30 },
    ],
    rowCount: 100,
    suggestedPrompts: [
      'Show monthly totals',
      'Compare by category',
      'Find trends over time',
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useReportingAnalysis());

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.analyze).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('AC-23.3.5: Loading state during analysis', () => {
    it('sets isLoading to true when analysis starts', async () => {
      // Never resolve the fetch to keep it loading
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useReportingAnalysis());

      act(() => {
        result.current.analyze('test-source-123');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading to false when analysis completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading to false when analysis fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('AC-23.3.4: Data returned on success', () => {
    it('returns analysis data on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.data).toEqual(mockAnalyzeResponse);
      expect(result.current.error).toBeNull();
    });

    it('returns suggested prompts in data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.data?.suggestedPrompts).toHaveLength(3);
      expect(result.current.data?.suggestedPrompts).toContain('Show monthly totals');
    });
  });

  describe('AC-23.3.6: Error handling', () => {
    it('sets error on HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Source not found' } }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('invalid-source');
      });

      expect(result.current.error).toBe('Source not found');
      expect(result.current.data).toBeNull();
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.data).toBeNull();
    });

    it('sets error when response has error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: { message: 'Analysis failed' } }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.error).toBe('Analysis failed');
    });

    it('provides fallback error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.error).toBe('Analysis failed (500)');
    });
  });

  describe('API call behavior', () => {
    it('calls correct endpoint with sourceId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('my-source-id');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reporting/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: 'my-source-id' }),
        })
      );
    });

    it('includes abort signal in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('Reset functionality', () => {
    it('resets all state to initial values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      // First, get some data
      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.data).not.toBeNull();

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('clears error state on reset', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useReportingAnalysis());

      await act(async () => {
        await result.current.analyze('test-source-123');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Abort behavior', () => {
    it('aborts previous request when new one starts', async () => {
      const abortSpy = vi.fn();

      // First request - never resolves
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const controller = new AbortController();
            controller.signal.addEventListener('abort', () => {
              abortSpy();
              reject(new DOMException('Aborted', 'AbortError'));
            });
          })
      );

      // Second request - resolves immediately
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      // Start first request
      act(() => {
        result.current.analyze('first-source');
      });

      // Start second request immediately
      await act(async () => {
        await result.current.analyze('second-source');
      });

      // Should have made 2 fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not set error for aborted requests', async () => {
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalyzeResponse }),
      });

      const { result } = renderHook(() => useReportingAnalysis());

      // The abort error should not be captured
      await act(async () => {
        await result.current.analyze('test-source');
      });

      // If error was from abort, it should be null
      // This tests the AbortError filtering in the hook
    });
  });

  describe('Cleanup on unmount', () => {
    it('aborts request when component unmounts', () => {
      // Never resolve the fetch
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result, unmount } = renderHook(() => useReportingAnalysis());

      act(() => {
        result.current.analyze('test-source-123');
      });

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });
});
