/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '@/hooks/use-chat';

/**
 * Create a mock SSE stream response
 */
function createMockSSEResponse(events: string[], delay = 50): Response {
  let eventIndex = 0;
  const stream = new ReadableStream({
    async pull(controller) {
      if (eventIndex < events.length) {
        const event = events[eventIndex++];
        controller.enqueue(new TextEncoder().encode(event + '\n'));
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' }
  });
}

/**
 * Standard successful chat response events
 */
const successfulChatEvents = [
  'data: {"type":"text","content":"Hello! "}',
  'data: {"type":"text","content":"How can I help you?"}',
  'data: {"type":"confidence","content":"high"}',
  'data: {"type":"source","content":{"pageNumber":1,"text":"Sample source","chunkId":"chunk-1"}}',
  'data: {"type":"done","content":{"conversationId":"conv-123"}}',
];

describe('useChat', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Mock fetch globally
    fetchMock = vi.fn().mockImplementation(() =>
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
      const { result } = renderHook(() => useChat('doc-123'));

      expect(result.current.messages).toEqual([]);
    });

    it('isLoading is false initially', () => {
      const { result } = renderHook(() => useChat('doc-123'));

      expect(result.current.isLoading).toBe(false);
    });

    it('error is null initially', () => {
      const { result } = renderHook(() => useChat('doc-123'));

      expect(result.current.error).toBeNull();
    });
  });

  describe('AC-5.2.7: sendMessage and optimistic UI', () => {
    it('adds user message immediately (optimistic update)', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('Hello world');
      });

      // User message should appear immediately (plus streaming assistant placeholder)
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello world');
    });

    it('user message has unique id', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      await act(async () => {
        result.current.sendMessage('Message 1');
        await vi.advanceTimersByTimeAsync(500);
      });

      const firstId = result.current.messages[0].id;
      expect(firstId).toMatch(/^msg_/);

      await act(async () => {
        result.current.sendMessage('Message 2');
        await vi.advanceTimersByTimeAsync(100);
      });

      // Find the second user message (after first user, first assistant)
      const secondUserMessage = result.current.messages.find(
        (msg, idx) => idx > 1 && msg.role === 'user'
      );
      expect(secondUserMessage?.id).toBeDefined();
      expect(secondUserMessage?.id).not.toBe(firstId);
    });

    it('user message has createdAt timestamp', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.messages[0].createdAt).toBeInstanceOf(Date);
    });

    it('does not add message when content is empty', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('');
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('does not add message when content is only whitespace', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('   ');
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('trims whitespace from message content', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('  Hello world  ');
      });

      expect(result.current.messages[0].content).toBe('Hello world');
    });
  });

  describe('AC-5.2.8: Loading state', () => {
    it('sets isLoading to true while waiting for response', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading to false after response completes', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      await act(async () => {
        result.current.sendMessage('Test message');
        // Allow SSE stream to complete
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('adds assistant response after loading completes', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      await act(async () => {
        result.current.sendMessage('Test question');
        // Allow SSE stream to complete
        await vi.advanceTimersByTimeAsync(500);
      });

      // Should have both user and assistant messages
      expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[1].role).toBe('assistant');
    });
  });

  describe('clearMessages', () => {
    it('clears all messages', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      // Add a message and wait for response
      await act(async () => {
        result.current.sendMessage('Test message');
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(result.current.messages.length).toBeGreaterThan(0);

      // Clear messages
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('resets loading state', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('Test message');
      });

      // Clear while loading
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('clears any errors', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      // Clear messages should reset error state
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Multiple messages', () => {
    it('maintains conversation order', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      // Send first message
      await act(async () => {
        result.current.sendMessage('First question');
        await vi.advanceTimersByTimeAsync(500);
      });

      // Send second message
      await act(async () => {
        result.current.sendMessage('Second question');
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(result.current.messages.length).toBeGreaterThanOrEqual(4);
      expect(result.current.messages[0].content).toBe('First question');
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[2].content).toBe('Second question');
      expect(result.current.messages[3].role).toBe('assistant');
    });
  });
});
