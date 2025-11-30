'use client';

import { FileText, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/date';
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentListItemProps {
  id: string;
  filename: string;
  displayName?: string | null;
  status: string;
  createdAt: string;
  isSelected?: boolean;
  onClick?: () => void;
  onDeleteClick?: () => void;
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
  onDeleteClick,
}: DocumentListItemProps) {
  const name = displayName || filename;

  return (
    <div
      className={cn(
        'group relative w-full flex items-center gap-3 px-3 py-2.5 transition-colors',
        'hover:bg-slate-100',
        // AC-4.3.8: Selected document styling
        isSelected && 'bg-[#f1f5f9] border-l-2 border-l-[#475569]',
        !isSelected && 'border-l-2 border-l-transparent'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex-1 flex items-center gap-3 text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400'
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

      {/* Actions - AC-4.4.1 */}
      {/* Show on hover (desktop) or always visible (touch devices) */}
      {onDeleteClick && (
        <div
          className={cn(
            'flex-shrink-0 flex items-center gap-0.5',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'focus-within:opacity-100',
            // Always visible on touch devices
            'max-md:opacity-100'
          )}
        >
          {/* Direct delete button - trash icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            className={cn(
              'p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-red-600 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
            )}
            aria-label={`Delete ${name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Context menu - three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
                )}
                aria-label={`More options for ${name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
