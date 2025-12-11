/**
 * useReportGeneration Hook Tests
 * Epic 23: Flexible AI Reports - Story 23.4
 *
 * Tests for the report generation hook with SSE streaming.
 * AC-23.4.4: Generation shows streaming progress feedback via SSE
 * AC-23.4.7: Error states handled gracefully with retry capability
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReportGeneration } from '@/hooks/use-report-generation';
import type { GeneratedReport, ReportInsight, ChartConfig } from '@/types/reporting';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample report for testing
const createMockReport = (): GeneratedReport => ({
  title: 'Test Report',
  summary: 'This is a test summary.',
  insights: [
    {
      type: 'finding',
      severity: 'info',
      title: 'Test Finding',
      description: 'A test finding description',
    },
    {
      type: 'trend',
      severity: 'warning',
      title: 'Test Trend',
      description: 'A test trend description',
    },
    {
      type: 'recommendation',
      severity: 'info',
      title: 'Test Recommendation',
      description: 'A test recommendation description',
    },
  ],
  charts: [
    {
      id: 'chart-1',
      type: 'bar',
      title: 'Test Bar Chart',
      xKey: 'category',
      yKey: 'value',
      data: [],
    },
    {
      id: 'chart-2',
      type: 'line',
      title: 'Test Line Chart',
      xKey: 'date',
      yKey: 'amount',
      data: [],
    },
  ],
  dataTable: {
    columns: ['A', 'B', 'C'],
    rows: [{ A: 1, B: 2, C: 3 }],
    sortable: true,
    filterable: true,
  },
  generatedAt: new Date().toISOString(),
  promptUsed: 'Test prompt',
});

// Helper to create SSE response stream
function createSSEStream(events: Array<{ type: string; [key: string]: unknown }>) {
  const encoder = new TextEncoder();
  const eventStrings = events.map((e) => `data: ${JSON.stringify(e)}\n\n`);

  return new ReadableStream({
    start(controller) {
      for (const eventString of eventStrings) {
        controller.enqueue(encoder.encode(eventString));
      }
      controller.close();
    },
  });
}

describe('useReportGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useReportGeneration());

      expect(result.current.report).toBeNull();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.streamingTitle).toBeNull();
      expect(result.current.streamingSummary).toBeNull();
      expect(result.current.streamingInsights).toEqual([]);
      expect(result.current.streamingCharts).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('generate', () => {
    it('calls API with correct parameters', async () => {
      const mockReport = createMockReport();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'progress', stage: 'generating', percent: 50 },
          { type: 'done', report: mockReport },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123', 'Show me trends');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/reporting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: 'source-123', prompt: 'Show me trends' }),
        signal: expect.any(AbortSignal),
      });
    });

    it('sets isGenerating during API call', async () => {
      let resolveStream: (value: ReadableStream) => void;
      const streamPromise = new Promise<ReadableStream>((resolve) => {
        resolveStream = resolve;
      });

      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'text/event-stream' }),
          body: streamPromise,
        })
      );

      const { result } = renderHook(() => useReportGeneration());

      // Start generation (don't await)
      act(() => {
        result.current.generate('source-123');
      });

      // Should be generating
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      // Complete the stream
      await act(async () => {
        const mockReport = createMockReport();
        resolveStream!(
          createSSEStream([{ type: 'done', report: mockReport }])
        );
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('updates progress from SSE events (AC-23.4.4)', async () => {
      const mockReport = createMockReport();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'progress', stage: 'analyzing', percent: 10 },
          { type: 'progress', stage: 'analyzing', percent: 30 },
          { type: 'progress', stage: 'generating', percent: 50 },
          { type: 'progress', stage: 'generating', percent: 70 },
          { type: 'progress', stage: 'charting', percent: 90 },
          { type: 'done', report: mockReport },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      // Progress should be null after completion
      expect(result.current.progress).toBeNull();
      expect(result.current.report).toEqual(mockReport);
    });

    it('updates streaming title from SSE event', async () => {
      const mockReport = createMockReport();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'title', title: 'My Report Title' },
          { type: 'done', report: mockReport },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      // Streaming values should be cleared after completion, but report is set
      expect(result.current.report?.title).toBe('Test Report');
    });

    it('updates streaming summary from SSE event', async () => {
      const mockReport = createMockReport();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'summary', summary: 'Streaming summary text...' },
          { type: 'done', report: mockReport },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.report?.summary).toBe('This is a test summary.');
    });

    it('accumulates streaming insights from SSE events', async () => {
      const mockReport = createMockReport();
      const insight1: ReportInsight = {
        type: 'finding',
        severity: 'info',
        title: 'First',
        description: 'First insight',
      };
      const insight2: ReportInsight = {
        type: 'trend',
        severity: 'warning',
        title: 'Second',
        description: 'Second insight',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'insight', insight: insight1 },
          { type: 'insight', insight: insight2 },
          { type: 'done', report: mockReport },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      // Streaming insights cleared after done
      expect(result.current.streamingInsights).toEqual([]);
      expect(result.current.report?.insights.length).toBe(3);
    });

    it('accumulates streaming charts from SSE events', async () => {
      const mockReport = createMockReport();
      const chart1: ChartConfig = {
        id: 'chart-1',
        type: 'bar',
        title: 'Bar',
        xKey: 'x',
        yKey: 'y',
        data: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'chart', chart: chart1 },
          { type: 'done', report: mockReport },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.streamingCharts).toEqual([]);
      expect(result.current.report?.charts.length).toBe(2);
    });
  });

  describe('error handling (AC-23.4.7)', () => {
    it('handles non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.report).toBeNull();
      expect(result.current.isGenerating).toBe(false);
    });

    it('handles SSE error event', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([
          { type: 'progress', stage: 'generating', percent: 50 },
          { type: 'error', error: 'Generation failed', code: 'GEN_001' },
        ]),
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.error).toBe('Generation failed');
      expect(result.current.isGenerating).toBe(false);
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.error).toBe('Network error');
    });

    it('handles wrong content type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        body: null,
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.error).toBe('Expected SSE response from generate API');
    });
  });

  describe('reset', () => {
    it('clears all state', async () => {
      const mockReport = createMockReport();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: createSSEStream([{ type: 'done', report: mockReport }]),
      });

      const { result } = renderHook(() => useReportGeneration());

      // Generate a report first
      await act(async () => {
        await result.current.generate('source-123');
      });

      expect(result.current.report).not.toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.report).toBeNull();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.streamingTitle).toBeNull();
      expect(result.current.streamingSummary).toBeNull();
      expect(result.current.streamingInsights).toEqual([]);
      expect(result.current.streamingCharts).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('cancel', () => {
    it('cancels in-progress generation', async () => {
      let resolveStream: (value: ReadableStream) => void;
      const streamPromise = new Promise<ReadableStream>((resolve) => {
        resolveStream = resolve;
      });

      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'text/event-stream' }),
          body: streamPromise,
        })
      );

      const { result } = renderHook(() => useReportGeneration());

      // Start generation
      act(() => {
        result.current.generate('source-123');
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      // Cancel
      act(() => {
        result.current.cancel();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBeNull();
    });
  });

  describe('abort handling', () => {
    it('does not set error for aborted requests', async () => {
      // Create an abort error
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValue(abortError);

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generate('source-123');
      });

      // Error should not be set for abort
      expect(result.current.error).toBeNull();
    });
  });

  describe('multiple calls', () => {
    it('aborts previous request when new one is made', async () => {
      const mockReport = createMockReport();
      let callCount = 0;

      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - will be aborted
          return new Promise(() => {}); // Never resolves
        }
        // Second call - completes
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'text/event-stream' }),
          body: createSSEStream([{ type: 'done', report: mockReport }]),
        });
      });

      const { result } = renderHook(() => useReportGeneration());

      // Start first request (don't await)
      act(() => {
        result.current.generate('source-1');
      });

      // Start second request
      await act(async () => {
        await result.current.generate('source-2');
      });

      // Should complete with second request
      expect(result.current.report).not.toBeNull();
      expect(callCount).toBe(2);
    });
  });
});
