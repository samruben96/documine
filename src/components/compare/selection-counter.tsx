'use client';

import { cn } from '@/lib/utils';

interface SelectionCounterProps {
  selected: number;
  max: number;
  min: number;
}

/**
 * Selection Counter Component
 *
 * Story 7.1: AC-7.1.3 - Selection count display
 * Displays "X of 4 selected" with visual feedback.
 */
export function SelectionCounter({ selected, max, min }: SelectionCounterProps) {
  const isValid = selected >= min && selected <= max;
  const isEmpty = selected === 0;
  const isMaxed = selected >= max;

  return (
    <div className="flex items-center gap-3">
      {/* Counter Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          isEmpty && 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          !isEmpty && !isMaxed && 'bg-blue-100 text-primary dark:bg-blue-900/50 dark:text-blue-300',
          isMaxed && 'bg-blue-100 text-primary dark:bg-blue-900/50 dark:text-blue-300'
        )}
      >
        <span className="font-semibold">{selected}</span>
        <span className="text-slate-400 dark:text-slate-500">/</span>
        <span>{max}</span>
        <span className="hidden sm:inline">selected</span>
      </div>

      {/* Helper Text */}
      {selected === 0 && (
        <p className="text-sm text-slate-500 hidden sm:block">
          Select at least {min} documents to compare
        </p>
      )}
      {selected === 1 && (
        <p className="text-sm text-slate-500 hidden sm:block">
          Select {min - selected} more to compare
        </p>
      )}
      {isMaxed && (
        <p className="text-sm text-blue-600 dark:text-blue-400 hidden sm:block">
          Maximum reached
        </p>
      )}
    </div>
  );
}
