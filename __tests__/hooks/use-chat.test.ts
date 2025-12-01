/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '@/hooks/use-chat';

describe('useChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

      // User message should appear immediately
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello world');
    });

    it('user message has unique id', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('Message 1');
      });

      const firstId = result.current.messages[0].id;
      expect(firstId).toMatch(/^msg_/);

      // Wait for response
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      act(() => {
        result.current.sendMessage('Message 2');
      });

      const thirdMessage = result.current.messages[2]; // First user, then assistant, then second user
      expect(thirdMessage.id).not.toBe(firstId);
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

      act(() => {
        result.current.sendMessage('Test message');
      });

      // Wait for simulated response
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('adds assistant response after loading completes', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      act(() => {
        result.current.sendMessage('Test question');
      });

      // Initially only user message
      expect(result.current.messages).toHaveLength(1);

      // Wait for simulated response
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Now should have both user and assistant messages
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe('assistant');
    });
  });

  describe('clearMessages', () => {
    it('clears all messages', async () => {
      const { result } = renderHook(() => useChat('doc-123'));

      // Add a message and wait for response
      act(() => {
        result.current.sendMessage('Test message');
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
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
      act(() => {
        result.current.sendMessage('First question');
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Send second message
      act(() => {
        result.current.sendMessage('Second question');
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.messages).toHaveLength(4);
      expect(result.current.messages[0].content).toBe('First question');
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[2].content).toBe('Second question');
      expect(result.current.messages[3].role).toBe('assistant');
    });
  });
});
