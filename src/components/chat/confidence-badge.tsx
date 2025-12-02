'use client';

import { CheckCircle, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Confidence levels for AI responses
 * Based on similarity score thresholds from tech spec:
 * - high: >= 0.85 similarity
 * - needs_review: 0.60 - 0.84 similarity
 * - not_found: < 0.60 or no relevant chunks
 */
export type ConfidenceLevel = 'high' | 'needs_review' | 'not_found';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

/**
 * Badge configuration for each confidence level
 * Per AC-5.3.3, AC-5.3.4, AC-5.3.5:
 * - High: Green background (#d1fae5), checkmark icon, text "High Confidence"
 * - Needs Review: Amber background (#fef3c7), warning icon, text "Needs Review"
 * - Not Found: Gray background (#f1f5f9), circle icon, text "Not Found"
 */
const badgeConfig = {
  high: {
    background: 'bg-[#d1fae5]',
    text: 'text-[#065f46]',
    icon: CheckCircle,
    label: 'High Confidence',
  },
  needs_review: {
    background: 'bg-[#fef3c7]',
    text: 'text-[#92400e]',
    icon: AlertTriangle,
    label: 'Needs Review',
  },
  not_found: {
    background: 'bg-[#f1f5f9]',
    text: 'text-[#475569]',
    icon: Circle,
    label: 'Not Found',
  },
} as const;

/**
 * Confidence Badge Component
 *
 * Implements AC-5.3.2: Confidence badge appears below response after streaming completes
 * Implements AC-5.3.3: High Confidence badge styling
 * Implements AC-5.3.4: Needs Review badge styling
 * Implements AC-5.3.5: Not Found badge styling
 *
 * Badge is styled with 11px font (text-[11px]) for subtle appearance per UX spec.
 */
export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const config = badgeConfig[confidence];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        config.background,
        config.text,
        className
      )}
      role="status"
      aria-label={`Confidence: ${config.label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="text-[11px] font-medium">{config.label}</span>
    </div>
  );
}

/**
 * Calculate confidence level from similarity score
 *
 * Implements AC-5.3.6:
 * - >= 0.85 similarity = High Confidence
 * - 0.60 - 0.84 similarity = Needs Review
 * - < 0.60 or no relevant chunks = Not Found
 *
 * @param topScore - The similarity score of the top retrieved chunk (0-1)
 * @returns The confidence level
 */
export function calculateConfidence(topScore: number | null | undefined): ConfidenceLevel {
  if (topScore === null || topScore === undefined) {
    return 'not_found';
  }
  if (topScore >= 0.85) {
    return 'high';
  }
  if (topScore >= 0.60) {
    return 'needs_review';
  }
  return 'not_found';
}
