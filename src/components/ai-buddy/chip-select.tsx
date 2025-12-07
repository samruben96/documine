/**
 * Chip Select Component
 * Story 14.5: Component Scaffolding
 *
 * Multi-select chips for preferences (carriers, communication styles, etc.).
 * Stub implementation - full functionality in Epic 18.
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipOption {
  value: string;
  label: string;
}

export interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  onChange?: (selected: string[]) => void;
  multiple?: boolean;
  className?: string;
}

export function ChipSelect({
  options,
  selected,
  onChange,
  multiple = true,
  className,
}: ChipSelectProps) {
  const handleClick = (value: string) => {
    if (!onChange) return;

    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange([value]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
              isSelected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                : 'bg-[var(--chat-surface)] text-[var(--text-primary)] border border-[var(--chat-border)] hover:bg-[var(--sidebar-hover)]'
            )}
          >
            {isSelected && <Check className="h-3 w-3" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
