'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Comparison Result Page
 *
 * Story 7.1: AC-7.1.7 - Loading state while extraction begins
 * This is a placeholder for Story 7.3 (Comparison Table View)
 */
export default function ComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const comparisonId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('comparisons')
          .select('*')
          .eq('id', comparisonId)
          .single();

        if (error) throw error;
        setComparison(data);
      } catch (err) {
        console.error('Failed to fetch comparison:', err);
        setError('Comparison not found or access denied');
      } finally {
        setIsLoading(false);
      }
    }

    fetchComparison();
  }, [comparisonId]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading comparison...</p>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error || 'Comparison not found'}</p>
        <Button variant="outline" asChild>
          <Link href="/compare">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Compare
          </Link>
        </Button>
      </div>
    );
  }

  const comparisonData = comparison.comparison_data as ComparisonData;
  const isProcessing = comparisonData?.status === 'processing';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compare">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quote Comparison
            </h1>
            <p className="text-sm text-slate-500">
              Comparing {comparison.document_ids?.length || 0} documents
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Extracting quote data...
              </p>
              <p className="text-sm text-slate-500 mt-1">
                This may take a minute. We&apos;re analyzing each document for coverage details.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">
              Comparison table will be implemented in Story 7.3
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Document IDs: {comparison.document_ids?.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface Comparison {
  id: string;
  agency_id: string;
  user_id: string;
  document_ids: string[];
  comparison_data: unknown;
  created_at: string | null;
}

interface ComparisonData {
  status: 'processing' | 'complete' | 'failed';
  documents?: { id: string; extracted: boolean }[];
}
