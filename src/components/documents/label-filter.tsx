'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Label } from '@/app/(dashboard)/documents/actions';

interface LabelFilterProps {
  /** All available labels */
  allLabels: Label[];
  /** Currently selected label IDs */
  selectedLabelIds: string[];
  /** Called when selection changes */
  onSelectionChange: (labelIds: string[]) => void;
  className?: string;
}

/**
 * Label Filter Component
 *
 * Dropdown filter for selecting labels to filter documents.
 * Supports multiple selection with AND logic.
 *
 * Implements AC-4.5.9
 */
export function LabelFilter({
  allLabels,
  selectedLabelIds,
  onSelectionChange,
  className,
}: LabelFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedLabelIds.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onSelectionChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onSelectionChange([...selectedLabelIds, labelId]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Filter trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          hasSelection
            ? 'bg-slate-100 border-slate-300 text-slate-700'
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Filter className="h-3.5 w-3.5" />
        <span>Labels</span>
        {hasSelection && (
          <span className="px-1 py-0.5 text-[10px] bg-slate-200 rounded-full">
            {selectedLabelIds.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-48 max-h-64 overflow-auto',
            'bg-white rounded-md border border-slate-200 shadow-lg',
            'py-1'
          )}
          role="listbox"
          aria-multiselectable="true"
        >
          {/* Clear filter option */}
          {hasSelection && (
            <>
              <button
                type="button"
                onClick={clearSelection}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs',
                  'hover:bg-slate-100 text-slate-600'
                )}
              >
                <X className="h-3.5 w-3.5" />
                Clear filter
              </button>
              <div className="my-1 border-t border-slate-100" />
            </>
          )}

          {/* Label options */}
          {allLabels.length > 0 ? (
            allLabels.map((label) => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs',
                    'hover:bg-slate-100',
                    isSelected && 'bg-slate-50'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color || '#64748b' }}
                  />
                  <span className="flex-1 truncate">{label.name}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              No labels yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
