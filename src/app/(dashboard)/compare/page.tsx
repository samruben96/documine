'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { QuoteSelector } from '@/components/compare/quote-selector';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Compare Quotes Page
 *
 * Story 7.1: Quote Selection Interface
 * AC-7.1.1: Compare page shows document cards with selection checkboxes
 * AC-7.1.7: Navigate to comparison view with loading state
 */
export default function ComparePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch documents on mount
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('documents')
          .select('id, filename, display_name, status, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

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
    const supabase = createClient();
    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, display_name, status, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Compare Quotes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select 2-4 documents to compare side-by-side
            </p>
          </div>

          {/* Compare Button - AC-7.1.4, AC-7.1.7 */}
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
        </div>
      </div>

      {/* Quote Selector */}
      <div className="flex-1 overflow-auto p-6">
        <QuoteSelector
          documents={documents}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onDocumentUploaded={handleDocumentUploaded}
          maxSelections={4}
          minSelections={2}
        />
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
}
