'use client';

/**
 * CollapsibleSection - Expandable content wrapper
 *
 * Story 10.8: AC-10.8.1, AC-10.8.7
 * Accessible collapsible section with chevron icon.
 *
 * @module @/components/compare/collapsible-section
 */

import { useState, useId } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Props
// ============================================================================

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Optional count badge */
  badge?: number;
  /** Optional custom className */
  className?: string;
  /** Content to render when expanded */
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * CollapsibleSection Component
 * AC-10.8.1: Collapsible section pattern with chevron icons.
 * AC-10.8.7: aria-expanded and aria-controls for accessibility.
 * Keyboard: Enter/Space toggles section.
 */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  className,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // AC-10.8.7: Enter/Space toggles section
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cn('border-b border-slate-200 dark:border-slate-700', className)}>
      {/* Section header button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-3',
          'text-left text-sm font-semibold',
          'bg-slate-50 dark:bg-slate-800',
          'text-slate-700 dark:text-slate-300',
          'hover:bg-slate-100 dark:hover:bg-slate-700',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'transition-colors'
        )}
        data-testid={`collapsible-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {/* Chevron icon - rotates when open */}
        <ChevronRight
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
          aria-hidden="true"
        />

        {/* Title */}
        <span className="flex-grow">{title}</span>

        {/* Optional count badge */}
        {badge !== undefined && badge > 0 && (
          <Badge variant="secondary" className="ml-2">
            {badge}
          </Badge>
        )}
      </button>

      {/* Content panel */}
      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={`${contentId}-header`}
          className="animate-in fade-in-0 slide-in-from-top-1 duration-200"
        >
          {children}
        </div>
      )}
    </div>
  );
}
