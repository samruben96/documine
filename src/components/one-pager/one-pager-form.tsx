'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, StickyNote } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Form data type for one-pager.
 * AC-9.3.5: Client name (max 100 chars)
 * AC-9.3.6: Agent notes (max 500 chars)
 */
export interface OnePagerFormData {
  clientName: string;
  agentNotes: string;
}

/**
 * Form schema for one-pager validation.
 */
const onePagerFormSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100, 'Max 100 characters'),
  agentNotes: z.string().max(500, 'Max 500 characters'),
});

/**
 * OnePagerForm Props
 */
interface OnePagerFormProps {
  /** Default client name (from namedInsured) */
  defaultClientName?: string;
  /** Callback when form values change (debounced) */
  onChange: (data: OnePagerFormData) => void;
  /** Debounce delay in ms */
  debounceMs?: number;
}

/**
 * OnePagerForm Component
 * Story 9.3: AC-9.3.5, AC-9.3.6, AC-9.3.7 - Form for client name and agent notes.
 * Updates are debounced to prevent excessive preview re-renders.
 */
export function OnePagerForm({
  defaultClientName = '',
  onChange,
  debounceMs = 300,
}: OnePagerFormProps) {
  const form = useForm<OnePagerFormData>({
    resolver: zodResolver(onePagerFormSchema),
    defaultValues: {
      clientName: defaultClientName,
      agentNotes: '',
    },
    mode: 'onChange',
  });

  // Debounced onChange callback
  // AC-9.3.7: Debounced updates (300ms default)
  const debouncedOnChange = useDebouncedCallback(
    (data: OnePagerFormData) => {
      onChange(data);
    },
    debounceMs
  );

  // Watch form values and trigger debounced onChange
  const watchedValues = form.watch();

  useEffect(() => {
    // Only trigger if form is valid
    const isValid = form.formState.isValid;
    if (isValid) {
      debouncedOnChange(watchedValues);
    }
  }, [watchedValues, debouncedOnChange, form.formState.isValid]);

  // Update default client name when prop changes
  useEffect(() => {
    if (defaultClientName && !form.getValues('clientName')) {
      form.setValue('clientName', defaultClientName);
    }
  }, [defaultClientName, form]);

  const charCount = watchedValues.agentNotes?.length || 0;

  return (
    <Form {...form}>
      <form className="space-y-6" data-testid="one-pager-form">
        {/* Client Name Field */}
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter client name"
                  maxLength={100}
                  data-testid="client-name-input"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The client&apos;s name to display on the one-pager header.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Agent Notes Field */}
        <FormField
          control={form.control}
          name="agentNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Agent Notes
                <span className="text-xs text-slate-400 font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any recommendations or notes for the client..."
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                  data-testid="agent-notes-input"
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex justify-between">
                <span>Personalized notes or recommendations.</span>
                <span className={charCount > 450 ? 'text-amber-600' : ''}>
                  {charCount}/500
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
