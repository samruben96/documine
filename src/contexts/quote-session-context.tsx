/**
 * Quote Session Context
 * Story Q3.1: Data Capture Forms
 * Story Q3.2: Auto-Save Implementation
 *
 * Provides quote session data and auto-save functions to tab components.
 * Tab components consume this context to read and update client data.
 *
 * AC-Q3.2-1: Auto-save on field blur with 500ms debounce
 * AC-Q3.2-2: "Saving..." indicator when save in progress
 * AC-Q3.2-3: "Saved" indicator that auto-dismisses after 2 seconds
 * AC-Q3.2-4: Error state with retry button
 * AC-Q3.2-6: Non-blocking saves - user can continue editing
 */

'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type {
  QuoteSession,
  QuoteClientData,
  PersonalInfo,
  PropertyInfo,
  AutoInfo,
} from '@/types/quoting';
import { useAutoSave, type SaveState } from '@/hooks/quoting/use-auto-save';

export interface QuoteSessionContextValue {
  /** The current session */
  session: QuoteSession | null;
  /** Loading state */
  isLoading: boolean;
  /** Current save state (idle, saving, saved, error) */
  saveState: SaveState;
  /** Legacy isSaving for backwards compatibility */
  isSaving: boolean;
  /** Whether currently offline */
  isOffline: boolean;
  /** Consecutive failure count */
  failureCount: number;
  /** Error state */
  error: Error | null;
  /** Update personal info (auto-saves via debounce) */
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  /** Update property info (auto-saves via debounce) */
  updatePropertyInfo: (data: Partial<PropertyInfo>) => void;
  /** Update auto info (vehicles, drivers, coverage) */
  updateAutoInfo: (data: Partial<AutoInfo>) => void;
  /** Update full client data (batch) */
  updateClientData: (data: Partial<QuoteClientData>) => void;
  /** Force immediate save of pending changes */
  saveNow: () => Promise<void>;
  /** Retry failed save */
  retry: () => Promise<void>;
  /** Refresh session from server */
  refresh: () => Promise<void>;
}

const QuoteSessionContext = createContext<QuoteSessionContextValue | null>(null);

export interface QuoteSessionProviderProps {
  children: ReactNode;
  /** Initial session data from parent */
  session: QuoteSession | null;
  /** Initial loading state */
  isLoading?: boolean;
  /** Callback to refresh session */
  onRefresh?: () => Promise<void>;
}

/**
 * Quote Session Provider
 *
 * Wraps tab components to provide session data and auto-save functions.
 * Integrates with useAutoSave hook for debounced saving with visual feedback.
 */
export function QuoteSessionProvider({
  children,
  session: initialSession,
  isLoading: initialLoading = false,
  onRefresh,
}: QuoteSessionProviderProps) {
  const [session, setSession] = useState<QuoteSession | null>(initialSession);
  const [isLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);

  // Track previous session ID to detect when parent provides a new session
  // Using ref-based tracking to avoid useEffect setState lint warning
  const prevSessionIdRef = useRef<string | undefined>(initialSession?.id);

  // Sync session when parent provides a genuinely new session (different ID)
  // This is the React-recommended pattern for adjusting state based on props
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (initialSession?.id !== prevSessionIdRef.current) {
    prevSessionIdRef.current = initialSession?.id;
    if (initialSession !== null) {
      setSession(initialSession);
    }
  }

  /**
   * Handle successful save - update local session state with new timestamp
   */
  const handleSaveSuccess = useCallback((updatedAt: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt,
      };
    });
  }, []);

  /**
   * Handle save error - show toast notification
   * AC-Q3.2-4: Error toast with "Save failed - click to retry"
   */
  const handleSaveError = useCallback((err: Error) => {
    setError(err);
    toast.error('Save failed - changes could not be saved', {
      description: 'Click retry to try again',
    });
  }, []);

  // Initialize auto-save hook
  // AC-Q3.2-1, AC-Q3.2-5: 500ms debounce with 2s maxWait
  const {
    saveState,
    isOffline,
    failureCount,
    queueSave,
    saveNow,
    retry,
  } = useAutoSave(session?.id, {
    debounceMs: 500,
    maxWaitMs: 2000,
    savedDurationMs: 2000,
    maxRetries: 3,
    onSaveSuccess: handleSaveSuccess,
    onSaveError: handleSaveError,
  });

  /**
   * Queue save with optimistic update
   * AC-Q3.2-6: Non-blocking - user can continue editing
   */
  const queueSaveWithOptimisticUpdate = useCallback(
    (data: Partial<QuoteClientData>) => {
      // Optimistically update local state
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          clientData: deepMerge(prev.clientData, data),
        };
      });

      // Queue for debounced save
      queueSave(data);
    },
    [queueSave]
  );

  /**
   * Update personal info section
   */
  const updatePersonalInfo = useCallback(
    (data: Partial<PersonalInfo>): void => {
      queueSaveWithOptimisticUpdate({ personal: data });
    },
    [queueSaveWithOptimisticUpdate]
  );

  /**
   * Update property info section
   */
  const updatePropertyInfo = useCallback(
    (data: Partial<PropertyInfo>): void => {
      queueSaveWithOptimisticUpdate({ property: data });
    },
    [queueSaveWithOptimisticUpdate]
  );

  /**
   * Update auto info section
   */
  const updateAutoInfo = useCallback(
    (data: Partial<AutoInfo>): void => {
      queueSaveWithOptimisticUpdate({ auto: data });
    },
    [queueSaveWithOptimisticUpdate]
  );

  /**
   * Update full client data
   */
  const updateClientData = useCallback(
    (data: Partial<QuoteClientData>): void => {
      queueSaveWithOptimisticUpdate(data);
    },
    [queueSaveWithOptimisticUpdate]
  );

  /**
   * Refresh session from server
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  return (
    <QuoteSessionContext.Provider
      value={{
        session,
        isLoading,
        saveState,
        isSaving: saveState === 'saving', // Backwards compatibility
        isOffline,
        failureCount,
        error,
        updatePersonalInfo,
        updatePropertyInfo,
        updateAutoInfo,
        updateClientData,
        saveNow,
        retry,
        refresh,
      }}
    >
      {children}
    </QuoteSessionContext.Provider>
  );
}

/**
 * Hook to access quote session context
 */
export function useQuoteSessionContext(): QuoteSessionContextValue {
  const context = useContext(QuoteSessionContext);
  if (!context) {
    throw new Error(
      'useQuoteSessionContext must be used within a QuoteSessionProvider'
    );
  }
  return context;
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
 * Deep merge utility for JSONB updates (optimistic updates)
 *
 * Merges source into target for QuoteClientData structure:
 * - personal: PersonalInfo object
 * - property: PropertyInfo object
 * - auto: AutoInfo object
 *
 * Each section is shallowly merged when both have values.
 */
function deepMerge(
  target: QuoteClientData | undefined,
  source: Partial<QuoteClientData>
): QuoteClientData {
  const result: QuoteClientData = { ...target };

  // Type-safe iteration over known keys
  const keys: (keyof QuoteClientData)[] = ['personal', 'property', 'auto'];

  for (const key of keys) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      // Both are objects - shallow merge the section
      result[key] = {
        ...targetValue,
        ...sourceValue,
      } as QuoteClientData[typeof key];
    } else {
      // Direct assignment for arrays, primitives, and null
      result[key] = sourceValue;
    }
  }

  return result;
}
