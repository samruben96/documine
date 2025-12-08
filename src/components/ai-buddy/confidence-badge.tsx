/**
 * Confidence Badge Component
 * Story 15.5: AI Response Quality & Attribution
 *
 * Displays confidence level indicator for AI responses.
 *
 * Implements:
 * - AC7: Confidence badge displayed below each AI response
 * - AC8: SSE includes confidence data (handled by API)
 * - AC9: High (green): from attached documents
 * - AC10: Medium (amber): general knowledge, verify
 * - AC11: Low (gray): information not available
 * - AC14: Hover tooltip explains each level
 */

'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ConfidenceLevel } from '@/types/ai-buddy';

export interface ConfidenceBadgeProps {
  /** Confidence level of the AI response */
  level: ConfidenceLevel;
  /** Additional CSS classes */
  className?: string;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Configuration for each confidence level
 * AC9-AC11: High/Medium/Low with appropriate colors and labels
 */
const levelConfig: Record<
  ConfidenceLevel,
  {
    label: string;
    description: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: string;
  }
> = {
  high: {
    label: 'High Confidence',
    description:
      'This answer is based on information from your attached documents. Click citations to verify.',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/20',
    icon: '✓',
  },
  medium: {
    label: 'Needs Review',
    description:
      'This answer is based on general insurance knowledge. Please verify important details with the carrier or policy documents.',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/20',
    icon: '!',
  },
  low: {
    label: 'Not Found',
    description:
      "The information wasn't found in the documents or general knowledge. Consider rephrasing your question or consulting additional resources.",
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-500 dark:text-slate-400',
    borderClass: 'border-slate-500/20',
    icon: '?',
  },
};

/**
 * ConfidenceBadge Component
 *
 * Displays confidence level with color coding and optional tooltip.
 * Used below AI responses to indicate answer reliability.
 */
export function ConfidenceBadge({
  level,
  className,
  showTooltip = true,
}: ConfidenceBadgeProps) {
  const config = levelConfig[level];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'border transition-colors',
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      )}
      data-testid="confidence-badge"
      data-confidence-level={level}
    >
      <span
        className="font-semibold text-[10px] leading-none"
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <span>{config.label}</span>
      {showTooltip && (
        <Info className="h-3 w-3 opacity-60" aria-hidden="true" />
      )}
    </span>
  );

  // AC14: Hover tooltip explains each level
  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="cursor-help focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full"
            aria-label={`${config.label}: ${config.description}`}
          >
            {badge}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className={cn(
            'max-w-xs p-3',
            'bg-slate-800 text-slate-100 border-slate-700'
          )}
        >
          <div className="space-y-1.5">
            <div className={cn('font-medium text-sm', config.textClass)}>
              {config.label}
            </div>
            <div className="text-slate-300 text-xs leading-relaxed">
              {config.description}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ConfidenceIndicator Component
 *
 * Compact version for inline use within messages.
 */
export interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceIndicator({
  level,
  className,
}: ConfidenceIndicatorProps) {
  const config = levelConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        config.textClass,
        className
      )}
      data-testid="confidence-indicator"
    >
      <span className="font-semibold text-[10px]">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export { type ConfidenceLevel };
export default ConfidenceBadge;
