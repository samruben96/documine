/**
 * Field Error Component
 * Story Q3.3: Field Validation & Formatting
 *
 * AC-Q3.3-11: Error text appears inline directly below the field
 * AC-Q3.3-12: Field has red border highlight (via aria-invalid on input)
 * AC-Q3.3-13: Error message removed when user corrects input
 */

'use client';

import { cn } from '@/lib/utils';

export interface FieldErrorProps {
  /** Error message to display */
  error?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Inline field error display component
 * Displays error message below form fields with proper styling
 *
 * Usage:
 * ```tsx
 * <Input aria-invalid={!!error} />
 * <FieldError error={error} />
 * ```
 */
export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p
      className={cn(
        'text-sm text-destructive mt-1',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {error}
    </p>
  );
}

/**
 * Get input props for error state
 * Sets aria-invalid for accessibility and styling
 *
 * AC-Q3.3-12: Red border via aria-invalid:border-destructive
 */
export function getErrorInputProps(error?: string) {
  return {
    'aria-invalid': !!error,
    'aria-describedby': error ? 'field-error' : undefined,
  };
}
