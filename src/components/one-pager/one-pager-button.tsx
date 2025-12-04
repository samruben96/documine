'use client';

/**
 * One-Pager Button Component
 *
 * Story 9.5: AC-9.5.4, AC-9.5.5 - Consistent button for one-pager generation
 *
 * Used in:
 * - Comparison results page (AC-9.5.1)
 * - Comparison history row actions (AC-9.5.2)
 * - Document viewer header (AC-9.5.3)
 *
 * @module @/components/one-pager/one-pager-button
 */

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface OnePagerButtonProps {
  /** Comparison ID to pass as query param (for comparison entry) */
  comparisonId?: string;
  /** Document ID to pass as query param (for document entry) */
  documentId?: string;
  /** Button variant - defaults to 'outline' */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Button size - defaults to 'default' */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional class names */
  className?: string;
  /** Show icon only (for compact layouts like table rows) */
  iconOnly?: boolean;
}

/**
 * Button component that navigates to the one-pager page with appropriate query params.
 *
 * AC-9.5.4: Consistent styling with FileText icon
 * AC-9.5.5: Prominently visible in header/actions sections
 */
export function OnePagerButton({
  comparisonId,
  documentId,
  variant = 'outline',
  size = 'default',
  className,
  iconOnly = false,
}: OnePagerButtonProps) {
  // Build the href with appropriate query params
  let href = '/one-pager';
  if (comparisonId) {
    href = `/one-pager?comparisonId=${comparisonId}`;
  } else if (documentId) {
    href = `/one-pager?documentId=${documentId}`;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'gap-2',
        iconOnly && 'px-2',
        className
      )}
      asChild
      data-testid="one-pager-button"
    >
      <Link href={href}>
        <FileText className={cn('h-4 w-4', iconOnly ? '' : 'mr-0')} />
        {!iconOnly && <span>Generate One-Pager</span>}
      </Link>
    </Button>
  );
}
