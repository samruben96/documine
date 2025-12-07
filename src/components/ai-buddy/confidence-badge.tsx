/**
 * Confidence Badge Component
 * Story 14.5: Component Scaffolding
 *
 * Displays confidence level indicator for AI responses.
 * Stub implementation - full functionality in Epic 15.
 */

import { cn } from '@/lib/utils';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

const levelConfig = {
  high: {
    label: 'High Confidence',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
  },
  medium: {
    label: 'Needs Review',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
  },
  low: {
    label: 'Low Confidence',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
  },
};

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const config = levelConfig[level];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
