'use client';

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/date';
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';

interface DocumentListItemProps {
  id: string;
  filename: string;
  displayName?: string | null;
  status: string;
  createdAt: string;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Document List Item Component
 *
 * Displays a single document in the sidebar list.
 * Implements:
 * - AC-4.3.1: Document icon + filename + upload date
 * - AC-4.3.2: Relative date formatting
 * - AC-4.3.3: Status indicator
 * - AC-4.3.8: Selected document styling
 */
export function DocumentListItem({
  id,
  filename,
  displayName,
  status,
  createdAt,
  isSelected = false,
  onClick,
}: DocumentListItemProps) {
  const name = displayName || filename;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400',
        // AC-4.3.8: Selected document styling
        isSelected && 'bg-[#f1f5f9] border-l-2 border-l-[#475569]',
        !isSelected && 'border-l-2 border-l-transparent'
      )}
      aria-current={isSelected ? 'page' : undefined}
    >
      {/* Document icon */}
      <div className="flex-shrink-0">
        <FileText className="h-4 w-4 text-slate-500" />
      </div>

      {/* Document info */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-slate-700"
          title={name}
        >
          {name}
        </p>
        <p className="text-xs text-slate-500">
          {formatRelativeDate(createdAt)}
        </p>
      </div>

      {/* Status indicator - AC-4.3.3 */}
      <div className="flex-shrink-0">
        <DocumentStatusBadge status={status as DocumentStatusType} />
      </div>
    </button>
  );
}
