/**
 * AI Disclosure Hook
 * Story 19.4: AI Disclosure Message
 *
 * Client-side hook for fetching the AI disclosure message.
 * Used by the AI Buddy layout to display the disclosure banner.
 *
 * AC-19.4.4: Load disclosure message for display in chat
 * AC-19.4.6: Handle when no disclosure is configured
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DisclosureState {
  /** The disclosure message (null if not configured) */
  message: string | null;
  /** Whether disclosure is enabled */
  enabled: boolean;
  /** Whether the hook is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
}

interface UseDisclosureReturn extends DisclosureState {
  /** Refetch the disclosure */
  refetch: () => Promise<void>;
}

interface DisclosureApiResponse {
  data?: {
    aiDisclosureMessage: string | null;
    aiDisclosureEnabled: boolean;
  };
  error?: string;
}

/**
 * Hook for fetching AI disclosure message
 *
 * Fetches the agency's AI disclosure configuration and returns
 * the message and enabled state for display in the chat UI.
 *
 * @example
 * ```tsx
 * const { message, enabled, isLoading } = useDisclosure();
 *
 * if (enabled && message) {
 *   return <AIDisclosureBanner message={message} />;
 * }
 * ```
 */
export function useDisclosure(): UseDisclosureReturn {
  const [state, setState] = useState<DisclosureState>({
    message: null,
    enabled: false,
    isLoading: true,
    error: null,
  });

  const hasFetchedRef = useRef(false);

  const fetchDisclosure = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/ai-buddy/disclosure');

      if (!response.ok) {
        // Non-admin users will get 403 - this is expected
        // Just return default state (no disclosure shown)
        if (response.status === 403 || response.status === 401) {
          // Try the public endpoint instead
          const publicResponse = await fetch('/api/ai-buddy/disclosure/public');
          if (!publicResponse.ok) {
            setState({
              message: null,
              enabled: false,
              isLoading: false,
              error: null,
            });
            return;
          }
          const publicResult: DisclosureApiResponse = await publicResponse.json();
          setState({
            message: publicResult.data?.aiDisclosureMessage ?? null,
            enabled: publicResult.data?.aiDisclosureEnabled ?? false,
            isLoading: false,
            error: null,
          });
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Failed to fetch disclosure: ${response.status}`);
      }

      const result: DisclosureApiResponse = await response.json();

      setState({
        message: result.data?.aiDisclosureMessage ?? null,
        enabled: result.data?.aiDisclosureEnabled ?? false,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch disclosure';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDisclosure();
    }
  }, [fetchDisclosure]);

  return {
    ...state,
    refetch: fetchDisclosure,
  };
}
