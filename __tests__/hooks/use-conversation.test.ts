/**
 * @vitest-environment happy-dom
 */

/**
 * useConversation Hook Tests
 *
 * Story 5.6: Conversation History & Follow-up Questions
 * Tests for AC-5.6.1, AC-5.6.4, AC-5.6.9, AC-5.6.11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversation } from '@/hooks/use-conversation';

// Create chainable mock
function createChainableMock() {
  const mock: any = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(),
    maybeSingle: vi.fn(), // Used by useConversation for graceful 0-row handling
    auth: {
      getUser: vi.fn(),
    },
  };
  return mock;
}

let mockSupabase: ReturnType<typeof createChainableMock>;

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe('useConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createChainableMock();

    // Default: authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  describe('Initial loading state', () => {
    it('starts with isLoading true', () => {
      // Never resolve to stay in loading
      mockSupabase.maybeSingle.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useConversation('doc-123'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.conversation).toBeNull();
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('AC-5.6.4: Empty conversation handling', () => {
    it('handles case where no conversation exists', async () => {
      // maybeSingle returns null data with no error when 0 rows match
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useConversation('doc-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversation).toBeNull();
      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('AC-5.6.11: Error state - authentication', () => {
    it('sets error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { result } = renderHook(() => useConversation('doc-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Authentication required');
    });
  });

  describe('Hook interface', () => {
    it('exposes refetch function', async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useConversation('doc-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('exposes createNew function', async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useConversation('doc-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.createNew).toBe('function');
    });

    it('returns conversation, messages, isLoading, error states', async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useConversation('doc-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('conversation');
      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('AC-5.6.4: Loads existing conversation', () => {
    it('loads conversation when it exists', async () => {
      const existingConv = {
        id: 'conv-1',
        agency_id: 'agency-1',
        document_id: 'doc-123',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const messages = [
        { id: 'm1', conversation_id: 'conv-1', agency_id: 'agency-1', role: 'user', content: 'Hi', sources: null, confidence: null, created_at: '2024-01-01T00:00:00Z' },
      ];

      // maybeSingle returns data when conversation exists
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: existingConv, error: null });
      // Message loading uses order().select() chain, mock at order
      mockSupabase.order.mockReturnValue({
        ...mockSupabase,
        then: (resolve: Function) => resolve({ data: messages, error: null }),
      });

      const { result } = renderHook(() => useConversation('doc-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The conversation should be loaded
      expect(result.current.conversation?.id).toBe('conv-1');
    });
  });
});
