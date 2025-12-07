/**
 * Source Citation Component
 * Story 14.5: Component Scaffolding
 *
 * Displays a clickable citation link to source document.
 * Stub implementation - full functionality in Epic 15.
 */

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SourceCitationProps {
  documentName: string;
  pageNumber?: number;
  onClick?: () => void;
  className?: string;
}

export function SourceCitation({
  documentName,
  pageNumber,
  onClick,
  className,
}: SourceCitationProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors',
        className
      )}
    >
      <FileText className="h-3 w-3" />
      <span>
        {documentName}
        {pageNumber && ` pg. ${pageNumber}`}
      </span>
    </button>
  );
}
