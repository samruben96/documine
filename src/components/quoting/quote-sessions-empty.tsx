'use client';

import { Calculator, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Empty State Component for Quote Sessions List
 * Story Q2.1: Quote Sessions List Page
 *
 * AC-Q2.1-4: Empty state with "No quotes yet" message and "New Quote" CTA
 */

interface QuoteSessionsEmptyProps {
  onNewQuote?: () => void;
}

export function QuoteSessionsEmpty({ onNewQuote }: QuoteSessionsEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4"
      data-testid="quote-sessions-empty"
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
        <Calculator className="w-8 h-8 text-primary" />
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No quotes yet
      </h2>
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
        Start a new quote session to enter client information and compare carrier quotes.
      </p>

      {/* CTA */}
      <Button onClick={onNewQuote} data-testid="empty-new-quote-button">
        <Plus className="h-4 w-4" />
        New Quote
      </Button>
    </div>
  );
}
