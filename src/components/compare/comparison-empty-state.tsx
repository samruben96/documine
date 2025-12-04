'use client';

import { BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Comparison Empty State Component
 *
 * Story 7.7: AC-7.7.5
 *
 * Shows when user has no past comparisons:
 * - Icon with engaging headline
 * - Value proposition text
 * - CTA button to create first comparison
 */

interface ComparisonEmptyStateProps {
  onCreateComparison: () => void;
}

export function ComparisonEmptyState({ onCreateComparison }: ComparisonEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="comparison-empty-state"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
      </div>

      {/* Headline */}
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No comparisons yet
      </h2>

      {/* Value proposition */}
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        Compare quotes side-by-side to see coverage differences at a glance.
      </p>

      {/* CTA Button */}
      <Button onClick={onCreateComparison} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Create Your First Comparison
      </Button>
    </div>
  );
}
