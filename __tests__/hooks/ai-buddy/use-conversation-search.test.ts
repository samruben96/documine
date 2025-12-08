/**
 * Tests for useConversationSearch hook
 * Story 16.5: Conversation Search (FR4)
 *
 * AC-16.5.2: Typing query searches across all user's conversations
 * AC-16.5.5: Search results return within 1 second
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConversationSearch } from '@/hooks/ai-buddy/use-conversation-search';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useConversationSearch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns empty results for empty query', () => {
    const { result } = renderHook(() => useConversationSearch(''));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns empty results for query shorter than 2 characters', () => {
    const { result } = renderHook(() => useConversationSearch('a'));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches results for valid query', async () => {
    const mockResults = [
      {
        conversationId: 'conv-1',
        conversationTitle: 'Test Conversation',
        projectId: 'proj-1',
        projectName: 'Test Project',
        matchedText: 'This is about liability insurance',
        highlightedText: 'This is about liability <mark>insurance</mark>',
        messageId: 'msg-1',
        createdAt: '2025-12-08T12:00:00Z',
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockResults }),
    });

    const { result } = renderHook(() => useConversationSearch('insurance'));

    // Wait for debounce and fetch
    await waitFor(
      () => {
        expect(result.current.results).toEqual(mockResults);
      },
      { timeout: 1000 }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai-buddy/conversations?search=insurance',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('sets loading state during fetch', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValue({
      ok: true,
      json: () => pendingPromise,
    });

    const { result } = renderHook(() => useConversationSearch('test query'));

    // Wait for loading to start
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(true);
      },
      { timeout: 1000 }
    );

    // Resolve the fetch
    await act(async () => {
      resolvePromise!({ data: [] });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sets error state when fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useConversationSearch('test query'));

    await waitFor(
      () => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Search failed');
        expect(result.current.results).toEqual([]);
      },
      { timeout: 1000 }
    );
  });

  it('sets error state when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null, error: { message: 'Database error' } }),
    });

    const { result } = renderHook(() => useConversationSearch('test query'));

    await waitFor(
      () => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Database error');
      },
      { timeout: 1000 }
    );
  });

  it('clears results when query becomes too short', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ conversationId: 'conv-1' }] }),
    });

    const { result, rerender } = renderHook(
      ({ query }) => useConversationSearch(query),
      { initialProps: { query: 'insurance' } }
    );

    // Wait for results
    await waitFor(
      () => {
        expect(result.current.results.length).toBe(1);
      },
      { timeout: 1000 }
    );

    // Clear query
    rerender({ query: '' });

    await waitFor(() => {
      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('uses correct API endpoint with encoded query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    renderHook(() => useConversationSearch('test query'));

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/ai-buddy/conversations?search=test%20query',
          expect.any(Object)
        );
      },
      { timeout: 1000 }
    );
  });
});
