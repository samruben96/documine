'use client';

import { useState, useCallback } from 'react';
import { FileText, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { SelectableDocument } from '@/hooks/use-one-pager-data';

/**
 * DocumentSelector Props
 * AC-9.3.4: Component for selecting documents in direct access mode.
 */
interface DocumentSelectorProps {
  /** List of available documents */
  documents: SelectableDocument[];
  /** Loading state */
  isLoading?: boolean;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Callback when generate is clicked with selected document IDs */
  onGenerate: (documentIds: string[]) => void;
  /** Callback when user wants to use existing comparison */
  onUseComparison?: () => void;
}

/**
 * DocumentSelector Component
 * Story 9.3: AC-9.3.4 - Document selection for direct access mode.
 * Allows user to select 1-4 documents to include in one-pager.
 */
export function DocumentSelector({
  documents,
  isLoading = false,
  maxSelections = 4,
  onGenerate,
  onUseComparison,
}: DocumentSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((docId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else if (next.size < maxSelections) {
        next.add(docId);
      }
      return next;
    });
  }, [maxSelections]);

  const handleGenerate = useCallback(() => {
    onGenerate(Array.from(selectedIds));
  }, [selectedIds, onGenerate]);

  const isMaxSelected = selectedIds.size >= maxSelections;
  const canGenerate = selectedIds.size >= 1;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <FileText className="h-12 w-12 text-slate-300" />
          <div className="text-center">
            <p className="font-medium text-slate-700 dark:text-slate-300">No documents available</p>
            <p className="text-sm text-slate-500 mt-1">
              Upload and process documents first to generate a one-pager.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/documents">Go to Documents</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Select Documents
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose up to {maxSelections} documents to include in your one-pager.
          </p>
        </div>

        {onUseComparison && (
          <Button variant="outline" size="sm" onClick={onUseComparison}>
            Use Existing Comparison
          </Button>
        )}
      </div>

      {/* Selection counter */}
      <div className="flex items-center gap-2">
        <Badge
          variant={selectedIds.size > 0 ? 'default' : 'secondary'}
          className="text-sm"
        >
          {selectedIds.size} of {maxSelections} selected
        </Badge>
        {isMaxSelected && (
          <span className="text-xs text-slate-500">Maximum reached</span>
        )}
      </div>

      {/* Document grid */}
      <div
        className="grid gap-4 md:grid-cols-2"
        data-testid="document-selector-grid"
      >
        {documents.map((doc) => {
          const isSelected = selectedIds.has(doc.id);
          const isDisabled = !isSelected && isMaxSelected;

          return (
            <Card
              key={doc.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-slate-400'
              }`}
              onClick={() => !isDisabled && handleToggle(doc.id)}
              data-testid={`document-item-${doc.id}`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={() => handleToggle(doc.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-slate-900 dark:text-slate-100 truncate"
                    title={doc.filename}
                  >
                    {doc.filename}
                  </p>
                  {doc.carrierName && (
                    <p className="text-sm text-slate-500 truncate">
                      {doc.carrierName}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generate button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!canGenerate}
          onClick={handleGenerate}
          data-testid="generate-button"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate One-Pager
        </Button>
      </div>
    </div>
  );
}
