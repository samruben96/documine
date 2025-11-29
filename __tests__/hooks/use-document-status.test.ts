/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentStatus, useAgencyId } from '@/hooks/use-document-status';
import type { Tables } from '@/types/database.types';

type Document = Tables<'documents'>;

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
};

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { agency_id: 'agency-123' },
    }),
  }),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useDocumentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default subscribe behavior
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED');
      return mockChannel;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty documents array', () => {
    const { result } = renderHook(() =>
      useDocumentStatus({ agencyId: 'agency-123' })
    );

    expect(result.current.documents).toEqual([]);
  });

  it('initializes with provided initial documents', () => {
    const initialDocs: Document[] = [
      {
        id: 'doc-1',
        agency_id: 'agency-123',
        filename: 'test.pdf',
        status: 'ready',
        storage_path: 'path/to/file',
        uploaded_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_name: null,
        page_count: null,
      },
    ];

    const { result } = renderHook(() =>
      useDocumentStatus({
        agencyId: 'agency-123',
        initialDocuments: initialDocs,
      })
    );

    expect(result.current.documents).toEqual(initialDocs);
  });

  it('creates realtime channel with correct agency filter', () => {
    renderHook(() => useDocumentStatus({ agencyId: 'agency-123' }));

    expect(mockSupabase.channel).toHaveBeenCalledWith('documents-agency-123');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: 'agency_id=eq.agency-123',
      }),
      expect.any(Function)
    );
  });

  it('sets isConnected to true when subscription succeeds', async () => {
    const { result } = renderHook(() =>
      useDocumentStatus({ agencyId: 'agency-123' })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('sets isConnected to false on channel error', async () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('CHANNEL_ERROR');
      return mockChannel;
    });

    const { result } = renderHook(() =>
      useDocumentStatus({ agencyId: 'agency-123' })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('allows updating documents via setDocuments', () => {
    const { result } = renderHook(() =>
      useDocumentStatus({ agencyId: 'agency-123' })
    );

    const newDoc: Document = {
      id: 'doc-new',
      agency_id: 'agency-123',
      filename: 'new.pdf',
      status: 'processing',
      storage_path: 'path/to/new',
      uploaded_by: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      display_name: null,
      page_count: null,
    };

    act(() => {
      result.current.setDocuments([newDoc]);
    });

    expect(result.current.documents).toContainEqual(newDoc);
  });

  it('cleans up channel on unmount', () => {
    const { unmount } = renderHook(() =>
      useDocumentStatus({ agencyId: 'agency-123' })
    );

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it('does not subscribe when agencyId is empty', () => {
    renderHook(() => useDocumentStatus({ agencyId: '' }));

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });
});

describe('useAgencyId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading state', () => {
    const { result } = renderHook(() => useAgencyId());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.agencyId).toBe(null);
  });

  it('returns agencyId after loading', async () => {
    const { result } = renderHook(() => useAgencyId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agencyId).toBe('agency-123');
  });

  it('returns null agencyId when user not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    });

    const { result } = renderHook(() => useAgencyId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agencyId).toBe(null);
  });

  it('returns null agencyId when database query fails', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Query failed'),
      }),
    });

    const { result } = renderHook(() => useAgencyId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.agencyId).toBe(null);
  });
});
