/**
 * @vitest-environment happy-dom
 */
/**
 * Auto-Save Hook Tests
 * Story Q3.2: Auto-Save Implementation
 *
 * Tests for useAutoSave hook covering:
 * - AC-Q3.2-1: Debounced saves on field changes
 * - AC-Q3.2-5: 500ms debounce with 2s maxWait
 * - AC-Q3.2-6: Non-blocking saves
 * - AC-Q3.2-7: Retry merges pending changes
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '@/hooks/quoting/use-auto-save';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { updatedAt: new Date().toISOString() }, error: null }),
    });
  });

  describe('Initial State', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useAutoSave('session-123'));

      expect(result.current.saveState).toBe('idle');
      expect(result.current.hasPendingChanges).toBe(false);
      expect(result.current.failureCount).toBe(0);
      expect(result.current.isOffline).toBe(false);
    });

    it('should not save without sessionId', async () => {
      const { result } = renderHook(() => useAutoSave(undefined));

      await act(async () => {
        result.current.queueSave({ personal: { firstName: 'John' } });
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('AC-Q3.2-1: Debounced Saves', () => {
    it('should debounce saves with 500ms delay', async () => {
      const { result } = renderHook(() => useAutoSave('session-123'));

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      // Should not save immediately
      expect(mockFetch).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('AC-Q3.2-7: Pending Changes Merge', () => {
    it('should merge pending changes before save', async () => {
      const { result } = renderHook(() => useAutoSave('session-123'));

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
        result.current.queueSave({ personal: { lastName: 'Doe' } });
        result.current.queueSave({ property: { yearBuilt: 2000 } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        personal: { firstName: 'John', lastName: 'Doe' },
        property: { yearBuilt: 2000 },
      });
    });
  });

  describe('Save States', () => {
    it('should transition to saved state after successful save', async () => {
      const { result } = renderHook(() => useAutoSave('session-123'));

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      await waitFor(() => {
        expect(result.current.saveState).toBe('saved');
      });
    });
  });

  describe('Error Handling', () => {
    it('should transition to error state on save failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAutoSave('session-123', {
          maxRetries: 1, // Only 1 retry to speed up test
          retryBaseDelayMs: 10,
        })
      );

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
      });

      await waitFor(
        () => {
          expect(result.current.saveState).toBe('error');
        },
        { timeout: 2000 }
      );
    });

    it('should increment failure count on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useAutoSave('session-123', { maxRetries: 1, retryBaseDelayMs: 10 })
      );

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
      });

      await waitFor(
        () => {
          expect(result.current.failureCount).toBeGreaterThan(0);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Force Save', () => {
    it('should immediately save when saveNow is called', async () => {
      const { result } = renderHook(() => useAutoSave('session-123'));

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      expect(mockFetch).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clear Pending', () => {
    it('should clear pending changes without saving', async () => {
      const { result } = renderHook(() => useAutoSave('session-123'));

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      act(() => {
        result.current.clearPending();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 700));
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.saveState).toBe('idle');
    });
  });

  describe('Callbacks', () => {
    it('should call onSaveSuccess with updatedAt', async () => {
      const onSaveSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAutoSave('session-123', { onSaveSuccess })
      );

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it('should call onSaveError on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const onSaveError = vi.fn();
      const { result } = renderHook(() =>
        useAutoSave('session-123', {
          maxRetries: 1,
          retryBaseDelayMs: 10,
          onSaveError,
        })
      );

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
      });

      await waitFor(
        () => {
          expect(onSaveError).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Manual Retry', () => {
    it('should allow manual retry after failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { updatedAt: new Date().toISOString() }, error: null }),
        });

      const { result } = renderHook(() =>
        useAutoSave('session-123', { maxRetries: 1, retryBaseDelayMs: 10 })
      );

      act(() => {
        result.current.queueSave({ personal: { firstName: 'John' } });
      });

      // Wait for failure
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
      });

      await waitFor(
        () => {
          expect(result.current.saveState).toBe('error');
        },
        { timeout: 2000 }
      );

      // Manual retry
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.saveState).toBe('saved');
      });
    });
  });
});
