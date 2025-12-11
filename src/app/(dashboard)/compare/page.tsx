'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, BarChart3, Plus, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { typography, spacing } from '@/lib/typography';
import { cn } from '@/lib/utils';
import { QuoteSelector } from '@/components/compare/quote-selector';
import { ComparisonHistory } from '@/components/compare/comparison-history';
import { ExtractionPendingBanner, ExtractionFailedBanner } from '@/components/compare/extraction-pending-banner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useExtractionStatus, useExtractionRetry } from '@/hooks/use-extraction-status';
import { getExtractionReadiness, type DocumentWithExtraction } from '@/lib/compare/extraction-readiness';

/**
 * Compare Quotes Page
 *
 * Story 7.1: Quote Selection Interface
 * Story 7.7: Comparison History (AC-7.7.1 - AC-7.7.8)
 *
 * Two views:
 * - 'history' (default): Shows comparison history with filters and deletion
 * - 'new': Shows document cards for creating new comparison
 */

type ViewMode = 'history' | 'new';

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View mode from URL or default to history
  const viewParam = searchParams.get('view');
  const [view, setView] = useState<ViewMode>(viewParam === 'new' ? 'new' : 'history');

  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Story 11.7: Track extraction status for selected documents
  const { statusMap, isLoading: isLoadingExtractionStatus, refresh: refreshExtractionStatus } = useExtractionStatus(selectedIds);
  const { retry: retryExtraction, isRetrying } = useExtractionRetry();

  // Fetch documents when switching to new comparison view
  useEffect(() => {
    if (view === 'new') {
      fetchDocuments();
    }
  }, [view]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      // Story F2-4: Only show quote-type documents for comparison
      // Story 11.7: Include extraction_status and extraction_data for readiness check
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, display_name, status, created_at, document_type, extraction_status, extraction_data, page_count')
        .or('document_type.eq.quote,document_type.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast types from Supabase to our typed union
      setDocuments((data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'quote' | 'general' | null,
        extraction_status: doc.extraction_status as Document['extraction_status'],
      })));
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle compare button click
  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      toast.error('Select at least 2 documents to compare');
      return;
    }

    setIsComparing(true);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: selectedIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create comparison');
      }

      const { comparisonId } = await response.json();
      router.push(`/compare/${comparisonId}`);
    } catch (error) {
      console.error('Failed to create comparison:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create comparison');
      setIsComparing(false);
    }
  };

  // Handle selection change
  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  // Handle new document uploaded (refresh list)
  const handleDocumentUploaded = async () => {
    await fetchDocuments();
  };

  // Switch to new comparison view
  const handleNewComparison = () => {
    setView('new');
    setSelectedIds([]);
    router.push('/compare?view=new', { scroll: false });
  };

  // Switch back to history view
  const handleBackToHistory = () => {
    setView('history');
    setSelectedIds([]);
    router.push('/compare', { scroll: false });
  };

  // Story 11.7: Compute extraction readiness for selected documents
  // Merge realtime status updates with document data
  // FIX: Don't use document fallback while loading - this prevents the race condition
  // where banner flashes on first document selection before status fetch completes
  const selectedDocsWithStatus = useMemo((): DocumentWithExtraction[] => {
    const result: DocumentWithExtraction[] = [];

    for (const id of selectedIds) {
      const doc = documents.find(d => d.id === id);
      if (!doc) continue;

      // Use realtime status if available
      const realtimeStatus = statusMap[id];
      if (realtimeStatus) {
        result.push({
          ...doc,
          extraction_status: realtimeStatus.status,
          extraction_data: realtimeStatus.hasData ? doc.extraction_data || {} : null,
        });
      } else if (isLoadingExtractionStatus) {
        // While loading, treat document as pending to prevent banner flash
        result.push({
          ...doc,
          extraction_status: 'pending',
          extraction_data: null,
        });
      } else {
        // Fallback to document data only after loading completes
        result.push(doc);
      }
    }

    return result;
  }, [selectedIds, documents, statusMap, isLoadingExtractionStatus]);

  const extractionReadiness = useMemo(
    () => getExtractionReadiness(selectedDocsWithStatus),
    [selectedDocsWithStatus]
  );

  // Handle retry for failed extraction
  const handleRetryExtraction = async (docId: string) => {
    await retryExtraction(docId);
    // Refresh status after retry
    await refreshExtractionStatus();
    await fetchDocuments();
  };

  // Story 11.7: AC-11.7.1 - Block comparison if extraction not ready
  const canCompare = selectedIds.length >= 2 &&
    selectedIds.length <= 4 &&
    extractionReadiness.allReady &&
    !isComparing;

  // Show pending banner for selected docs that need extraction
  const showPendingBanner =
    selectedIds.length > 0 &&
    !extractionReadiness.allReady &&
    (extractionReadiness.pendingDocs.length > 0 || extractionReadiness.extractingDocs.length > 0);

  // Show failed banner if some docs failed but we have enough ready docs
  const showFailedBanner =
    selectedIds.length > 0 &&
    extractionReadiness.failedDocs.length > 0 &&
    extractionReadiness.allReady;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === 'new' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHistory}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div>
              {/* Story DR.8: AC-DR.8.1 - Page title typography */}
              <h1 className={cn(typography.pageTitle, 'flex items-center gap-2')}>
                <BarChart3 className="h-5 w-5 text-primary" />
                {view === 'history' ? 'Compare Quotes' : 'New Comparison'}
              </h1>
              <p className={cn(typography.muted, 'mt-1')}>
                {view === 'history'
                  ? 'View past comparisons or create a new one'
                  : 'Select 2-4 documents to compare side-by-side'}
              </p>
            </div>
          </div>

          {view === 'history' ? (
            <Button onClick={handleNewComparison} className="gap-2">
              <Plus className="h-4 w-4" />
              New Comparison
            </Button>
          ) : (
            <Button
              onClick={handleCompare}
              disabled={!canCompare}
              className="min-w-[120px]"
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Comparing...
                </>
              ) : !extractionReadiness.allReady && selectedIds.length >= 2 ? (
                'Waiting for analysis...'
              ) : (
                `Compare (${selectedIds.length})`
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {view === 'history' ? (
          <ComparisonHistory onNewComparison={handleNewComparison} />
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className={spacing.section}>
            {/* Story 11.7: Extraction Pending Banner (AC-11.7.2, AC-11.7.3) */}
            {showPendingBanner && (
              <ExtractionPendingBanner
                pendingDocs={extractionReadiness.pendingDocs}
                extractingDocs={extractionReadiness.extractingDocs}
                selectedDocIds={selectedIds}
                failedDocs={extractionReadiness.failedDocs}
                onRetry={handleRetryExtraction}
                isRetrying={isRetrying}
              />
            )}

            {/* Story 11.7: Extraction Failed Banner (AC-11.7.6) */}
            {showFailedBanner && (
              <ExtractionFailedBanner
                failedDocs={extractionReadiness.failedDocs}
                readyDocs={extractionReadiness.readyDocs}
                onRetry={handleRetryExtraction}
                isRetrying={isRetrying}
                onProceedAnyway={extractionReadiness.readyDocs.length >= 2 ? handleCompare : undefined}
              />
            )}

            {/* Document Selection Grid */}
            <QuoteSelector
              documents={documents}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onDocumentUploaded={handleDocumentUploaded}
              maxSelections={4}
              minSelections={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface Document {
  id: string;
  filename: string;
  display_name: string | null;
  status: string;
  created_at: string;
  document_type: 'quote' | 'general' | null;
  extraction_status: 'pending' | 'extracting' | 'complete' | 'failed' | 'skipped' | null;
  extraction_data: unknown | null;
  page_count: number | null;
}

// Wrap in Suspense for useSearchParams
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
