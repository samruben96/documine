/**
 * Quote Session Context
 * Story Q3.1: Data Capture Forms
 *
 * Provides quote session data and update functions to tab components.
 * Tab components consume this context to read and update client data.
 */

'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
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

export interface QuoteSessionContextValue {
  /** The current session */
  session: QuoteSession | null;
  /** Loading state */
  isLoading: boolean;
  /** Saving state */
  isSaving: boolean;
  /** Error state */
  error: Error | null;
  /** Update personal info */
  updatePersonalInfo: (data: Partial<PersonalInfo>) => Promise<void>;
  /** Update property info */
  updatePropertyInfo: (data: Partial<PropertyInfo>) => Promise<void>;
  /** Update auto info (vehicles, drivers, coverage) */
  updateAutoInfo: (data: Partial<AutoInfo>) => Promise<void>;
  /** Update full client data (batch) */
  updateClientData: (data: Partial<QuoteClientData>) => Promise<void>;
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
 * Wraps tab components to provide session data and update functions.
 */
export function QuoteSessionProvider({
  children,
  session: initialSession,
  isLoading: initialLoading = false,
  onRefresh,
}: QuoteSessionProviderProps) {
  const [session, setSession] = useState<QuoteSession | null>(initialSession);
  const [isLoading] = useState(initialLoading);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Sync session state when prop changes
  useEffect(() => {
    if (initialSession !== null) {
      setSession(initialSession);
    }
  }, [initialSession]);

  /**
   * Send PATCH request to update client data
   */
  const patchClientData = useCallback(
    async (data: Partial<QuoteClientData>): Promise<void> => {
      if (!session?.id) {
        throw new Error('No session to update');
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/quoting/${session.id}/client-data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? 'Failed to save changes');
        }

        // Optimistically update local state
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            clientData: deepMerge(prev.clientData, data),
            updatedAt: result.data?.updatedAt ?? new Date().toISOString(),
          };
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to save changes');
        setError(error);
        toast.error(error.message);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [session?.id]
  );

  /**
   * Update personal info section
   */
  const updatePersonalInfo = useCallback(
    async (data: Partial<PersonalInfo>): Promise<void> => {
      await patchClientData({ personal: data });
    },
    [patchClientData]
  );

  /**
   * Update property info section
   */
  const updatePropertyInfo = useCallback(
    async (data: Partial<PropertyInfo>): Promise<void> => {
      await patchClientData({ property: data });
    },
    [patchClientData]
  );

  /**
   * Update auto info section
   */
  const updateAutoInfo = useCallback(
    async (data: Partial<AutoInfo>): Promise<void> => {
      await patchClientData({ auto: data });
    },
    [patchClientData]
  );

  /**
   * Update full client data
   */
  const updateClientData = useCallback(
    async (data: Partial<QuoteClientData>): Promise<void> => {
      await patchClientData(data);
    },
    [patchClientData]
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
        isSaving,
        error,
        updatePersonalInfo,
        updatePropertyInfo,
        updateAutoInfo,
        updateClientData,
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
 * Deep merge utility for JSONB updates
 */
function deepMerge(
  target: QuoteClientData | undefined,
  source: Partial<QuoteClientData>
): QuoteClientData {
  const result: QuoteClientData = { ...target };

  for (const key of Object.keys(source) as (keyof QuoteClientData)[]) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge nested objects (personal, property, auto)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = {
        ...targetValue,
        ...sourceValue,
      };
    } else if (sourceValue !== undefined) {
      // Direct assignment for arrays, primitives, and nulls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}
