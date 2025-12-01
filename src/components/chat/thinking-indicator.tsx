'use client';

import { cn } from '@/lib/utils';

interface ThinkingIndicatorProps {
  className?: string;
}

/**
 * Thinking Indicator Component
 *
 * Implements AC-5.2.8: "Thinking..." indicator with animated dots appears while waiting for response
 * - Appears in assistant message bubble position (left-aligned)
 * - Animation: 3 dots with fade/pulse effect
 * - Uses CSS animations for performance
 */
export function ThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div
      className={cn('flex justify-start', className)}
      role="status"
      aria-label="Assistant is thinking"
    >
      <div className="bg-slate-100 rounded-lg px-4 py-3 flex items-center gap-1">
        <span className="text-sm text-slate-600 mr-1">Thinking</span>
        <span
          className="inline-block w-1.5 h-1.5 bg-slate-500 rounded-full animate-thinking-dot"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="inline-block w-1.5 h-1.5 bg-slate-500 rounded-full animate-thinking-dot"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="inline-block w-1.5 h-1.5 bg-slate-500 rounded-full animate-thinking-dot"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </div>
  );
}
