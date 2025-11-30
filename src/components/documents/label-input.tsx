'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Label } from '@/app/(dashboard)/documents/actions';

interface LabelInputProps {
  /** All available labels for autocomplete */
  allLabels: Label[];
  /** Labels already on this document (to exclude from suggestions) */
  existingLabelIds: string[];
  /** Called when user selects an existing label */
  onSelectLabel: (labelId: string) => void;
  /** Called when user creates a new label */
  onCreateLabel: (name: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  className?: string;
}

/**
 * Label Input Component
 *
 * Autocomplete input for adding labels to a document.
 * Shows existing agency labels as suggestions.
 * Allows creating new labels by typing and pressing Enter.
 *
 * Implements AC-4.5.5, AC-4.5.6
 */
export function LabelInput({
  allLabels,
  existingLabelIds,
  onSelectLabel,
  onCreateLabel,
  disabled = false,
  className,
}: LabelInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter labels: exclude already-attached and filter by input
  const filteredLabels = allLabels.filter((label) => {
    // Exclude labels already on document
    if (existingLabelIds.includes(label.id)) return false;
    // Filter by input text (case-insensitive)
    if (inputValue && !label.name.toLowerCase().includes(inputValue.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Check if input matches an existing label exactly (case-insensitive)
  const exactMatch = allLabels.find(
    (l) => l.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  // Show "Create new" option if input doesn't match existing label
  const showCreateOption = inputValue.trim().length > 0 && !exactMatch;

  // All options including create
  const optionsCount = filteredLabels.length + (showCreateOption ? 1 : 0);

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

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, optionsCount - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (optionsCount === 0) return;

        // If highlighting a label, select it
        if (highlightedIndex < filteredLabels.length) {
          const label = filteredLabels[highlightedIndex];
          if (label) {
            onSelectLabel(label.id);
            setInputValue('');
            setIsOpen(false);
          }
        } else if (showCreateOption) {
          // Create new label
          onCreateLabel(inputValue.trim());
          setInputValue('');
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectLabel = (labelId: string) => {
    onSelectLabel(labelId);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleCreateLabel = () => {
    if (inputValue.trim()) {
      onCreateLabel(inputValue.trim());
      setInputValue('');
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button that expands to input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Add label..."
          className={cn(
            'w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200',
            'focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400',
            'placeholder:text-slate-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Add label"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Dropdown */}
      {isOpen && optionsCount > 0 && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full max-h-48 overflow-auto',
            'bg-white rounded-md border border-slate-200 shadow-lg',
            'py-1'
          )}
          role="listbox"
        >
          {/* Existing labels */}
          {filteredLabels.map((label, index) => (
            <button
              key={label.id}
              type="button"
              onClick={() => handleSelectLabel(label.id)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs',
                'hover:bg-slate-100',
                highlightedIndex === index && 'bg-slate-100'
              )}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: label.color || '#64748b' }}
              />
              <span className="truncate">{label.name}</span>
            </button>
          ))}

          {/* Create new option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateLabel}
              onMouseEnter={() => setHighlightedIndex(filteredLabels.length)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs',
                'hover:bg-slate-100 text-slate-600',
                highlightedIndex === filteredLabels.length && 'bg-slate-100'
              )}
              role="option"
              aria-selected={highlightedIndex === filteredLabels.length}
            >
              <Plus className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Create "{inputValue.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
