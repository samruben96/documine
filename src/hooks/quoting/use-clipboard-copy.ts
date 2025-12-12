/**
 * Clipboard Copy Hook
 * Story Q4.1: Copy Button & Carrier Formatters
 *
 * AC-Q4.1-3: Button shows "Copied" with green check for 2 seconds
 * AC-Q4.1-4: Button resets to default state after 2 seconds
 * AC-Q4.1-6: Error state with "Failed - Click to retry"
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Result of the clipboard copy hook
 */
export interface UseClipboardCopyResult {
  /** Copy text to clipboard for a carrier */
  copyToClipboard: (carrier: string, text: string) => Promise<boolean>;
  /** Currently copied carrier (null if none) */
  copiedCarrier: string | null;
  /** Error from last copy attempt */
  error: Error | null;
  /** Whether a copy operation is in progress */
  isLoading: boolean;
  /** Reset error state to allow retry */
  resetError: () => void;
}

/**
 * Fallback copy method using deprecated execCommand
 * Used for older browsers that don't support navigator.clipboard
 */
async function fallbackCopyTextToClipboard(text: string): Promise<void> {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Avoid scrolling to bottom
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Hook for copying text to clipboard with carrier tracking
 *
 * @returns Clipboard copy utilities
 *
 * @example
 * ```tsx
 * const { copyToClipboard, copiedCarrier, error, isLoading } = useClipboardCopy();
 *
 * const handleCopy = async () => {
 *   const success = await copyToClipboard('progressive', formattedText);
 *   if (success) {
 *     toast.success('Copied to clipboard!');
 *   }
 * };
 * ```
 */
export function useClipboardCopy(): UseClipboardCopyResult {
  const [copiedCarrier, setCopiedCarrier] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timeout ref for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Copy text to clipboard
   * AC-Q4.1-3: Success shows carrier as copied for 2 seconds
   * AC-Q4.1-4: Resets after 2 seconds
   * AC-Q4.1-6: Error handling with retry support
   */
  const copyToClipboard = useCallback(
    async (carrier: string, text: string): Promise<boolean> => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Reset states
      setError(null);
      setIsLoading(true);
      setCopiedCarrier(null);

      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback to execCommand
          await fallbackCopyTextToClipboard(text);
        }

        // Success - set copied carrier
        setCopiedCarrier(carrier);
        setIsLoading(false);

        // Reset after 2 seconds (AC-Q4.1-4)
        timeoutRef.current = setTimeout(() => {
          setCopiedCarrier(null);
          timeoutRef.current = null;
        }, 2000);

        return true;
      } catch (err) {
        // Handle error (AC-Q4.1-6)
        const errorObj = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(errorObj);
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  /**
   * Reset error state to allow retry
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    copyToClipboard,
    copiedCarrier,
    error,
    isLoading,
    resetError,
  };
}
