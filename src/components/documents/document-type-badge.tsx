'use client';

import { FileText, FileQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/types';

/**
 * Document Type Badge Component
 *
 * Story F2-2: Visual indicator for document categorization
 * AC-F2-2.5: Type displayed as badge on document card/row (visual distinction)
 *
 * - Quote: Blue/primary color with FileText icon
 * - General: Gray/secondary color with FileQuestion icon
 */

interface DocumentTypeBadgeProps {
  type: DocumentType | null | undefined;
  className?: string;
  showIcon?: boolean;
  onClick?: () => void;
}

/**
 * Type configuration with new status variants (Story DR.7)
 * - quote → status-info (blue)
 * - general → status-default (slate)
 */
const typeConfig = {
  quote: {
    label: 'Quote',
    icon: FileText,
    variant: 'status-info' as const,
  },
  general: {
    label: 'General',
    icon: FileQuestion,
    variant: 'status-default' as const,
  },
} as const;

export function DocumentTypeBadge({
  type,
  className,
  showIcon = true,
  onClick,
}: DocumentTypeBadgeProps) {
  // Default to 'quote' if type is null/undefined (backward compatibility)
  const resolvedType: DocumentType = type ?? 'quote';
  const config = typeConfig[resolvedType];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      data-testid="document-type-badge"
      data-type={resolvedType}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
