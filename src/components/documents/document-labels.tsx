'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LabelPill } from './label-pill';
import { LabelInput } from './label-input';
import {
  getLabels,
  createLabel,
  addLabelToDocument,
  removeLabelFromDocument,
  type Label,
} from '@/app/(dashboard)/chat-docs/actions';
import { toast } from 'sonner';

interface DocumentLabelsProps {
  /** Document ID */
  documentId: string;
  /** Labels already attached to this document */
  labels: Label[];
  /** Maximum labels allowed (soft limit with warning) */
  maxLabels?: number;
  /** Show compact view (pills only, no input until clicked) */
  compact?: boolean;
  className?: string;
}

/**
 * Document Labels Component
 *
 * Displays and manages labels for a document.
 * Shows label pills with remove buttons.
 * Includes autocomplete input for adding labels.
 *
 * Implements AC-4.5.5, AC-4.5.6, AC-4.5.7, AC-4.5.8
 */
export function DocumentLabels({
  documentId,
  labels: initialLabels,
  maxLabels = 5,
  compact = false,
  className,
}: DocumentLabelsProps) {
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(!compact);

  // Load all agency labels for autocomplete
  const loadAllLabels = useCallback(async () => {
    const result = await getLabels();
    if (result.success && result.labels) {
      setAllLabels(result.labels);
    }
  }, []);

  useEffect(() => {
    loadAllLabels();
  }, [loadAllLabels]);

  // Update labels when props change
  useEffect(() => {
    setLabels(initialLabels);
  }, [initialLabels]);

  // Handle adding an existing label to document
  const handleSelectLabel = async (labelId: string) => {
    // Check max labels limit
    if (labels.length >= maxLabels) {
      toast.warning(`Maximum ${maxLabels} labels allowed per document`);
      return;
    }

    // Find the label in allLabels
    const label = allLabels.find((l) => l.id === labelId);
    if (!label) return;

    // Optimistically add label
    setLabels((prev) => [...prev, label]);

    // Persist to database
    const result = await addLabelToDocument(documentId, labelId);
    if (!result.success) {
      // Revert on error
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      toast.error(result.error || 'Failed to add label');
    }
  };

  // Handle creating a new label and adding to document
  const handleCreateLabel = async (name: string) => {
    // Check max labels limit
    if (labels.length >= maxLabels) {
      toast.warning(`Maximum ${maxLabels} labels allowed per document`);
      return;
    }

    setIsLoading(true);
    try {
      // Create the label
      const createResult = await createLabel(name);
      if (!createResult.success || !createResult.label) {
        toast.error(createResult.error || 'Failed to create label');
        return;
      }

      const newLabel = createResult.label;

      // Add to allLabels
      setAllLabels((prev) => [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name)));

      // Add to document
      setLabels((prev) => [...prev, newLabel]);

      const addResult = await addLabelToDocument(documentId, newLabel.id);
      if (!addResult.success) {
        // Revert on error
        setLabels((prev) => prev.filter((l) => l.id !== newLabel.id));
        toast.error(addResult.error || 'Failed to add label');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing label from document
  const handleRemoveLabel = async (labelId: string) => {
    // Optimistically remove
    const removedLabel = labels.find((l) => l.id === labelId);
    setLabels((prev) => prev.filter((l) => l.id !== labelId));

    // Persist to database
    const result = await removeLabelFromDocument(documentId, labelId);
    if (!result.success && removedLabel) {
      // Revert on error
      setLabels((prev) => [...prev, removedLabel]);
      toast.error(result.error || 'Failed to remove label');
    }
  };

  const existingLabelIds = labels.map((l) => l.id);
  const atLimit = labels.length >= maxLabels;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {/* Label pills - AC-4.5.7 */}
      {labels.map((label) => (
        <LabelPill
          key={label.id}
          id={label.id}
          name={label.name}
          color={label.color}
          onRemove={handleRemoveLabel}
        />
      ))}

      {/* Label input - AC-4.5.5 */}
      {!compact && !atLimit && (
        <LabelInput
          allLabels={allLabels}
          existingLabelIds={existingLabelIds}
          onSelectLabel={handleSelectLabel}
          onCreateLabel={handleCreateLabel}
          disabled={isLoading}
          className="w-28"
        />
      )}

      {/* Compact mode: show add button when clicked */}
      {compact && !showInput && !atLimit && (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className={cn(
            'px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600',
            'border border-dashed border-slate-300 rounded-full',
            'hover:border-slate-400 transition-colors'
          )}
        >
          + Add
        </button>
      )}

      {/* Compact mode: show input when expanded */}
      {compact && showInput && !atLimit && (
        <LabelInput
          allLabels={allLabels}
          existingLabelIds={existingLabelIds}
          onSelectLabel={(id) => {
            handleSelectLabel(id);
            setShowInput(false);
          }}
          onCreateLabel={(name) => {
            handleCreateLabel(name);
            setShowInput(false);
          }}
          disabled={isLoading}
          className="w-28"
        />
      )}

      {/* Max labels warning - AC-4.5.7 */}
      {atLimit && (
        <span className="text-xs text-slate-400 italic">
          Max {maxLabels} labels
        </span>
      )}
    </div>
  );
}
