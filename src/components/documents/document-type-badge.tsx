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

const typeConfig = {
  quote: {
    label: 'Quote',
    icon: FileText,
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  },
  general: {
    label: 'General',
    icon: FileQuestion,
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
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
      variant="outline"
      className={cn(
        config.className,
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
