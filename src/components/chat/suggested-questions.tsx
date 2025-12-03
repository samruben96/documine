'use client';

import { cn } from '@/lib/utils';

const DEFAULT_SUGGESTIONS = [
  "What's the coverage limit?",
  "Are there any exclusions?",
  "What's the deductible?",
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  className?: string;
  suggestions?: string[];
  'data-testid'?: string;
}

/**
 * Suggested Questions Component
 *
 * Implements AC-5.2.5: Empty conversations show 3 suggested questions as clickable chips
 * Implements AC-5.2.6: Clicking a suggested question fills the input field
 *
 * Styling per UX spec:
 * - Pill shape buttons with subtle border
 * - Trustworthy Slate theme
 * - Hover state with darker border
 */
export function SuggestedQuestions({
  onSelect,
  className,
  suggestions = DEFAULT_SUGGESTIONS,
  'data-testid': testId,
}: SuggestedQuestionsProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)} data-testid={testId}>
      <p className="text-sm text-slate-500">Try asking:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className={cn(
              // Base styles - pill shape
              'px-4 py-2 rounded-full',
              'text-sm font-normal',
              // Trustworthy Slate theme
              'bg-white text-slate-600',
              'border border-slate-200',
              // Hover state
              'hover:border-slate-400 hover:bg-slate-50',
              // Focus state for accessibility
              'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
              // Transition
              'transition-all duration-150 ease-in-out',
              // Touch target - minimum 44px height
              'min-h-[44px]'
            )}
            aria-label={`Ask: ${question}`}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
