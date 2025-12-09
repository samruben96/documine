/**
 * AI Disclosure Banner Component
 * Story 19.4: AI Disclosure Message
 *
 * AC-19.4.4: Display disclosure prominently (banner at top of chat)
 * AC-19.4.5: Non-dismissible (no close button)
 * AC-19.4.8: WCAG 2.1 AA accessibility requirements
 */

'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIDisclosureBannerProps {
  /** The disclosure message to display */
  message: string;
  /** Additional class names */
  className?: string;
}

/**
 * AI Disclosure Banner Component
 *
 * Displays a non-dismissible banner at the top of the AI Buddy chat interface
 * informing users that they are interacting with an AI assistant.
 *
 * Design specifications (from tech spec):
 * - Fixed position at top of chat area (below header)
 * - Background: Subtle blue/info color (bg-blue-50 light / bg-blue-900/20 dark)
 * - Icon: Info icon
 * - Text: User's configured message
 * - Font: Same as chat UI, slightly smaller (text-sm)
 * - NO close button - always visible (AC-19.4.5)
 *
 * Accessibility (AC-19.4.8):
 * - role="status" for live region announcement
 * - aria-live="polite" for screen reader updates
 * - Color contrast meets WCAG AA (4.5:1 for normal text)
 * - Readable by screen readers
 *
 * @example
 * ```tsx
 * <AIDisclosureBanner
 *   message="You are chatting with AI Buddy, an AI assistant."
 * />
 * ```
 */
export function AIDisclosureBanner({
  message,
  className,
}: AIDisclosureBannerProps) {
  // AC-19.4.6: Don't render if message is empty/null
  if (!message || message.trim() === '') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI Assistant Disclosure"
      className={cn(
        // Layout
        'flex items-start gap-3 p-3',
        // Colors - subtle blue/info (WCAG AA compliant)
        // Light mode: blue-50 bg with blue-800 text for 7:1 contrast ratio
        // Dark mode: blue-900/20 bg with blue-100 text for high contrast
        'bg-blue-50 dark:bg-blue-900/20',
        'border-b border-blue-100 dark:border-blue-800/30',
        // Prevent user from hiding/dismissing
        'select-none',
        className
      )}
      data-testid="ai-disclosure-banner"
    >
      {/* Info icon - decorative (aria-hidden) */}
      <Info
        className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400"
        aria-hidden="true"
      />

      {/* Disclosure message */}
      <p
        className={cn(
          'text-sm leading-relaxed',
          // Text color with high contrast for accessibility
          'text-blue-800 dark:text-blue-100'
        )}
      >
        {message}
      </p>
    </div>
  );
}

/**
 * Export for re-use in admin preview and layout
 */
export default AIDisclosureBanner;
