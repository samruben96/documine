'use client';

/**
 * PromptInput Component
 * Epic 23: Flexible AI Reports
 * Story 23.3: Prompt Input UI
 *
 * Multi-line text input for optional report description.
 * AC-23.3.1: Text input field for optional report description with multi-line support
 * AC-23.3.2: Placeholder text explains auto-analysis option
 */

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const DEFAULT_PLACEHOLDER =
  'Describe the report you want, or leave blank for AI to analyze your data automatically...\n\nExamples:\n• "Show me monthly trends"\n• "Compare totals by category"\n• "Find the top 10 items by value"';

const DEFAULT_MAX_LENGTH = 500;

export function PromptInput({
  value,
  onChange,
  disabled = false,
  placeholder = DEFAULT_PLACEHOLDER,
  maxLength = DEFAULT_MAX_LENGTH,
  className,
}: PromptInputProps) {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          'min-h-[100px] resize-none',
          disabled && 'bg-slate-50 cursor-not-allowed',
          className
        )}
        aria-label="Report description (optional)"
        aria-describedby="prompt-char-count"
      />
      <div
        id="prompt-char-count"
        className={cn(
          'text-xs text-right transition-colors',
          isOverLimit
            ? 'text-red-500'
            : isNearLimit
              ? 'text-amber-500'
              : 'text-slate-400'
        )}
        role="status"
        aria-live="polite"
      >
        {charCount} / {maxLength} characters
      </div>
    </div>
  );
}
