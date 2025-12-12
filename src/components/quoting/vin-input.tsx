/**
 * VIN Input Component
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-17: Auto-uppercase and validate 17-character format (excluding I, O, Q)
 * AC-Q3.1-18: Decode VIN on blur and auto-populate year/make/model
 * AC-Q3.1-19: Show warning message on decode failure
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVINDecode, type VINDecodeResult } from '@/hooks/quoting/use-vin-decode';
import { formatVIN, isValidVINFormat } from '@/lib/quoting/formatters';
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
  const { decodeVIN, isLoading, error, clear } = useVINDecode();
  const [decodeStatus, setDecodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Handle input change - auto-uppercase and format
   * AC-Q3.1-17: Auto-uppercase and exclude I, O, Q
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatVIN(e.target.value);
      onChange(formatted);

      // Clear status when user modifies VIN
      setDecodeStatus('idle');
      setSuccessMessage(null);
      clear();
    },
    [onChange, clear]
  );

  /**
   * Handle blur - attempt VIN decode
   * AC-Q3.1-18: Decode on blur if valid format
   */
  const handleBlur = useCallback(async () => {
    if (!value || !isValidVINFormat(value)) {
      return;
    }

    const result = await decodeVIN(value);

    if (result) {
      setDecodeStatus('success');
      // Create success message
      const parts = [result.year, result.make, result.model].filter(Boolean);
      if (parts.length > 0) {
        setSuccessMessage(`Vehicle identified: ${parts.join(' ')}`);
      }
      if (onDecode) {
        onDecode(result);
      }
    } else {
      setDecodeStatus('error');
      if (onDecodeError && error) {
        onDecodeError(error);
      }
    }
  }, [value, decodeVIN, error, onDecode, onDecodeError]);

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
          className={cn(
            'pr-8 font-mono uppercase',
            hasError && 'border-destructive',
            className
          )}
          data-testid="vin-input"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isLoading && decodeStatus === 'success' && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          {!isLoading && decodeStatus === 'error' && (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
        </div>
      </div>

      {/* Character count */}
      {value && value.length > 0 && value.length < 17 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/17 characters
        </p>
      )}

      {/* Success message - AC-Q3.1-18 */}
      {decodeStatus === 'success' && successMessage && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {successMessage}
        </p>
      )}

      {/* Error message - AC-Q3.1-19 */}
      {decodeStatus === 'error' && error && (
        <p className="text-xs text-yellow-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
