'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, BarChart3, Plus, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { QuoteSelector } from '@/components/compare/quote-selector';
import { ComparisonHistory } from '@/components/compare/comparison-history';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
      // Include documents with null document_type for backward compatibility
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, display_name, status, created_at, document_type')
        .or('document_type.eq.quote,document_type.is.null')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast document_type from Supabase (string) to our typed union
      setDocuments((data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'quote' | 'general' | null
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
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {view === 'history' ? 'Compare Quotes' : 'New Comparison'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
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
              disabled={selectedIds.length < 2 || selectedIds.length > 4 || isComparing}
              className="min-w-[120px]"
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Comparing...
                </>
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
          <QuoteSelector
            documents={documents}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onDocumentUploaded={handleDocumentUploaded}
            maxSelections={4}
            minSelections={2}
          />
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
