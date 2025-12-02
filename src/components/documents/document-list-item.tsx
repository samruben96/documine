'use client';

import { useState, useRef, useEffect } from 'react';
import { FileText, MoreVertical, Trash2, Pencil, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/date';
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { renameDocument, type Label } from '@/app/(dashboard)/documents/actions';
import { toast } from 'sonner';
import { LabelPill } from './label-pill';

interface DocumentListItemProps {
  id: string;
  filename: string;
  displayName?: string | null;
  status: string;
  createdAt: string;
  labels?: Label[];
  /** Queue position: 0 = actively processing, 1+ = position in queue */
  queuePosition?: number;
  isSelected?: boolean;
  onClick?: () => void;
  onDeleteClick?: () => void;
  /** Story 5.8.1 (AC-5.8.1.7): Callback to retry failed documents */
  onRetryClick?: () => void;
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
 * - AC-4.5.1: Inline rename trigger (edit icon, context menu, double-click)
 * - AC-4.5.2: Inline rename behavior (Enter saves, Escape cancels, blur saves)
 * - AC-4.5.3: Rename validation
 * - AC-4.5.4: Rename persistence
 */
export function DocumentListItem({
  id,
  filename,
  displayName,
  status,
  createdAt,
  labels = [],
  queuePosition,
  isSelected = false,
  onClick,
  onDeleteClick,
  onRetryClick,
}: DocumentListItemProps) {
  const name = displayName || filename;

  // Inline rename state - AC-4.5.1, AC-4.5.2
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Validate rename input - AC-4.5.3
  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Name cannot be empty';
    if (trimmed.length > 255) return 'Name too long (max 255 characters)';
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      return 'Name cannot contain path separators';
    }
    return null;
  };

  // Start editing
  const startEditing = () => {
    setEditValue(name);
    setError(null);
    setIsEditing(true);
  };

  // Cancel editing - AC-4.5.2
  const cancelEditing = () => {
    setEditValue(name);
    setError(null);
    setIsEditing(false);
  };

  // Save rename - AC-4.5.4
  const saveRename = async () => {
    const trimmed = editValue.trim();

    // Skip if unchanged
    if (trimmed === name) {
      setIsEditing(false);
      return;
    }

    // Validate
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      inputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const result = await renameDocument(id, trimmed);
      if (result.success) {
        setIsEditing(false);
        setError(null);
        // Show success feedback
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1000);
      } else {
        setError(result.error || 'Rename failed');
        toast.error(result.error || 'Failed to rename document');
        inputRef.current?.focus();
      }
    } catch {
      setError('Rename failed');
      toast.error('Failed to rename document');
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard events - AC-4.5.2
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div
      className={cn(
        'group relative w-full px-3 py-2.5 transition-colors',
        'hover:bg-slate-100',
        // AC-4.3.8: Selected document styling
        isSelected && 'bg-[#f1f5f9] border-l-2 border-l-[#475569]',
        !isSelected && 'border-l-2 border-l-transparent',
        // Success highlight animation - AC-4.5.4
        showSuccess && 'bg-green-50'
      )}
    >
      {isEditing ? (
        // Edit mode - AC-4.5.2
        <div className="flex-1 flex items-center gap-3">
          {/* Document icon */}
          <div className="flex-shrink-0">
            <FileText className="h-4 w-4 text-slate-500" />
          </div>

          {/* Inline input */}
          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setError(null);
              }}
              onBlur={saveRename}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className={cn(
                'w-full px-1.5 py-0.5 text-sm font-medium rounded border',
                'focus:outline-none focus:ring-2 focus:ring-slate-400',
                error ? 'border-red-500 text-red-700' : 'border-slate-300 text-slate-700',
                isSaving && 'opacity-50'
              )}
              aria-label="Document name"
              aria-invalid={!!error}
            />
            {error && (
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            )}
          </div>
        </div>
      ) : (
        // Display mode - Two-Row Layout
        <>
          {/* Row 1: Icon + Filename + Status - clickable area */}
          <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onDoubleClick={(e) => {
              e.preventDefault();
              startEditing();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400'
            )}
            aria-current={isSelected ? 'page' : undefined}
          >
            {/* Document icon */}
            <div className="flex-shrink-0">
              <FileText className="h-4 w-4 text-slate-500" />
            </div>

            {/* Filename - truncated */}
            <p
              className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700"
              title={name}
            >
              {name}
            </p>

            {/* Status indicator - AC-4.3.3, AC-4.7.4 */}
            <div className="flex-shrink-0">
              <DocumentStatusBadge
                status={status as DocumentStatusType}
                queuePosition={queuePosition}
              />
            </div>
          </div>

          {/* Row 2: Date/Labels + Actions (on hover) */}
          <div className="flex items-center justify-between mt-1 ml-7">
            {/* Date and Labels */}
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xs text-slate-500 flex-shrink-0">
                {formatRelativeDate(createdAt)}
              </p>
              {/* Labels - AC-4.5.7 */}
              {labels.length > 0 && (
                <div className="flex items-center gap-1 overflow-hidden">
                  {labels.slice(0, 2).map((label) => (
                    <LabelPill
                      key={label.id}
                      id={label.id}
                      name={label.name}
                      color={label.color}
                      className="text-[10px] px-1.5 py-0"
                    />
                  ))}
                  {labels.length > 2 && (
                    <span className="text-[10px] text-slate-400">
                      +{labels.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons - appear on hover - AC-4.4.1, AC-4.5.1 */}
            <div
              className={cn(
                'flex items-center gap-0.5 -mr-1',
                // Show retry button always for failed docs (AC-5.8.1.6), otherwise on hover
                status === 'failed' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                'transition-opacity focus-within:opacity-100',
                // Always visible on touch devices
                'max-md:opacity-100'
              )}
            >
              {/* Retry button for failed documents - Story 5.8.1 (AC-5.8.1.6) */}
              {status === 'failed' && onRetryClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetryClick();
                  }}
                  className={cn(
                    'p-1 rounded hover:bg-slate-200 text-amber-600 hover:text-amber-700 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
                  )}
                  aria-label={`Retry processing ${name}`}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Edit/rename button - pencil icon - AC-4.5.1 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
                className={cn(
                  'p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
                )}
                aria-label={`Rename ${name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {/* Direct delete button - trash icon */}
              {onDeleteClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick();
                  }}
                  className={cn(
                    'p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-600 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
                  )}
                  aria-label={`Delete ${name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Context menu - three-dot menu - AC-4.5.1 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400'
                    )}
                    aria-label={`More options for ${name}`}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  {onDeleteClick && (
                    <>
                      <DropdownMenuSeparator />
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
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
