'use client';

/**
 * SuggestedPrompts Component
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * Clickable chips showing AI-suggested prompts from analysis.
 * AC-23.3.3: Suggested prompts from analysis API are clickable chips that populate the input
 */

import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SuggestedPrompts({
  prompts,
  onSelect,
  disabled = false,
  className,
}: SuggestedPromptsProps) {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        <span id="suggested-prompts-label">AI Suggestions:</span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested prompts">
        {prompts.map((prompt, index) => (
          <button
            key={`${prompt}-${index}`}
            type="button"
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className={cn(
              // AC-23.8.4: Mobile touch targets min 44px height
              'inline-flex items-center px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium min-h-[44px] sm:min-h-0',
              'bg-blue-50 text-blue-700 border border-blue-200',
              'transition-all duration-150',
              'hover:bg-blue-100 hover:border-blue-300 hover:scale-[1.02]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'active:scale-[0.98]',
              disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
            aria-label={`Use suggestion: ${prompt}`}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
