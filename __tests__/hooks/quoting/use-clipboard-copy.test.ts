/**
 * useClipboardCopy Hook Tests
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * Tests AC-Q4.1-3, AC-Q4.1-4, AC-Q4.1-6
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipboardCopy } from '@/hooks/quoting/use-clipboard-copy';

describe('useClipboardCopy', () => {
  // Mock clipboard API
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });

    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with null copiedCarrier', () => {
      const { result } = renderHook(() => useClipboardCopy());

      expect(result.current.copiedCarrier).toBeNull();
    });

    it('starts with no error', () => {
      const { result } = renderHook(() => useClipboardCopy());

      expect(result.current.error).toBeNull();
    });

    it('starts not loading', () => {
      const { result } = renderHook(() => useClipboardCopy());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('copyToClipboard', () => {
    it('copies text to clipboard successfully', async () => {
      const { result } = renderHook(() => useClipboardCopy());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('Test data');
    });

    it('sets copiedCarrier on success (AC-Q4.1-3)', async () => {
      const { result } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(result.current.copiedCarrier).toBe('progressive');
    });

    it('resets copiedCarrier after 2 seconds (AC-Q4.1-4)', async () => {
      const { result } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(result.current.copiedCarrier).toBe('progressive');

      // Advance time by 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copiedCarrier).toBeNull();
    });

    it('does not reset before 2 seconds', async () => {
      const { result } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });

      // Advance time by 1.9 seconds
      await act(async () => {
        vi.advanceTimersByTime(1900);
      });

      expect(result.current.copiedCarrier).toBe('progressive');
    });

    it('tracks different carriers correctly', async () => {
      const { result } = renderHook(() => useClipboardCopy());

      // Copy for progressive
      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Progressive data');
      });
      expect(result.current.copiedCarrier).toBe('progressive');

      // Copy for travelers (should replace previous)
      await act(async () => {
        await result.current.copyToClipboard('travelers', 'Travelers data');
      });
      expect(result.current.copiedCarrier).toBe('travelers');
    });
  });

  describe('error handling (AC-Q4.1-6)', () => {
    it('sets error on clipboard API failure', async () => {
      mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

      const { result } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Clipboard access denied');
    });

    it('returns false on failure', async () => {
      mockWriteText.mockRejectedValue(new Error('Clipboard error'));

      const { result } = renderHook(() => useClipboardCopy());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(success).toBe(false);
    });

    it('clears copiedCarrier on error', async () => {
      mockWriteText.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(result.current.copiedCarrier).toBeNull();
    });

    it('allows retry after error', async () => {
      // First call fails
      mockWriteText.mockRejectedValueOnce(new Error('First failure'));
      // Second call succeeds
      mockWriteText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboardCopy());

      // First attempt fails
      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });
      expect(result.current.error).toBeDefined();

      // Retry succeeds
      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });
      expect(result.current.error).toBeNull();
      expect(result.current.copiedCarrier).toBe('progressive');
    });

    it('resetError clears error state', async () => {
      mockWriteText.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test data');
      });
      expect(result.current.error).toBeDefined();

      act(() => {
        result.current.resetError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('loading state', () => {
    it('sets isLoading during copy operation', async () => {
      // Create a promise we can control
      let resolveClipboard: () => void;
      const clipboardPromise = new Promise<void>((resolve) => {
        resolveClipboard = resolve;
      });
      mockWriteText.mockReturnValue(clipboardPromise);

      const { result } = renderHook(() => useClipboardCopy());

      // Start copy but don't await
      let copyPromise: Promise<boolean>;
      act(() => {
        copyPromise = result.current.copyToClipboard('progressive', 'Test');
      });

      // Should be loading now
      expect(result.current.isLoading).toBe(true);

      // Resolve the clipboard operation
      await act(async () => {
        resolveClipboard!();
        await copyPromise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('cleans up timeout on unmount', async () => {
      const { result, unmount } = renderHook(() => useClipboardCopy());

      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test');
      });

      // Unmount before timeout completes
      unmount();

      // Advance past timeout - should not throw
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Test passes if no error thrown
    });

    it('clears previous timeout on new copy', async () => {
      const { result } = renderHook(() => useClipboardCopy());

      // First copy
      await act(async () => {
        await result.current.copyToClipboard('progressive', 'Test 1');
      });

      // Advance 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Second copy (should clear first timeout)
      await act(async () => {
        await result.current.copyToClipboard('travelers', 'Test 2');
      });

      expect(result.current.copiedCarrier).toBe('travelers');

      // Advance 1.5 seconds (would be past first timeout)
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      // Should still be travelers (first timeout was cleared)
      expect(result.current.copiedCarrier).toBe('travelers');

      // Advance another 0.5 seconds (past second timeout)
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.copiedCarrier).toBeNull();
    });
  });

  describe('fallback mechanism', () => {
    it('uses fallback when clipboard API is not available', async () => {
      // Remove clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock execCommand
      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const { result } = renderHook(() => useClipboardCopy());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(success).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
    });

    it('handles fallback failure', async () => {
      // Remove clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock execCommand to fail
      document.execCommand = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => useClipboardCopy());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.copyToClipboard('progressive', 'Test data');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });
});
