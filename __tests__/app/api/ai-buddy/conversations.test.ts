/**
 * @vitest-environment node
 */
/**
 * AI Buddy Conversations API Tests
 * Story 15.4: Conversation Persistence
 *
 * Tests for:
 * - AC-15.4.6: GET /api/ai-buddy/conversations returns user's conversations with pagination
 * - AC-15.4.7: GET /api/ai-buddy/conversations/[id] returns conversation with all messages
 *
 * Note: These are integration-style tests that verify request/response format.
 * The actual Supabase queries are tested via mocking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Test data
const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockConversations = [
  {
    id: 'conv-1',
    agency_id: 'agency-1',
    user_id: 'user-123',
    project_id: null,
    title: 'Test Conversation',
    deleted_at: null,
    created_at: '2025-12-07T10:00:00Z',
    updated_at: '2025-12-07T12:00:00Z',
  },
  {
    id: 'conv-2',
    agency_id: 'agency-1',
    user_id: 'user-123',
    project_id: 'proj-1',
    title: 'Second Conversation',
    deleted_at: null,
    created_at: '2025-12-06T10:00:00Z',
    updated_at: '2025-12-07T11:00:00Z',
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    agency_id: 'agency-1',
    role: 'user',
    content: 'Hello',
    sources: null,
    confidence: null,
    created_at: '2025-12-07T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    agency_id: 'agency-1',
    role: 'assistant',
    content: 'Hi there!',
    sources: null,
    confidence: 'high',
    created_at: '2025-12-07T10:00:05Z',
  },
];

// Setup mocks before any imports
let mockAuthState = { user: mockUser, error: null };
let mockConversationsData = mockConversations;
let mockMessagesData = mockMessages;
let mockSingleError: Error | null = null;

// Helper to create chainable query builder
const createQueryChain = (resolveValue: { data: unknown; error: unknown }) => {
  const chain: Record<string, vi.Mock> = {};

  const chainFn = () => {
    // When resolved, return the final value
    return Object.assign(Promise.resolve(resolveValue), chain);
  };

  chain.select = vi.fn().mockImplementation(chainFn);
  chain.update = vi.fn().mockImplementation(chainFn);
  chain.eq = vi.fn().mockImplementation(chainFn);
  chain.is = vi.fn().mockImplementation(chainFn);
  chain.order = vi.fn().mockImplementation(chainFn);
  chain.ilike = vi.fn().mockImplementation(chainFn);
  chain.or = vi.fn().mockImplementation(chainFn);
  chain.limit = vi.fn().mockImplementation(chainFn);
  chain.single = vi.fn().mockImplementation(() =>
    Promise.resolve(mockSingleError ? { data: null, error: mockSingleError } : resolveValue)
  );

  return chain;
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => {
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'ai_buddy_conversations') {
          return createQueryChain({ data: mockConversationsData, error: null });
        }
        if (table === 'ai_buddy_messages') {
          return createQueryChain({ data: mockMessagesData, error: null });
        }
        return createQueryChain({ data: null, error: null });
      }),
      auth: {
        getUser: vi.fn().mockImplementation(async () => ({
          data: { user: mockAuthState.user },
          error: mockAuthState.error,
        })),
      },
    };
  }),
  // Service client for delete operations (bypasses RLS)
  createServiceClient: vi.fn().mockImplementation(() => {
    return {
      from: vi.fn().mockImplementation(() => {
        return createQueryChain({ data: null, error: null });
      }),
    };
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AI Buddy Conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockAuthState = { user: mockUser, error: null };
    mockConversationsData = mockConversations;
    mockMessagesData = mockMessages;
    mockSingleError = null;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('GET /api/ai-buddy/conversations', () => {
    describe('AC-15.4.6: List conversations with pagination', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockAuthState = { user: null as any, error: new Error('Not authenticated') };

        const { GET } = await import('@/app/api/ai-buddy/conversations/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations');

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(401);
        expect(json.error.code).toBe('AIB_001');
      });

      it('returns conversations for authenticated user', async () => {
        const { GET } = await import('@/app/api/ai-buddy/conversations/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations');

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.data).toHaveLength(2);
        expect(json.data.data[0].id).toBe('conv-1');
        expect(json.error).toBeNull();
      });

      it('returns nextCursor when more results available', async () => {
        // Create more conversations than default limit
        mockConversationsData = Array.from({ length: 51 }, (_, i) => ({
          id: `conv-${i}`,
          agency_id: 'agency-1',
          user_id: 'user-123',
          project_id: null,
          title: `Conversation ${i}`,
          deleted_at: null,
          created_at: '2025-12-07T10:00:00Z',
          updated_at: '2025-12-07T12:00:00Z',
        }));

        const { GET } = await import('@/app/api/ai-buddy/conversations/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations');

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.data).toHaveLength(50); // Limited to 50
        expect(json.data.nextCursor).toBeDefined();
      });

      it('returns null nextCursor when no more results', async () => {
        mockConversationsData = [mockConversations[0]];

        const { GET } = await import('@/app/api/ai-buddy/conversations/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations');

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.nextCursor).toBeUndefined();
      });

      it('validates limit parameter - rejects too high value', async () => {
        const { GET } = await import('@/app/api/ai-buddy/conversations/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations?limit=200');

        const response = await GET(request);

        expect(response.status).toBe(400);
      });

      it('accepts valid limit parameter', async () => {
        const { GET } = await import('@/app/api/ai-buddy/conversations/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations?limit=10');

        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.error).toBeNull();
      });
    });
  });

  describe('GET /api/ai-buddy/conversations/[id]', () => {
    describe('AC-15.4.7: Get conversation with messages', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockAuthState = { user: null as any, error: new Error('Not authenticated') };

        const { GET } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/12345678-1234-1234-1234-123456789012');

        const response = await GET(request, {
          params: Promise.resolve({ id: '12345678-1234-1234-1234-123456789012' }),
        });
        const json = await response.json();

        expect(response.status).toBe(401);
        expect(json.error.code).toBe('AIB_001');
      });

      it('returns 400 for invalid UUID format', async () => {
        const { GET } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/invalid-id');

        const response = await GET(request, {
          params: Promise.resolve({ id: 'invalid-id' }),
        });
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error.code).toBe('AIB_004');
      });

      it('returns 404 when conversation not found', async () => {
        mockConversationsData = [];
        mockSingleError = { code: 'PGRST116', message: 'Not found' } as any;

        const { GET } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/12345678-1234-1234-1234-123456789012');

        const response = await GET(request, {
          params: Promise.resolve({ id: '12345678-1234-1234-1234-123456789012' }),
        });
        const json = await response.json();

        expect(response.status).toBe(404);
        expect(json.error.code).toBe('AIB_005');
      });

      it('returns conversation with messages', async () => {
        // Reset error state
        mockSingleError = null;
        mockConversationsData = mockConversations;

        const { GET } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/12345678-1234-1234-1234-123456789012');

        const response = await GET(request, {
          params: Promise.resolve({ id: '12345678-1234-1234-1234-123456789012' }),
        });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.conversation).toBeDefined();
        expect(json.data.messages).toBeDefined();
        expect(json.error).toBeNull();
      });
    });
  });

  describe('DELETE /api/ai-buddy/conversations/[id]', () => {
    describe('Soft delete conversation', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockAuthState = { user: null as any, error: new Error('Not authenticated') };

        const { DELETE } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/12345678-1234-1234-1234-123456789012', {
          method: 'DELETE',
        });

        const response = await DELETE(request, {
          params: Promise.resolve({ id: '12345678-1234-1234-1234-123456789012' }),
        });
        const json = await response.json();

        expect(response.status).toBe(401);
        expect(json.error.code).toBe('AIB_001');
      });

      it('returns 400 for invalid UUID format', async () => {
        const { DELETE } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/invalid-id', {
          method: 'DELETE',
        });

        const response = await DELETE(request, {
          params: Promise.resolve({ id: 'invalid-id' }),
        });
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error.code).toBe('AIB_004');
      });

      it('returns success when conversation deleted', async () => {
        mockSingleError = null;

        const { DELETE } = await import('@/app/api/ai-buddy/conversations/[id]/route');
        const request = new NextRequest('http://localhost/api/ai-buddy/conversations/12345678-1234-1234-1234-123456789012', {
          method: 'DELETE',
        });

        const response = await DELETE(request, {
          params: Promise.resolve({ id: '12345678-1234-1234-1234-123456789012' }),
        });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.deleted).toBe(true);
        expect(json.error).toBeNull();
      });
    });
  });
});
