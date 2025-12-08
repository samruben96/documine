/**
 * Source Citation Component
 * Story 15.5: AI Response Quality & Attribution
 *
 * Displays a clickable citation link to source document.
 *
 * Implements:
 * - AC1: Inline citations in format [📄 Document Name pg. X]
 * - AC2: Citations styled in blue (#3b82f6)
 * - AC3: Tooltip shows quoted text on hover
 * - AC4: Click opens document preview to page
 * - AC6: No citations displayed for general knowledge
 */

'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Citation } from '@/types/ai-buddy';

export interface SourceCitationProps {
  /** The citation data */
  citation: Citation;
  /** Handler when citation is clicked - opens document preview */
  onClick?: (citation: Citation) => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact display mode for inline use */
  compact?: boolean;
}

/**
 * SourceCitation Component
 *
 * Displays a citation in the format: [📄 Document Name pg. X]
 * with tooltip showing quoted text and click to open document.
 */
export function SourceCitation({
  citation,
  onClick,
  className,
  compact = false,
}: SourceCitationProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onClick?.(citation);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(citation);
    }
  };

  // AC1: Format as [📄 Document Name pg. X]
  const displayText = citation.page
    ? `${citation.documentName} pg. ${citation.page}`
    : citation.documentName;

  // AC3: Tooltip shows quoted text
  const tooltipText = citation.text
    ? `"${citation.text.slice(0, 150)}${citation.text.length > 150 ? '...' : ''}"`
    : 'Click to view source document';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              // AC2: Blue color (#3b82f6)
              'inline-flex items-center gap-1 text-blue-500 hover:text-blue-400',
              'transition-colors duration-150 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 rounded-sm',
              // Size variants
              compact ? 'text-xs' : 'text-sm',
              className
            )}
            aria-label={`View citation from ${citation.documentName}${citation.page ? ` page ${citation.page}` : ''}`}
            data-testid="source-citation"
            data-document-id={citation.documentId}
            data-page={citation.page}
          >
            {/* Citation format: [📄 Document Name pg. X] */}
            <span className="inline-flex items-center gap-1">
              <span className="text-current">[</span>
              <FileText
                className={cn(
                  'flex-shrink-0',
                  compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'underline underline-offset-2',
                  isHovered && 'decoration-2'
                )}
              >
                {displayText}
              </span>
              <span className="text-current">]</span>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className={cn(
            'max-w-xs p-3 text-sm',
            'bg-slate-800 text-slate-100 border-slate-700'
          )}
        >
          <div className="space-y-1.5">
            <div className="font-medium text-slate-200">
              {citation.documentName}
              {citation.page && (
                <span className="text-slate-400 font-normal ml-1">
                  (Page {citation.page})
                </span>
              )}
            </div>
            {citation.text && (
              <div className="text-slate-300 italic text-xs leading-relaxed">
                {tooltipText}
              </div>
            )}
            <div className="text-slate-400 text-xs pt-1 border-t border-slate-700">
              Click to view source
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * CitationList Component
 *
 * Displays a list of citations after an AI response.
 * Used when citations should be displayed as a block rather than inline.
 */
export interface CitationListProps {
  citations: Citation[];
  onCitationClick?: (citation: Citation) => void;
  className?: string;
}

export function CitationList({
  citations,
  onCitationClick,
  className,
}: CitationListProps) {
  // AC6: No citations displayed for general knowledge (empty array)
  if (citations.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 pt-2 mt-2 border-t border-slate-200 dark:border-slate-700',
        className
      )}
      data-testid="citation-list"
    >
      <span className="text-xs text-slate-500 mr-1">Sources:</span>
      {citations.map((citation, index) => (
        <SourceCitation
          key={`${citation.documentId}-${citation.page}-${index}`}
          citation={citation}
          onClick={onCitationClick}
          compact
        />
      ))}
    </div>
  );
}

export default SourceCitation;
