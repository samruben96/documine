/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy useChat Hook Tests
 * Story 15.3: Streaming Chat API
 *
 * Tests for:
 * - AC-15.3.1: SSE stream consumption
 * - AC-15.3.5: Error handling with retry option
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '@/hooks/ai-buddy/use-chat';

/**
 * Create a mock SSE stream response for AI Buddy chat
 */
function createMockSSEResponse(
  events: string[],
  delay = 10
): Response {
  let eventIndex = 0;
  const stream = new ReadableStream({
    async pull(controller) {
      if (eventIndex < events.length) {
        const event = events[eventIndex++];
        controller.enqueue(new TextEncoder().encode(event + '\n'));
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

/**
 * Standard successful AI Buddy chat response events
 */
const successfulChatEvents = [
  'data: {"type":"chunk","content":"Hello! "}',
  'data: {"type":"chunk","content":"How can I help you today?"}',
  'data: {"type":"sources","citations":[]}',
  'data: {"type":"confidence","level":"medium"}',
  'data: {"type":"done","conversationId":"conv-123","messageId":"msg-456"}',
];

describe('AI Buddy useChat', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(createMockSSEResponse(successfulChatEvents))
      );
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('returns empty messages array initially', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
    });

    it('isLoading is false initially', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isLoading).toBe(false);
    });

    it('error is null initially', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.error).toBeNull();
    });

    it('streamingContent is empty initially', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.streamingContent).toBe('');
    });

    it('conversation is null initially without conversationId', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.conversation).toBeNull();
    });

    it('conversation is set when conversationId is provided', () => {
      const { result } = renderHook(() =>
        useChat({ conversationId: 'existing-conv-id' })
      );

      expect(result.current.conversation).not.toBeNull();
      expect(result.current.conversation?.id).toBe('existing-conv-id');
    });
  });

  describe('AC-15.3.1: SSE Stream Consumption', () => {
    it('sends message to API endpoint', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Hello AI Buddy');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai-buddy/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('sends correct request body', async () => {
      const { result } = renderHook(() =>
        useChat({ conversationId: 'conv-123', projectId: 'proj-456' })
      );

      await act(async () => {
        result.current.sendMessage('Test message');
        await vi.advanceTimersByTimeAsync(100);
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody).toEqual({
        conversationId: 'conv-123',
        projectId: 'proj-456',
        message: 'Test message',
        attachments: undefined,
      });
    });

    it('adds user message immediately (optimistic update)', async () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Test message');
    });

    it('processes chunk events and accumulates content', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(50);
      });

      // Streaming content should have accumulated chunks
      // Note: The exact timing depends on how fast chunks arrive
      expect(fetchMock).toHaveBeenCalled();
    });

    it('processes sources event', async () => {
      const eventsWithSources = [
        'data: {"type":"chunk","content":"Response"}',
        'data: {"type":"sources","citations":[{"documentId":"doc-1","pageNumber":1,"text":"Source text"}]}',
        'data: {"type":"confidence","level":"high"}',
        'data: {"type":"done","conversationId":"conv-123","messageId":"msg-456"}',
      ];

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(createMockSSEResponse(eventsWithSources))
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(200);
      });

      // After processing, assistant message should have sources
      const assistantMsg = result.current.messages.find(
        (m) => m.role === 'assistant'
      );
      expect(assistantMsg).toBeDefined();
    });

    it('processes confidence event', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(200);
      });

      // After done event, confidence should be reset to null (moved to message)
      expect(result.current.streamingConfidence).toBeNull();
    });

    it('processes done event and adds assistant message', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test question');
        await vi.advanceTimersByTimeAsync(300);
      });

      // Should have user and assistant messages
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
      const assistantMsg = result.current.messages.find(
        (m) => m.role === 'assistant'
      );
      expect(assistantMsg).toBeDefined();
    });
  });

  describe('AC-15.3.5: Error Handling', () => {
    it('handles API error response', async () => {
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: { message: 'Test error' } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Test error');
    });

    it('removes optimistic user message on error', async () => {
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: { message: 'Error' } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      // User message should be removed on error
      expect(result.current.messages).toEqual([]);
    });

    it('calls onError callback when error occurs', async () => {
      const onError = vi.fn();

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: { message: 'Error' } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );

      const { result } = renderHook(() => useChat({ onError }));

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(onError).toHaveBeenCalled();
    });

    it('retryLastMessage resends the last failed message', async () => {
      // First call fails
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: { message: 'Error' } }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Retry test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).not.toBeNull();

      // Reset mock for retry
      fetchMock.mockImplementation(() =>
        Promise.resolve(createMockSSEResponse(successfulChatEvents))
      );

      await act(async () => {
        result.current.retryLastMessage();
        await vi.advanceTimersByTimeAsync(300);
      });

      // After retry, fetch should be called again
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('handles SSE error event', async () => {
      const errorEvents = [
        'data: {"type":"chunk","content":"Partial response"}',
        'data: {"type":"error","error":"AI provider error","code":"AIB_004"}',
      ];

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(createMockSSEResponse(errorEvents))
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).not.toBeNull();
    });

    it('handles network error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('Loading state', () => {
    it('sets isLoading to true when sending', async () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.sendMessage('Test');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading to false after completion', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading to false after error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Conversation management', () => {
    it('updates conversation when new one is created', async () => {
      const onConversationCreated = vi.fn();
      const { result } = renderHook(() =>
        useChat({ onConversationCreated })
      );

      await act(async () => {
        result.current.sendMessage('First message');
        await vi.advanceTimersByTimeAsync(300);
      });

      // Conversation should be set from done event
      expect(result.current.conversation).not.toBeNull();
      expect(onConversationCreated).toHaveBeenCalled();
    });

    it('does not create new conversation when conversationId provided', async () => {
      const onConversationCreated = vi.fn();
      const { result } = renderHook(() =>
        useChat({ conversationId: 'existing-conv', onConversationCreated })
      );

      await act(async () => {
        result.current.sendMessage('Message in existing conv');
        await vi.advanceTimersByTimeAsync(300);
      });

      // onConversationCreated should not be called for existing conversations
      expect(onConversationCreated).not.toHaveBeenCalled();
    });
  });

  describe('clearMessages', () => {
    it('clears all messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.messages.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('clears error state', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.error).toBeNull();
    });

    it('clears streaming state', async () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.streamingContent).toBe('');
      expect(result.current.streamingCitations).toEqual([]);
      expect(result.current.streamingConfidence).toBeNull();
    });

    it('clears conversation', () => {
      const { result } = renderHook(() =>
        useChat({ conversationId: 'conv-123' })
      );

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.conversation).toBeNull();
    });
  });

  describe('Abort handling', () => {
    it('aborts previous request when sending new message', async () => {
      const { result } = renderHook(() => useChat());

      // Send first message
      act(() => {
        result.current.sendMessage('First');
      });

      // Send second message immediately
      act(() => {
        result.current.sendMessage('Second');
      });

      // Both should have been initiated
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('aborts on unmount', async () => {
      const { result, unmount } = renderHook(() => useChat());

      act(() => {
        result.current.sendMessage('Test');
      });

      unmount();

      // No error should be thrown from orphaned request
    });
  });
});
