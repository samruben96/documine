/**
 * Chip Select Component
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * Multi-select chip grid for selecting lines of business and carriers.
 *
 * AC-18.1.3: Chip selection grid with multi-select support
 * AC-18.1.4: Visual feedback for selected state
 */

'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface ChipSelectProps {
  /** Available options to select from */
  options: readonly string[];
  /** Currently selected values */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Minimum number of selections required */
  minSelection?: number;
  /** Label for the chip group */
  label?: string;
  /** Additional className */
  className?: string;
  /** Show Select All / Clear All button */
  showSelectAll?: boolean;
}

/**
 * Multi-select chip grid component
 *
 * @example
 * ```tsx
 * <ChipSelect
 *   options={LINES_OF_BUSINESS}
 *   selected={selectedLobs}
 *   onChange={setSelectedLobs}
 *   minSelection={1}
 *   label="Select your lines of business"
 * />
 * ```
 */
export function ChipSelect({
  options,
  selected,
  onChange,
  minSelection = 0,
  label,
  className,
  showSelectAll = false,
}: ChipSelectProps) {
  const handleToggle = (option: string) => {
    const isSelected = selected.includes(option);

    if (isSelected) {
      // Don't allow deselecting if it would go below minimum
      if (selected.length <= minSelection) {
        return;
      }
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectionCount = selected.length;
  const isMinimumMet = selectionCount >= minSelection;
  const allSelected = selectionCount === options.length;

  return (
    <div className={cn('space-y-3', className)} data-testid="chip-select">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
          <div className="flex items-center gap-3">
            {showSelectAll && (
              <button
                type="button"
                onClick={allSelected ? handleClearAll : handleSelectAll}
                className="text-xs text-primary hover:underline"
                data-testid="select-all-btn"
              >
                {allSelected ? 'Clear All' : 'Select All'}
              </button>
            )}
            {minSelection > 0 && (
              <span
                className={cn(
                  'text-xs',
                  isMinimumMet ? 'text-muted-foreground' : 'text-destructive'
                )}
                data-testid="selection-count"
              >
                {selectionCount} selected
                {!isMinimumMet && ` (min ${minSelection})`}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={label || 'Select options'}
        data-testid="chip-grid"
      >
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                'border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                  : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
              )}
              data-testid={`chip-${option.replace(/\s+/g, '-').toLowerCase()}`}
              data-selected={isSelected}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {option}
            </button>
          );
        })}
      </div>

      {!isMinimumMet && minSelection > 0 && (
        <p
          className="text-xs text-destructive"
          role="alert"
          data-testid="min-selection-warning"
        >
          Please select at least {minSelection} option{minSelection > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
}
