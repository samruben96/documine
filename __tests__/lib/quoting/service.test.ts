/**
 * Tests for quote session service
 * Story Q2.1: Quote Sessions List Page
 *
 * Tests status calculation, row transformation, and list queries.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QuoteClientData, QuoteSessionRow } from '@/types/quoting';

// Import pure functions directly for testing
import {
  calculateSessionStatus,
  transformQuoteSession,
  listQuoteSessions,
} from '@/lib/quoting/service';

describe('Quote Session Service', () => {
  describe('calculateSessionStatus', () => {
    it('returns draft for empty client data', () => {
      expect(calculateSessionStatus(null, 0)).toBe('draft');
      expect(calculateSessionStatus(undefined, 0)).toBe('draft');
      expect(calculateSessionStatus({}, 0)).toBe('draft');
    });

    it('returns in_progress when personal info has firstName + lastName', () => {
      const clientData: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };
      expect(calculateSessionStatus(clientData, 0)).toBe('in_progress');
    });

    it('returns draft when personal info is incomplete', () => {
      const clientData: QuoteClientData = {
        personal: {
          firstName: 'John',
          lastName: '',
        },
      };
      expect(calculateSessionStatus(clientData, 0)).toBe('draft');
    });

    it('returns in_progress when property data exists', () => {
      const clientData: QuoteClientData = {
        property: {
          yearBuilt: 2000,
        },
      };
      expect(calculateSessionStatus(clientData, 0)).toBe('in_progress');
    });

    it('returns in_progress when vehicles exist', () => {
      const clientData: QuoteClientData = {
        auto: {
          vehicles: [{ year: 2020, make: 'Toyota' }],
        },
      };
      expect(calculateSessionStatus(clientData, 0)).toBe('in_progress');
    });

    it('returns in_progress when drivers exist', () => {
      const clientData: QuoteClientData = {
        auto: {
          drivers: [{ firstName: 'John', lastName: 'Doe' }],
        },
      };
      expect(calculateSessionStatus(clientData, 0)).toBe('in_progress');
    });

    it('returns quotes_received when carrier count > 0', () => {
      const clientData: QuoteClientData = {
        personal: { firstName: 'John', lastName: 'Doe' },
      };
      expect(calculateSessionStatus(clientData, 1)).toBe('quotes_received');
      expect(calculateSessionStatus(clientData, 5)).toBe('quotes_received');
    });

    it('returns complete when stored status is complete', () => {
      const clientData: QuoteClientData = {
        personal: { firstName: 'John', lastName: 'Doe' },
      };
      expect(calculateSessionStatus(clientData, 2, 'complete')).toBe('complete');
    });

    it('prioritizes complete status over computed', () => {
      // Even with no data, if stored as complete, return complete
      expect(calculateSessionStatus({}, 0, 'complete')).toBe('complete');
    });

    it('prioritizes quotes_received over in_progress', () => {
      const clientData: QuoteClientData = {
        personal: { firstName: 'John', lastName: 'Doe' },
      };
      // With carrier count, should be quotes_received not in_progress
      expect(calculateSessionStatus(clientData, 3)).toBe('quotes_received');
    });
  });

  describe('transformQuoteSession', () => {
    const mockRow: QuoteSessionRow = {
      id: 'session-123',
      agency_id: 'agency-456',
      user_id: 'user-789',
      prospect_name: 'Test Family',
      quote_type: 'bundle',
      status: 'draft',
      client_data: {},
      created_at: '2025-12-11T10:00:00Z',
      updated_at: '2025-12-11T11:00:00Z',
    };

    it('transforms snake_case to camelCase', () => {
      const session = transformQuoteSession(mockRow, 0);

      expect(session.id).toBe('session-123');
      expect(session.agencyId).toBe('agency-456');
      expect(session.userId).toBe('user-789');
      expect(session.prospectName).toBe('Test Family');
      expect(session.quoteType).toBe('bundle');
      expect(session.createdAt).toBe('2025-12-11T10:00:00Z');
      expect(session.updatedAt).toBe('2025-12-11T11:00:00Z');
    });

    it('computes status from client data', () => {
      const rowWithData: QuoteSessionRow = {
        ...mockRow,
        client_data: {
          personal: { firstName: 'John', lastName: 'Doe' },
        },
      };
      const session = transformQuoteSession(rowWithData, 0);
      expect(session.status).toBe('in_progress');
    });

    it('includes carrier count', () => {
      const session = transformQuoteSession(mockRow, 5);
      expect(session.carrierCount).toBe(5);
    });

    it('handles null client_data', () => {
      const rowWithNull = {
        ...mockRow,
        client_data: null as unknown as object,
      };
      const session = transformQuoteSession(rowWithNull as QuoteSessionRow, 0);
      expect(session.clientData).toEqual({});
      expect(session.status).toBe('draft');
    });
  });

  describe('listQuoteSessions', () => {
    // Mock Supabase client for query tests
    const mockData = [
      {
        id: 'session-1',
        agency_id: 'agency-123',
        user_id: 'user-456',
        prospect_name: 'Smith Family',
        quote_type: 'bundle',
        status: 'draft',
        client_data: { personal: { firstName: 'John', lastName: 'Smith' } },
        created_at: '2025-12-10T10:00:00Z',
        updated_at: '2025-12-11T15:00:00Z',
        quote_results: { count: 0 },
      },
      {
        id: 'session-2',
        agency_id: 'agency-123',
        user_id: 'user-456',
        prospect_name: 'Johnson Family',
        quote_type: 'home',
        status: 'draft',
        client_data: {},
        created_at: '2025-12-09T10:00:00Z',
        updated_at: '2025-12-11T10:00:00Z',
        quote_results: { count: 2 },
      },
    ];

    let mockSupabase: ReturnType<typeof createMockSupabase>;

    function createMockSupabase(data: typeof mockData | null, error: Error | null = null) {
      const mockSingle = vi.fn().mockResolvedValue({ data, error });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle, then: (fn: (arg: { data: typeof mockData; error: null }) => unknown) => fn({ data: data!, error: null }) });
      const mockIlike = vi.fn().mockReturnValue({ limit: mockLimit, order: vi.fn().mockReturnValue({ limit: mockLimit, ilike: vi.fn().mockReturnValue({ limit: mockLimit }) }) });
      const mockOrder = vi.fn().mockReturnValue({ ilike: mockIlike, limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      // Chain properly
      const chain = {
        from: mockFrom,
        _mockOrder: mockOrder,
        _mockIlike: mockIlike,
        _mockLimit: mockLimit,
      };

      // Make the chain return data properly
      mockLimit.mockImplementation((n: number) => {
        return Promise.resolve({ data, error });
      });
      mockOrder.mockImplementation(() => {
        return {
          ilike: mockIlike,
          limit: mockLimit,
          then: (fn: (arg: { data: typeof mockData; error: null }) => unknown) => fn({ data: data!, error: null }),
        };
      });
      mockIlike.mockImplementation(() => {
        return {
          limit: mockLimit,
          order: mockOrder,
          then: (fn: (arg: { data: typeof mockData; error: null }) => unknown) => fn({ data: data!, error: null }),
        };
      });

      return chain;
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns empty array when data is null', async () => {
      mockSupabase = createMockSupabase(null);
      const result = await listQuoteSessions(mockSupabase as unknown as Parameters<typeof listQuoteSessions>[0]);
      expect(result).toEqual([]);
    });

    it('transforms rows and computes status', async () => {
      mockSupabase = createMockSupabase(mockData);
      const result = await listQuoteSessions(mockSupabase as unknown as Parameters<typeof listQuoteSessions>[0]);

      expect(result).toHaveLength(2);

      // First session has personal data, no quotes -> in_progress
      expect(result[0].prospectName).toBe('Smith Family');
      expect(result[0].status).toBe('in_progress');
      expect(result[0].carrierCount).toBe(0);

      // Second session has quotes -> quotes_received
      expect(result[1].prospectName).toBe('Johnson Family');
      expect(result[1].status).toBe('quotes_received');
      expect(result[1].carrierCount).toBe(2);
    });

    it('filters by status when specified', async () => {
      mockSupabase = createMockSupabase(mockData);
      const result = await listQuoteSessions(
        mockSupabase as unknown as Parameters<typeof listQuoteSessions>[0],
        { status: 'in_progress' }
      );

      // Only the session with in_progress status should be returned
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('in_progress');
    });

    it('filters by multiple statuses when array specified', async () => {
      mockSupabase = createMockSupabase(mockData);
      const result = await listQuoteSessions(
        mockSupabase as unknown as Parameters<typeof listQuoteSessions>[0],
        { status: ['in_progress', 'quotes_received'] }
      );

      expect(result).toHaveLength(2);
    });
  });
});
