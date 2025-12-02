/**
 * Chat Service Tests
 *
 * Story 5.6: Conversation History & Follow-up Questions
 * Tests for AC-5.6.2, AC-5.6.3, AC-5.6.6, AC-5.6.10, AC-5.6.11, AC-5.6.12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateConversation,
  getConversationMessages,
  saveUserMessage,
  saveAssistantMessage,
  getConversationHistory,
  createNewConversation,
  truncateHistoryToTokenBudget,
} from '@/lib/chat/service';
import type { ChatMessage } from '@/lib/chat/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

describe('Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset method chains
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.limit.mockReturnValue(mockSupabase);
  });

  describe('getOrCreateConversation', () => {
    describe('AC-5.6.3: Returns existing conversation', () => {
      it('returns existing conversation if one exists', async () => {
        const existingConv = {
          id: 'conv-123',
          agency_id: 'agency-1',
          document_id: 'doc-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.single.mockResolvedValue({ data: existingConv, error: null });

        const result = await getOrCreateConversation(
          mockSupabase as any,
          'doc-1',
          'user-1',
          'agency-1'
        );

        expect(result.id).toBe('conv-123');
        expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      });
    });

    describe('AC-5.6.3: Creates new if none exists', () => {
      it('creates new conversation if none exists', async () => {
        const newConv = {
          id: 'new-conv',
          agency_id: 'agency-1',
          document_id: 'doc-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        // First call (select) returns no data
        mockSupabase.single
          .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
          // Second call (insert) returns new conversation
          .mockResolvedValueOnce({ data: newConv, error: null });

        const result = await getOrCreateConversation(
          mockSupabase as any,
          'doc-1',
          'user-1',
          'agency-1'
        );

        expect(result.id).toBe('new-conv');
        expect(mockSupabase.insert).toHaveBeenCalled();
      });
    });

    describe('AC-5.6.12: Race condition handling', () => {
      it('handles race condition via unique constraint violation', async () => {
        const existingConv = {
          id: 'conv-from-race',
          agency_id: 'agency-1',
          document_id: 'doc-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        // First call (select) returns no data
        mockSupabase.single
          .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
          // Insert fails with unique violation
          .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'unique violation' } })
          // Re-fetch returns the existing conversation
          .mockResolvedValueOnce({ data: existingConv, error: null });

        const result = await getOrCreateConversation(
          mockSupabase as any,
          'doc-1',
          'user-1',
          'agency-1'
        );

        expect(result.id).toBe('conv-from-race');
      });
    });
  });

  describe('getConversationMessages', () => {
    describe('AC-5.6.4: Returns all messages', () => {
      it('returns all messages in chronological order', async () => {
        const messages = [
          { id: '1', conversation_id: 'conv-1', agency_id: 'a', role: 'user', content: 'Hi', sources: null, confidence: null, created_at: '2024-01-01T00:00:00Z' },
          { id: '2', conversation_id: 'conv-1', agency_id: 'a', role: 'assistant', content: 'Hello!', sources: null, confidence: null, created_at: '2024-01-01T00:01:00Z' },
        ];

        mockSupabase.order.mockResolvedValue({ data: messages, error: null });

        const result = await getConversationMessages(mockSupabase as any, 'conv-1');

        expect(result).toHaveLength(2);
        expect(result[0].role).toBe('user');
        expect(result[1].role).toBe('assistant');
      });
    });

    describe('AC-5.6.11: Error handling', () => {
      it('throws error when loading messages fails', async () => {
        mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });

        await expect(getConversationMessages(mockSupabase as any, 'conv-1'))
          .rejects.toThrow('Failed to load conversation messages');
      });
    });
  });

  describe('saveUserMessage', () => {
    describe('AC-5.6.2: Saves user message', () => {
      it('saves user message to database', async () => {
        const savedMessage = {
          id: 'msg-1',
          conversation_id: 'conv-1',
          agency_id: 'agency-1',
          role: 'user',
          content: 'Hello',
          sources: null,
          confidence: null,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.single.mockResolvedValue({ data: savedMessage, error: null });
        mockSupabase.eq.mockResolvedValue({ data: null, error: null });

        const result = await saveUserMessage(mockSupabase as any, 'conv-1', 'agency-1', 'Hello');

        expect(result.role).toBe('user');
        expect(result.content).toBe('Hello');
        expect(mockSupabase.insert).toHaveBeenCalled();
      });

      it('updates conversation updated_at timestamp', async () => {
        const savedMessage = {
          id: 'msg-1',
          conversation_id: 'conv-1',
          agency_id: 'agency-1',
          role: 'user',
          content: 'Hello',
          sources: null,
          confidence: null,
          created_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.single.mockResolvedValue({ data: savedMessage, error: null });
        mockSupabase.eq.mockResolvedValue({ data: null, error: null });

        await saveUserMessage(mockSupabase as any, 'conv-1', 'agency-1', 'Hello');

        expect(mockSupabase.update).toHaveBeenCalled();
      });
    });

    describe('AC-5.6.11: Error handling', () => {
      it('throws error when save fails', async () => {
        mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

        await expect(saveUserMessage(mockSupabase as any, 'conv-1', 'agency-1', 'Hello'))
          .rejects.toThrow('Failed to save user message');
      });
    });
  });

  describe('saveAssistantMessage', () => {
    describe('AC-5.6.2: Saves assistant message with sources and confidence', () => {
      it('saves assistant message with sources and confidence JSONB', async () => {
        const sources = [{ pageNumber: 1, text: 'test', chunkId: 'c1' }];
        const savedMessage = {
          id: 'msg-2',
          conversation_id: 'conv-1',
          agency_id: 'agency-1',
          role: 'assistant',
          content: 'Response',
          sources,
          confidence: 'high',
          created_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.single.mockResolvedValue({ data: savedMessage, error: null });
        mockSupabase.eq.mockResolvedValue({ data: null, error: null });

        const result = await saveAssistantMessage(
          mockSupabase as any,
          'conv-1',
          'agency-1',
          'Response',
          sources,
          'high'
        );

        expect(result.role).toBe('assistant');
        expect(result.sources).toEqual(sources);
        expect(result.confidence).toBe('high');
      });
    });
  });

  describe('getConversationHistory', () => {
    describe('AC-5.6.6: Returns last 10 messages', () => {
      it('limits to 10 messages', async () => {
        const messages = Array.from({ length: 10 }, (_, i) => ({
          id: `msg-${i}`,
          conversation_id: 'conv-1',
          agency_id: 'a',
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          sources: null,
          confidence: null,
          created_at: new Date(2024, 0, 1, 0, i).toISOString(),
        }));

        mockSupabase.limit.mockResolvedValue({ data: messages.reverse(), error: null });

        const result = await getConversationHistory(mockSupabase as any, 'conv-1');

        // Should have max 10 messages
        expect(result.length).toBeLessThanOrEqual(10);
        expect(mockSupabase.limit).toHaveBeenCalledWith(10);
      });
    });

    it('returns messages in chronological order', async () => {
      const messages = [
        { id: '2', conversation_id: 'conv-1', agency_id: 'a', role: 'assistant', content: 'Later', sources: null, confidence: null, created_at: '2024-01-01T00:01:00Z' },
        { id: '1', conversation_id: 'conv-1', agency_id: 'a', role: 'user', content: 'First', sources: null, confidence: null, created_at: '2024-01-01T00:00:00Z' },
      ];

      mockSupabase.limit.mockResolvedValue({ data: messages, error: null });

      const result = await getConversationHistory(mockSupabase as any, 'conv-1');

      // Messages should be reversed to chronological order
      expect(result[0].content).toBe('First');
      expect(result[1].content).toBe('Later');
    });
  });

  describe('createNewConversation', () => {
    describe('AC-5.6.9: Creates fresh conversation', () => {
      it('always creates new conversation (for New Chat)', async () => {
        const newConv = {
          id: 'new-conv',
          agency_id: 'agency-1',
          document_id: 'doc-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.single.mockResolvedValue({ data: newConv, error: null });

        const result = await createNewConversation(
          mockSupabase as any,
          'doc-1',
          'user-1',
          'agency-1'
        );

        expect(result.id).toBe('new-conv');
        expect(mockSupabase.insert).toHaveBeenCalled();
        // Verify insert was called with correct data
        expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      });
    });

    describe('AC-5.6.10: Old conversations preserved', () => {
      it('does not delete old conversations', async () => {
        const newConv = {
          id: 'new-conv',
          agency_id: 'agency-1',
          document_id: 'doc-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.single.mockResolvedValue({ data: newConv, error: null });

        await createNewConversation(mockSupabase as any, 'doc-1', 'user-1', 'agency-1');

        // Verify no delete operation was called
        expect(mockSupabase.from).not.toHaveBeenCalledWith('conversations', expect.objectContaining({ type: 'DELETE' }));
      });
    });
  });

  describe('truncateHistoryToTokenBudget', () => {
    describe('AC-5.6.6: Token budget truncation', () => {
      it('returns all messages if within budget', () => {
        const messages: ChatMessage[] = [
          { id: '1', conversationId: 'c', agencyId: 'a', role: 'user', content: 'Hello', sources: null, confidence: null, createdAt: new Date() },
          { id: '2', conversationId: 'c', agencyId: 'a', role: 'assistant', content: 'Hi', sources: null, confidence: null, createdAt: new Date() },
        ];

        const result = truncateHistoryToTokenBudget(messages, 6000);

        expect(result).toHaveLength(2);
      });

      it('truncates oldest messages when exceeding budget', () => {
        // Create messages that exceed 6000 tokens (~24000 chars)
        const longContent = 'A'.repeat(10000); // ~2500 tokens each
        const messages: ChatMessage[] = [
          { id: '1', conversationId: 'c', agencyId: 'a', role: 'user', content: longContent, sources: null, confidence: null, createdAt: new Date() },
          { id: '2', conversationId: 'c', agencyId: 'a', role: 'assistant', content: longContent, sources: null, confidence: null, createdAt: new Date() },
          { id: '3', conversationId: 'c', agencyId: 'a', role: 'user', content: longContent, sources: null, confidence: null, createdAt: new Date() },
        ];

        const result = truncateHistoryToTokenBudget(messages, 6000);

        // Should truncate to fit budget (keeping most recent)
        expect(result.length).toBeLessThan(3);
        // Most recent should be kept
        expect(result[result.length - 1].id).toBe('3');
      });

      it('limits to 10 messages even if within token budget', () => {
        const messages: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
          id: String(i),
          conversationId: 'c',
          agencyId: 'a',
          role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
          content: 'Short',
          sources: null,
          confidence: null,
          createdAt: new Date(),
        }));

        const result = truncateHistoryToTokenBudget(messages, 100000);

        expect(result.length).toBeLessThanOrEqual(10);
      });

      it('keeps most recent messages when truncating', () => {
        const messages: ChatMessage[] = Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 1),
          conversationId: 'c',
          agencyId: 'a',
          role: 'user' as const,
          content: 'Message ' + (i + 1),
          sources: null,
          confidence: null,
          createdAt: new Date(2024, 0, 1, 0, i),
        }));

        const result = truncateHistoryToTokenBudget(messages, 100);

        // Most recent message should always be included
        expect(result[result.length - 1].id).toBe('5');
      });
    });
  });
});
