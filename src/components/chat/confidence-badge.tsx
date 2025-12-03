'use client';

import { CheckCircle, AlertTriangle, Circle, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import from shared module (server-compatible)
import { type ConfidenceLevel } from '@/lib/chat/confidence';

// Re-export for backward compatibility with existing imports
export { calculateConfidence, type ConfidenceLevel } from '@/lib/chat/confidence';

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
 * Story 6.2 AC-6.2.5: Added Conversational
 * - Conversational: Blue background (#dbeafe), message icon, text "Conversational"
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
  conversational: {
    background: 'bg-[#dbeafe]',
    text: 'text-[#1e40af]',
    icon: MessageCircle,
    label: 'Conversational',
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
