'use client';

import { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SourceCitation } from '@/lib/chat/types';

/**
 * Props for the SourceCitationLink component
 */
interface SourceCitationLinkProps {
  source: SourceCitation;
  onClick?: (source: SourceCitation) => void;
  className?: string;
}

/**
 * Single source citation link
 * Implements AC-5.4.1: Source citation link with page number
 * Implements AC-5.4.2: Subtle styling with hover underline
 */
function SourceCitationLink({ source, onClick, className }: SourceCitationLinkProps) {
  const handleClick = useCallback(() => {
    onClick?.(source);
  }, [onClick, source]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // AC-5.4.1: Keyboard accessibility (Enter/Space triggers click)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(source);
      }
    },
    [onClick, source]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // AC-5.4.2: Subtle styling - small text, muted color
        'inline-flex items-center gap-0.5',
        'text-xs text-slate-500',
        // AC-5.7.5: Minimum 44px touch target for accessibility
        'min-h-[44px] min-w-[44px] px-2',
        // AC-5.4.2: Underline on hover, lighter color on hover
        'hover:text-slate-700 hover:underline',
        // AC-6.3.3: Active/pressed state for visual feedback on click
        'active:bg-slate-100 active:text-slate-800 active:scale-95',
        'focus:outline-none focus:ring-1 focus:ring-slate-400 focus:ring-offset-1 rounded',
        'transition-all duration-150 cursor-pointer',
        className
      )}
      aria-label={`View page ${source.pageNumber} in document`}
    >
      <span>Page {source.pageNumber}</span>
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}

/**
 * Props for the SourceCitationList component
 */
export interface SourceCitationListProps {
  sources: SourceCitation[];
  onSourceClick?: (source: SourceCitation) => void;
  className?: string;
}

/**
 * Source Citation List Component
 *
 * Implements AC-5.4.1: Source citation link after confidence badge
 * Implements AC-5.4.2: Citation link styled subtly (small text, muted color)
 * Implements AC-5.4.3: Multiple sources show as "Sources: Page 3, Page 7, Page 12"
 * Implements AC-5.4.4: Expandable UI for more than 3 sources
 * Implements AC-5.4.5: Source data includes pageNumber, text, chunkId, similarityScore
 *
 * @param sources - Array of SourceCitation objects
 * @param onSourceClick - Callback when a source link is clicked
 * @param className - Optional additional classes
 */
export function SourceCitationList({
  sources,
  onSourceClick,
  className,
}: SourceCitationListProps) {
  // AC-5.4.4: Expanded state for more than 3 sources
  const [isExpanded, setIsExpanded] = useState(false);

  // Return null if no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  // AC-5.4.3: Sort sources by page number ascending
  const sortedSources = [...sources].sort((a, b) => a.pageNumber - b.pageNumber);

  // Deduplicate by page number (keep first occurrence)
  const uniqueSources = sortedSources.filter(
    (source, index, arr) =>
      index === arr.findIndex((s) => s.pageNumber === source.pageNumber)
  );

  const hasManySources = uniqueSources.length > 3;
  const visibleSources = isExpanded ? uniqueSources : uniqueSources.slice(0, 3);
  const hiddenCount = uniqueSources.length - 3;

  // Single source case - no "Sources:" prefix
  if (uniqueSources.length === 1 && uniqueSources[0]) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <SourceCitationLink
          source={uniqueSources[0]}
          onClick={onSourceClick}
        />
      </div>
    );
  }

  // Multiple sources case
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {/* AC-5.4.3: "Sources:" label for multiple sources */}
      <span className="text-xs text-slate-400">Sources:</span>

      {/* Render visible source links */}
      {visibleSources.map((source, index) => (
        <span key={source.chunkId || `source-${source.pageNumber}-${index}`} className="inline-flex items-center">
          <SourceCitationLink source={source} onClick={onSourceClick} />
          {/* Add comma separator except for last visible item (if not expanded and has more) */}
          {index < visibleSources.length - 1 && (
            <span className="text-xs text-slate-400 mr-1">,</span>
          )}
        </span>
      ))}

      {/* AC-5.4.4: "and X more" or expandable button for >3 sources */}
      {hasManySources && !isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={cn(
            'text-xs text-slate-500',
            // AC-5.7.5: Minimum 44px touch target for accessibility
            'min-h-[44px] px-2',
            'hover:text-slate-700 hover:underline',
            'focus:outline-none focus:ring-1 focus:ring-slate-400 focus:ring-offset-1 rounded',
            'transition-colors cursor-pointer'
          )}
          aria-label={`Show ${hiddenCount} more source${hiddenCount > 1 ? 's' : ''}`}
        >
          and {hiddenCount} more
        </button>
      )}

      {/* Collapse button when expanded */}
      {hasManySources && isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className={cn(
            'text-xs text-slate-500',
            // AC-5.7.5: Minimum 44px touch target for accessibility
            'min-h-[44px] px-2 ml-1',
            'hover:text-slate-700 hover:underline',
            'focus:outline-none focus:ring-1 focus:ring-slate-400 focus:ring-offset-1 rounded',
            'transition-colors cursor-pointer'
          )}
          aria-label="Show fewer sources"
        >
          (show less)
        </button>
      )}
    </div>
  );
}

/**
 * Truncate text to specified length with ellipsis
 * AC-5.4.5: Text excerpt limited to 100 chars for display
 */
export function truncateExcerpt(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
