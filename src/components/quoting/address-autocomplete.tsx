/**
 * Address Autocomplete Component
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-4: Autocomplete suggestions from Google Places API after 3+ chars
 * AC-Q3.1-5: Selected suggestion populates all address fields
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useAddressAutocomplete,
  type PlacePrediction,
} from '@/hooks/quoting/use-address-autocomplete';
import type { Address } from '@/types/quoting';
import { cn } from '@/lib/utils';

export interface AddressAutocompleteProps {
  /** Current street value */
  value: string;
  /** Called when street value changes */
  onChange: (value: string) => void;
  /** Called when an address is selected from suggestions */
  onAddressSelect: (address: Address) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Input id for label association */
  id?: string;
  /** Input is disabled */
  disabled?: boolean;
  /** Input has error */
  hasError?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Address Autocomplete Input
 *
 * Shows Google Places suggestions as user types.
 * On selection, calls onAddressSelect with full address.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  id,
  disabled,
  hasError,
  className,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    predictions,
    isLoading,
    error,
    search,
    selectPrediction,
    clear,
  } = useAddressAutocomplete();

  // Search when value changes
  useEffect(() => {
    if (value.length >= 3) {
      search(value);
      setOpen(true);
    } else {
      clear();
      setOpen(false);
    }
  }, [value, search, clear]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  /**
   * Handle prediction selection
   * AC-Q3.1-5: Populate all address fields
   */
  const handleSelect = async (prediction: PlacePrediction) => {
    const address = await selectPrediction(prediction.placeId);
    if (address) {
      onAddressSelect(address);
      onChange(address.street);
    }
    setOpen(false);
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  /**
   * Handle input focus
   */
  const handleFocus = () => {
    if (predictions.length > 0) {
      setOpen(true);
    }
  };

  const showPopover = open && (predictions.length > 0 || isLoading);

  return (
    <Popover open={showPopover} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            id={id}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pr-8',
              hasError && 'border-destructive',
              className
            )}
            autoComplete="off"
            data-testid="address-autocomplete-input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading && (
              <CommandEmpty className="py-2 text-center text-sm text-muted-foreground">
                Searching...
              </CommandEmpty>
            )}
            {!isLoading && predictions.length === 0 && (
              <CommandEmpty className="py-2 text-center text-sm text-muted-foreground">
                No addresses found
              </CommandEmpty>
            )}
            {error && (
              <CommandEmpty className="py-2 text-center text-sm text-destructive">
                {error}
              </CommandEmpty>
            )}
            <CommandGroup>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.placeId}
                  value={prediction.description}
                  onSelect={() => handleSelect(prediction)}
                  className="cursor-pointer"
                  data-testid={`prediction-${prediction.placeId}`}
                >
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{prediction.mainText}</span>
                    <span className="text-xs text-muted-foreground">
                      {prediction.secondaryText}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
