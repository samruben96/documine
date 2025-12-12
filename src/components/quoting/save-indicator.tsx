/**
 * Save Indicator Component
 * Story Q3.2: Auto-Save Implementation
 *
 * AC-Q3.2-2: "Saving..." indicator with loading spinner
 * AC-Q3.2-3: "Saved" indicator with checkmark (auto-dismiss handled by hook)
 * AC-Q3.2-4: Error state with retry button
 */

'use client';

import { Loader2, Check, AlertCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SaveState } from '@/hooks/quoting/use-auto-save';

export interface SaveIndicatorProps {
  /** Current save state */
  state: SaveState;
  /** Whether offline */
  isOffline?: boolean;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Visual indicator for auto-save state
 *
 * Displays:
 * - "Saving..." with spinner when saving
 * - "Saved" with checkmark on success
 * - "Save failed" with retry button on error
 * - "Offline" indicator when connection lost
 */
export function SaveIndicator({
  state,
  isOffline = false,
  onRetry,
  className,
}: SaveIndicatorProps) {
  // Show offline indicator if offline, regardless of save state
  if (isOffline) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          'text-sm font-medium',
          'transition-all duration-200 animate-in fade-in-0 zoom-in-95',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <WifiOff className="h-4 w-4" />
        <span>Offline - changes queued</span>
      </div>
    );
  }

  // Don't render anything in idle state
  if (state === 'idle') {
    return null;
  }

  // AC-Q3.2-2: Saving state with spinner
  if (state === 'saving') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          'text-sm font-medium',
          'transition-all duration-200 animate-in fade-in-0 zoom-in-95',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  // AC-Q3.2-3: Saved state with checkmark
  if (state === 'saved') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          'text-sm font-medium',
          'transition-all duration-200 animate-in fade-in-0 zoom-in-95',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Check className="h-4 w-4" />
        <span>Saved</span>
      </div>
    );
  }

  // AC-Q3.2-4: Error state with retry button
  if (state === 'error') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          'text-sm font-medium',
          'transition-all duration-200 animate-in fade-in-0 zoom-in-95',
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="h-4 w-4" />
        <span>Save failed</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-0.5 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return null;
}
