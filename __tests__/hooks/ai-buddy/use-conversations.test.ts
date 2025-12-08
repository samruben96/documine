/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy useConversations Hook Tests
 * Story 15.4: Conversation Persistence
 *
 * Tests for:
 * - AC-15.4.4: Conversations listed sorted by most recent activity
 * - AC-15.4.6: Fetching user's conversations with pagination
 * - AC-15.4.8: Loading specific conversation with messages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversations } from '@/hooks/ai-buddy/use-conversations';

// Mock conversation data
const mockConversations = [
  {
    id: 'conv-1',
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: null,
    title: 'Most recent conversation',
    deletedAt: null,
    createdAt: '2025-12-07T10:00:00Z',
    updatedAt: '2025-12-07T12:00:00Z',
  },
  {
    id: 'conv-2',
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: 'proj-1',
    title: 'Second conversation',
    deletedAt: null,
    createdAt: '2025-12-06T10:00:00Z',
    updatedAt: '2025-12-07T11:00:00Z',
  },
  {
    id: 'conv-3',
    agencyId: 'agency-1',
    userId: 'user-1',
    projectId: null,
    title: 'Oldest conversation',
    deletedAt: null,
    createdAt: '2025-12-05T10:00:00Z',
    updatedAt: '2025-12-05T15:00:00Z',
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    agencyId: 'agency-1',
    role: 'user',
    content: 'Hello',
    sources: null,
    confidence: null,
    createdAt: '2025-12-07T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    agencyId: 'agency-1',
    role: 'assistant',
    content: 'Hi! How can I help?',
    sources: null,
    confidence: 'high',
    createdAt: '2025-12-07T10:00:05Z',
  },
];

describe('AI Buddy useConversations', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('returns empty conversations array initially', () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { data: [], nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      expect(result.current.conversations).toEqual([]);
    });

    it('isLoading is false initially', () => {
      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      expect(result.current.isLoading).toBe(false);
    });

    it('error is null initially', () => {
      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      expect(result.current.error).toBeNull();
    });

    it('activeConversation is null initially', () => {
      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      expect(result.current.activeConversation).toBeNull();
    });
  });

  describe('AC-15.4.6: Fetching conversations', () => {
    it('auto-fetches conversations on mount when autoFetch is true', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: true }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai-buddy/conversations')
      );
    });

    it('does not auto-fetch when autoFetch is false', () => {
      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchConversations populates conversations list', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations).toHaveLength(3);
      expect(result.current.conversations[0].id).toBe('conv-1');
    });

    it('includes projectId filter in request when provided', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: [], nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() =>
        useConversations({ autoFetch: false, projectId: 'proj-123' })
      );

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('projectId=proj-123')
      );
    });

    it('includes search parameter when provided', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: [], nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations({ search: 'test query' });
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('search=test+query')
      );
    });

    it('handles pagination with cursor', async () => {
      const page1 = mockConversations.slice(0, 2);
      const page2 = mockConversations.slice(2);

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { data: page1, nextCursor: 'cursor-123' },
              error: null,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ data: { data: page2, nextCursor: null }, error: null }),
        });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      // Fetch first page
      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.nextCursor).toBe('cursor-123');

      // Fetch second page
      await act(async () => {
        await result.current.fetchConversations({ cursor: 'cursor-123' });
      });

      expect(result.current.conversations).toHaveLength(3);
      expect(result.current.nextCursor).toBeNull();
    });

    it('handles API error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'AIB_006', message: 'Server error' },
          }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.conversations).toEqual([]);
    });
  });

  describe('AC-15.4.4: Conversations sorted by recent activity', () => {
    it('returns conversations in order returned by API (most recent first)', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      // API returns already sorted - verify order is preserved
      expect(result.current.conversations[0].id).toBe('conv-1'); // Most recent
      expect(result.current.conversations[1].id).toBe('conv-2');
      expect(result.current.conversations[2].id).toBe('conv-3'); // Oldest
    });
  });

  describe('AC-15.4.8: Loading specific conversation', () => {
    it('loadConversation fetches conversation with messages', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              conversation: mockConversations[0],
              messages: mockMessages,
            },
            error: null,
          }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/ai-buddy/conversations/conv-1');
      expect(result.current.activeConversation).not.toBeNull();
      expect(result.current.activeConversation?.conversation.id).toBe('conv-1');
      expect(result.current.activeConversation?.messages).toHaveLength(2);
    });

    it('sets isLoadingConversation during fetch', async () => {
      let resolvePromise: () => void;
      const delayedPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockImplementation(async () => {
        await delayedPromise;
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              data: { conversation: mockConversations[0], messages: mockMessages },
              error: null,
            }),
        };
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      act(() => {
        result.current.loadConversation('conv-1');
      });

      expect(result.current.isLoadingConversation).toBe(true);

      await act(async () => {
        resolvePromise!();
        await waitFor(() => !result.current.isLoadingConversation);
      });

      expect(result.current.isLoadingConversation).toBe(false);
    });

    it('handles error when loading conversation', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'AIB_005', message: 'Conversation not found' },
          }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.loadConversation('nonexistent');
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.activeConversation).toBeNull();
    });
  });

  describe('Search conversations', () => {
    it('searchConversations returns matching results', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { data: [mockConversations[0]], nextCursor: null },
            error: null,
          }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      let searchResults: typeof mockConversations = [];
      await act(async () => {
        searchResults = await result.current.searchConversations('recent');
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('search=recent')
      );
      expect(searchResults).toHaveLength(1);
    });

    it('searchConversations returns empty array on error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ data: null, error: { message: 'Error' } }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      let searchResults: typeof mockConversations = [];
      await act(async () => {
        searchResults = await result.current.searchConversations('test');
      });

      expect(searchResults).toEqual([]);
    });
  });

  describe('Delete conversation', () => {
    it('deleteConversation removes conversation from list optimistically', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations).toHaveLength(3);

      await act(async () => {
        await result.current.deleteConversation('conv-1');
      });

      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.conversations.find((c) => c.id === 'conv-1')).toBeUndefined();
    });

    it('deleteConversation reverts on failure', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
        })
        .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      try {
        await act(async () => {
          await result.current.deleteConversation('conv-1');
        });
      } catch {
        // Expected to throw
      }

      // Should revert back to original state
      expect(result.current.conversations).toHaveLength(3);
    });

    it('deleteConversation clears activeConversation if it was deleted', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { conversation: mockConversations[0], messages: mockMessages },
              error: null,
            }),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
        await result.current.loadConversation('conv-1');
      });

      expect(result.current.activeConversation?.conversation.id).toBe('conv-1');

      await act(async () => {
        await result.current.deleteConversation('conv-1');
      });

      expect(result.current.activeConversation).toBeNull();
    });
  });

  describe('Clear active conversation', () => {
    it('clearActiveConversation sets activeConversation to null', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { conversation: mockConversations[0], messages: mockMessages },
            error: null,
          }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      expect(result.current.activeConversation).not.toBeNull();

      act(() => {
        result.current.clearActiveConversation();
      });

      expect(result.current.activeConversation).toBeNull();
    });
  });

  describe('Add conversation', () => {
    it('addConversation adds new conversation to front of list', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      const newConversation = {
        id: 'conv-new',
        agencyId: 'agency-1',
        userId: 'user-1',
        projectId: null,
        title: 'Brand new conversation',
        deletedAt: null,
        createdAt: '2025-12-07T14:00:00Z',
        updatedAt: '2025-12-07T14:00:00Z',
      };

      act(() => {
        result.current.addConversation(newConversation);
      });

      expect(result.current.conversations).toHaveLength(4);
      expect(result.current.conversations[0].id).toBe('conv-new');
    });

    it('addConversation updates existing conversation if already present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      const updatedConversation = {
        ...mockConversations[0],
        title: 'Updated title',
      };

      act(() => {
        result.current.addConversation(updatedConversation);
      });

      expect(result.current.conversations).toHaveLength(3);
      expect(result.current.conversations.find((c) => c.id === 'conv-1')?.title).toBe(
        'Updated title'
      );
    });
  });

  describe('Refresh', () => {
    it('refresh re-fetches conversations', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: { data: mockConversations, nextCursor: null }, error: null }),
      });

      const { result } = renderHook(() => useConversations({ autoFetch: false }));

      await act(async () => {
        await result.current.refresh();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai-buddy/conversations')
      );
    });
  });
});
