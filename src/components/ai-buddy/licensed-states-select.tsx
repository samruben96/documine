/**
 * Licensed States Select Component
 * Story 18.2: Preferences Management
 *
 * AC-18.2.6: Multi-select for US states with chip display
 */

'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { US_STATES } from '@/types/ai-buddy';

export interface LicensedStatesSelectProps {
  /** Currently selected state codes */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Multi-select combobox for US states
 *
 * @example
 * ```tsx
 * <LicensedStatesSelect
 *   selected={['CA', 'TX', 'NY']}
 *   onChange={setSelectedStates}
 * />
 * ```
 */
export function LicensedStatesSelect({
  selected,
  onChange,
  disabled = false,
  className,
}: LicensedStatesSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (stateValue: string) => {
    if (selected.includes(stateValue)) {
      onChange(selected.filter((s) => s !== stateValue));
    } else {
      onChange([...selected, stateValue]);
    }
  };

  const handleRemove = (stateValue: string) => {
    onChange(selected.filter((s) => s !== stateValue));
  };

  const getStateLabel = (value: string) => {
    return US_STATES.find((s) => s.value === value)?.label || value;
  };

  return (
    <div className={cn('space-y-3', className)} data-testid="licensed-states-select">
      <label className="text-sm font-medium text-foreground">
        Licensed States
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
            data-testid="states-trigger"
          >
            <span className="text-muted-foreground">
              {selected.length > 0
                ? `${selected.length} state${selected.length > 1 ? 's' : ''} selected`
                : 'Select states...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search states..." />
            <CommandList>
              <CommandEmpty>No state found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {US_STATES.map((state) => (
                  <CommandItem
                    key={state.value}
                    value={state.label}
                    onSelect={() => handleSelect(state.value)}
                    data-testid={`state-option-${state.value}`}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected.includes(state.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <span>{state.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {state.value}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected states as badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="selected-states">
          {selected.map((stateValue) => (
            <Badge
              key={stateValue}
              variant="secondary"
              className="gap-1"
              data-testid={`selected-state-${stateValue}`}
            >
              {getStateLabel(stateValue)}
              <button
                type="button"
                onClick={() => handleRemove(stateValue)}
                className="ml-1 rounded-full hover:bg-muted"
                disabled={disabled}
                aria-label={`Remove ${getStateLabel(stateValue)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
