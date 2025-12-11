/**
 * New Quote Dialog Component
 * Story Q2.2: Create New Quote Session
 *
 * Modal dialog for creating a new quote session with validation.
 *
 * AC-Q2.2-1: Dialog with prospect name input and quote type selector
 * AC-Q2.2-2: Bundle selected as default quote type
 * AC-Q2.2-4: Validation error for empty prospect name
 * AC-Q2.2-5: Cancel closes dialog without creating session
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuoteSession, QuoteType } from '@/types/quoting';

/**
 * Zod schema for create quote session input
 * AC-Q2.2-4: Prospect name required, minimum 2 characters
 */
export const createQuoteSessionSchema = z.object({
  prospectName: z
    .string()
    .min(1, 'Prospect name is required')
    .min(2, 'Prospect name must be at least 2 characters'),
  quoteType: z.enum(['home', 'auto', 'bundle'] as const),
});

export type CreateQuoteSessionFormData = z.infer<typeof createQuoteSessionSchema>;

export interface NewQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated?: (session: QuoteSession) => void;
  /** Async submit handler - returns created session or null on error */
  onSubmit?: (input: CreateQuoteSessionFormData) => Promise<QuoteSession | null>;
  /** Loading state from parent */
  isLoading?: boolean;
}

const QUOTE_TYPE_OPTIONS: { value: QuoteType; label: string }[] = [
  { value: 'bundle', label: 'Bundle (Home + Auto)' },
  { value: 'home', label: 'Home' },
  { value: 'auto', label: 'Auto' },
];

export function NewQuoteDialog({
  open,
  onOpenChange,
  onSessionCreated,
  onSubmit,
  isLoading = false,
}: NewQuoteDialogProps) {
  const form = useForm<CreateQuoteSessionFormData>({
    resolver: zodResolver(createQuoteSessionSchema),
    defaultValues: {
      prospectName: '',
      quoteType: 'bundle', // AC-Q2.2-2: Bundle as default
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = form;

  const quoteType = watch('quoteType');

  const resetForm = () => {
    reset({
      prospectName: '',
      quoteType: 'bundle',
    });
  };

  // AC-Q2.2-5: Cancel closes dialog without side effects
  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const onFormSubmit = async (data: CreateQuoteSessionFormData) => {
    if (!onSubmit) return;

    const session = await onSubmit(data);

    if (session) {
      onSessionCreated?.(session);
      resetForm();
      onOpenChange(false);
    }
  };

  const isDisabled = isSubmitting || isLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="new-quote-dialog">
        <DialogHeader>
          <DialogTitle>New Quote</DialogTitle>
          <DialogDescription>
            Create a quote session for a prospect. Enter their name and select
            the type of coverage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Prospect Name Input - AC-Q2.2-1 */}
          <div className="space-y-2">
            <Label htmlFor="prospect-name">
              Prospect Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="prospect-name"
              data-testid="prospect-name-input"
              placeholder="e.g., John Smith"
              {...register('prospectName')}
              disabled={isDisabled}
              aria-invalid={!!errors.prospectName}
              aria-describedby={errors.prospectName ? 'prospect-name-error' : undefined}
            />
            {/* AC-Q2.2-4: Validation error display */}
            {errors.prospectName && (
              <p
                id="prospect-name-error"
                className="text-sm text-red-500"
                data-testid="prospect-name-error"
                role="alert"
              >
                {errors.prospectName.message}
              </p>
            )}
          </div>

          {/* Quote Type Selector - AC-Q2.2-1, AC-Q2.2-2 */}
          <div className="space-y-2">
            <Label htmlFor="quote-type">Quote Type</Label>
            <Select
              value={quoteType}
              onValueChange={(value: QuoteType) => setValue('quoteType', value)}
              disabled={isDisabled}
            >
              <SelectTrigger
                id="quote-type"
                data-testid="quote-type-select"
                className="w-full"
              >
                <SelectValue placeholder="Select quote type" />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_TYPE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    data-testid={`quote-type-option-${option.value}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            {/* AC-Q2.2-5: Cancel button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDisabled}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            {/* AC-Q2.2-4: Disabled when validation errors exist (via form state) */}
            <Button
              type="submit"
              disabled={isDisabled}
              data-testid="create-quote-button"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Quote'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
