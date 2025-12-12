/**
 * Auto-Save Hook
 * Story Q3.2: Auto-Save Implementation
 *
 * AC-Q3.2-1: Auto-save on field blur with 500ms debounce
 * AC-Q3.2-2: "Saving..." indicator when save in progress
 * AC-Q3.2-3: "Saved" indicator that auto-dismisses after 2 seconds
 * AC-Q3.2-4: Error toast with "Save failed - click to retry"
 * AC-Q3.2-5: 500ms debounce with 2s maxWait
 * AC-Q3.2-6: Non-blocking saves - user can continue editing
 * AC-Q3.2-7: Failed save retry merges pending changes into single request
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { QuoteClientData } from '@/types/quoting';

/**
 * Save state machine
 * idle → saving → saved → idle
 *         ↓
 *       error → retry → saving
 */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions {
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Max wait before forcing save (default: 2000) */
  maxWaitMs?: number;
  /** Duration to show "Saved" state (default: 2000) */
  savedDurationMs?: number;
  /** Max retry attempts before showing persistent error (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff (default: 1000) */
  retryBaseDelayMs?: number;
  /** Callback on successful save */
  onSaveSuccess?: (updatedAt: string) => void;
  /** Callback on save error */
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  /** Current save state */
  saveState: SaveState;
  /** Whether any changes are pending */
  hasPendingChanges: boolean;
  /** Count of consecutive failures */
  failureCount: number;
  /** Whether currently offline */
  isOffline: boolean;
  /** Queue a change to be saved (debounced) */
  queueSave: (data: Partial<QuoteClientData>) => void;
  /** Force immediate save of pending changes */
  saveNow: () => Promise<void>;
  /** Retry failed save */
  retry: () => Promise<void>;
  /** Clear pending changes without saving */
  clearPending: () => void;
}

/**
 * Type guard to check if value is a non-null, non-array object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Deep merge utility for pending changes
 * Merges nested objects (personal, property, auto sections), replaces arrays
 *
 * Note: This function handles QuoteClientData which has a known structure:
 * - personal: PersonalInfo object
 * - property: PropertyInfo object
 * - auto: AutoInfo object
 *
 * Each section is shallowly merged when both target and source have values.
 */
function deepMergePending(
  target: Partial<QuoteClientData>,
  source: Partial<QuoteClientData>
): Partial<QuoteClientData> {
  const result: Partial<QuoteClientData> = { ...target };

  // Type-safe iteration over known keys
  const keys: (keyof QuoteClientData)[] = ['personal', 'property', 'auto'];

  for (const key of keys) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      // Source doesn't have this key, keep target value
      continue;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      // Both are objects - shallow merge the section
      // This correctly merges { personal: { firstName: 'John' } } with
      // { personal: { lastName: 'Doe' } } into { personal: { firstName: 'John', lastName: 'Doe' } }
      result[key] = {
        ...targetValue,
        ...sourceValue,
      } as QuoteClientData[typeof key];
    } else {
      // Direct assignment: source value replaces target (arrays, primitives, null)
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Auto-save hook with debounce, retry, and offline support
 *
 * @param sessionId - Quote session ID to save to
 * @param options - Configuration options
 */
export function useAutoSave(
  sessionId: string | undefined,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    debounceMs = 500,
    maxWaitMs = 2000,
    savedDurationMs = 2000,
    maxRetries = 3,
    retryBaseDelayMs = 1000,
    onSaveSuccess,
    onSaveError,
  } = options;

  // State
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isOffline, setIsOffline] = useState(false);
  const [failureCount, setFailureCount] = useState(0);

  // Refs for pending changes and abort controller
  const pendingChangesRef = useRef<Partial<QuoteClientData>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check if pending changes exist
   */
  const hasPendingChanges = Object.keys(pendingChangesRef.current).length > 0;

  /**
   * Monitor online/offline status
   * AC-Q3.2-15: Queue changes when offline, sync on reconnect
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-sync pending changes when back online
      if (Object.keys(pendingChangesRef.current).length > 0) {
        performSave();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Cleanup on unmount
   *
   * Handles proper cleanup of:
   * - Saved state timeout (prevents memory leaks)
   * - Retry timeout (prevents orphaned retries)
   * - In-flight fetch requests via AbortController (prevents:
   *   1. Memory leaks from pending promises
   *   2. State updates on unmounted components
   *   3. Race conditions if component remounts quickly)
   *
   * This ensures tab components can safely unmount without causing
   * "Can't perform a React state update on an unmounted component" warnings.
   */
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Perform the actual save operation
   * AC-Q3.2-13: Partial updates only send changed data
   */
  const performSave = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      console.warn('useAutoSave: No sessionId provided');
      return;
    }

    const dataToSave = { ...pendingChangesRef.current };

    if (Object.keys(dataToSave).length === 0) {
      return;
    }

    // Don't save if offline - changes are queued
    if (isOffline) {
      return;
    }

    // Cancel any in-progress request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Clear saved timeout if transitioning from saved
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }

    // AC-Q3.2-2: Show "Saving..." indicator
    setSaveState('saving');

    try {
      const response = await fetch(`/api/quoting/${sessionId}/client-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? 'Failed to save changes');
      }

      // Success: clear pending changes and reset failure count
      pendingChangesRef.current = {};
      setFailureCount(0);

      // AC-Q3.2-3: Show "Saved" indicator
      setSaveState('saved');

      // Callback
      if (onSaveSuccess && result.data?.updatedAt) {
        onSaveSuccess(result.data.updatedAt);
      }

      // AC-Q3.2-3: Auto-dismiss after 2 seconds
      savedTimeoutRef.current = setTimeout(() => {
        setSaveState('idle');
        savedTimeoutRef.current = null;
      }, savedDurationMs);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorObj = error instanceof Error ? error : new Error('Save failed');

      // Increment failure count
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);

      // AC-Q3.2-14: After 3 consecutive failures, show persistent error
      if (newFailureCount >= maxRetries) {
        setSaveState('error');
        if (onSaveError) {
          onSaveError(errorObj);
        }
      } else {
        // Exponential backoff retry
        const delay = retryBaseDelayMs * Math.pow(2, newFailureCount - 1);
        retryTimeoutRef.current = setTimeout(() => {
          performSave();
        }, delay);
        // Stay in saving state during retry
      }
    }
  }, [
    sessionId,
    isOffline,
    failureCount,
    maxRetries,
    savedDurationMs,
    retryBaseDelayMs,
    onSaveSuccess,
    onSaveError,
  ]);

  /**
   * Debounced save function
   * AC-Q3.2-1, AC-Q3.2-5: 500ms debounce with 2s maxWait
   */
  const debouncedSave = useDebouncedCallback(performSave, debounceMs, {
    maxWait: maxWaitMs,
  });

  /**
   * Queue changes to be saved
   * AC-Q3.2-7: Merge pending changes for batch save
   */
  const queueSave = useCallback(
    (data: Partial<QuoteClientData>) => {
      // Merge new data with pending changes
      pendingChangesRef.current = deepMergePending(
        pendingChangesRef.current,
        data
      );

      // Trigger debounced save
      debouncedSave();
    },
    [debouncedSave]
  );

  /**
   * Force immediate save
   */
  const saveNow = useCallback(async (): Promise<void> => {
    debouncedSave.cancel();
    await performSave();
  }, [debouncedSave, performSave]);

  /**
   * Retry failed save
   * AC-Q3.2-7: Retry merges all pending changes
   */
  const retry = useCallback(async (): Promise<void> => {
    // Clear retry timeout if any
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Reset failure count for manual retry
    setFailureCount(0);
    await performSave();
  }, [performSave]);

  /**
   * Clear pending changes without saving
   */
  const clearPending = useCallback(() => {
    debouncedSave.cancel();
    pendingChangesRef.current = {};
    setFailureCount(0);
    setSaveState('idle');
  }, [debouncedSave]);

  return {
    saveState,
    hasPendingChanges,
    failureCount,
    isOffline,
    queueSave,
    saveNow,
    retry,
    clearPending,
  };
}
