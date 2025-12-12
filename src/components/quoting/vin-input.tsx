/**
 * VIN Input Component
 * Story Q3.1: Data Capture Forms
 * Story Q3.3: Field Validation & Formatting
 *
 * AC-Q3.1-17: Auto-uppercase and validate 17-character format (excluding I, O, Q)
 * AC-Q3.1-18: Decode VIN on blur and auto-populate year/make/model
 * AC-Q3.1-19: Show warning message on decode failure
 *
 * AC-Q3.3-1: Green checkmark (✓) for valid VIN format
 * AC-Q3.3-2: Inline error "Invalid VIN format" on blur
 * AC-Q3.3-3: Auto-uppercase on input
 * AC-Q3.3-4: Success message on NHTSA decode success
 * AC-Q3.3-5: Warning on NHTSA decode failure, manual fields remain editable
 */

'use client';

import { useState, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVINDecode, type VINDecodeResult } from '@/hooks/quoting/use-vin-decode';
import { formatVIN, isValidVINFormat } from '@/lib/quoting/formatters';
import { validateVin } from '@/lib/quoting/validation';
import { FieldError } from '@/components/quoting/field-error';
import { cn } from '@/lib/utils';

export interface VINInputProps {
  /** Current VIN value */
  value: string;
  /** Called when VIN value changes */
  onChange: (value: string) => void;
  /** Called when VIN is decoded successfully */
  onDecode?: (result: VINDecodeResult) => void;
  /** Called when VIN decode fails */
  onDecodeError?: (error: string) => void;
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
 * VIN Input with auto-formatting and decode
 */
export function VINInput({
  value,
  onChange,
  onDecode,
  onDecodeError,
  id,
  disabled,
  hasError,
  className,
}: VINInputProps) {
  const { decodeVIN, isLoading, error: decodeError, clear } = useVINDecode();
  const [decodeStatus, setDecodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [isFormatValid, setIsFormatValid] = useState(false);

  /**
   * Handle input change - auto-uppercase and format
   * AC-Q3.3-3: Auto-uppercase on input
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatVIN(e.target.value);
      onChange(formatted);

      // Clear status when user modifies VIN
      setDecodeStatus('idle');
      setSuccessMessage(null);
      setValidationError(undefined);
      setIsFormatValid(false);
      clear();
    },
    [onChange, clear]
  );

  /**
   * Handle blur - validate format and attempt VIN decode
   * AC-Q3.3-1: Green checkmark for valid format
   * AC-Q3.3-2: Inline error for invalid format
   * AC-Q3.1-18: Decode on blur if valid format
   */
  const handleBlur = useCallback(async () => {
    // Skip validation if empty (optional field)
    if (!value || value.trim() === '') {
      setValidationError(undefined);
      setIsFormatValid(false);
      return;
    }

    // Validate format first
    const validation = validateVin(value);
    if (!validation.valid) {
      setValidationError(validation.error);
      setIsFormatValid(false);
      return;
    }

    // Format is valid - show checkmark
    setValidationError(undefined);
    setIsFormatValid(true);

    // Attempt decode
    const result = await decodeVIN(value);

    if (result) {
      setDecodeStatus('success');
      // Create success message - AC-Q3.3-4
      const parts = [result.year, result.make, result.model].filter(Boolean);
      if (parts.length > 0) {
        setSuccessMessage(`Vehicle identified: ${parts.join(' ')}`);
      }
      if (onDecode) {
        onDecode(result);
      }
    } else {
      // AC-Q3.3-5: Warning on decode failure, manual fields remain editable
      setDecodeStatus('error');
      if (onDecodeError && decodeError) {
        onDecodeError(decodeError);
      }
    }
  }, [value, decodeVIN, decodeError, onDecode, onDecodeError]);

  // Determine which icon to show
  const showValidIcon = !isLoading && isFormatValid && !validationError;
  const showDecodeSuccess = !isLoading && decodeStatus === 'success';
  const showDecodeWarning = !isLoading && decodeStatus === 'error' && !validationError;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || isLoading}
          placeholder="Enter 17-character VIN"
          maxLength={17}
          aria-invalid={!!validationError || hasError}
          className={cn(
            'pr-8 font-mono uppercase',
            className
          )}
          data-testid="vin-input"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {/* AC-Q3.3-1: Green checkmark for valid format or successful decode */}
          {(showValidIcon || showDecodeSuccess) && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          {/* Decode warning (yellow) - format is valid but decode failed */}
          {showDecodeWarning && (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
        </div>
      </div>

      {/* Character count - show while typing */}
      {value && value.length > 0 && value.length < 17 && !validationError && (
        <p className="text-xs text-muted-foreground">
          {value.length}/17 characters
        </p>
      )}

      {/* AC-Q3.3-2: Inline validation error */}
      <FieldError error={validationError} />

      {/* Success message - AC-Q3.3-4 */}
      {decodeStatus === 'success' && successMessage && !validationError && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {successMessage}
        </p>
      )}

      {/* Decode warning - AC-Q3.3-5 */}
      {decodeStatus === 'error' && decodeError && !validationError && (
        <p className="text-xs text-yellow-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {decodeError}
        </p>
      )}
    </div>
  );
}
