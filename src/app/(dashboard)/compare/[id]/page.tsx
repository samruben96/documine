'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Building,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { ComparisonData, QuoteExtraction, DocumentSummary } from '@/types/compare';

/**
 * Comparison Result Page
 *
 * Story 7.1: AC-7.1.7 - Loading state while extraction begins
 * Story 7.2: AC-7.2.8 - Display extraction status and summary
 * Placeholder for Story 7.3 (Comparison Table View)
 */

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds while processing

export default function ComparisonPage() {
  const params = useParams();
  const comparisonId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    try {
      const response = await fetch(`/api/compare/${comparisonId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch comparison');
      }
      const data = await response.json();
      setComparison(data);
      return data.status;
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
      setError(err instanceof Error ? err.message : 'Comparison not found or access denied');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [comparisonId]);

  useEffect(() => {
    // Initial fetch
    fetchComparison();
  }, [fetchComparison]);

  // Poll while processing
  useEffect(() => {
    if (!comparison || comparison.status !== 'processing') {
      return;
    }

    const intervalId = setInterval(async () => {
      const status = await fetchComparison();
      if (status !== 'processing') {
        clearInterval(intervalId);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [comparison?.status, fetchComparison]);

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
        <XCircle className="h-12 w-12 text-red-500" />
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

  const isProcessing = comparison.status === 'processing';
  const isComplete = comparison.status === 'complete';
  const isPartial = comparison.status === 'partial';
  const isFailed = comparison.status === 'failed';

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
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quote Comparison
            </h1>
            <p className="text-sm text-slate-500">
              Comparing {comparison.documents?.length || 0} documents
            </p>
          </div>
          <StatusBadge status={comparison.status} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isProcessing ? (
          <ProcessingView documents={comparison.documents} />
        ) : isFailed ? (
          <FailedView />
        ) : (
          <ExtractionSummaryView
            documents={comparison.documents}
            extractions={comparison.extractions}
            isPartial={isPartial}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: ComparisonData['status'] }) {
  switch (status) {
    case 'processing':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case 'complete':
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      );
    case 'partial':
      return (
        <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100">
          <AlertCircle className="h-3 w-3" />
          Partial
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

// ============================================================================
// Processing View
// ============================================================================

function ProcessingView({ documents }: { documents?: DocumentSummary[] }) {
  const extractedCount = documents?.filter((d) => d.extracted).length || 0;
  const totalCount = documents?.length || 0;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Extracting quote data...
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {extractedCount} of {totalCount} documents processed
        </p>
      </div>

      {/* Document progress */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {documents?.map((doc, index) => (
          <div
            key={doc.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              doc.extracted
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            {doc.extracted ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            )}
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Quote {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Failed View
// ============================================================================

function FailedView() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <XCircle className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Extraction Failed
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Unable to extract data from the selected documents. Please try again.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/compare">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Try Again
        </Link>
      </Button>
    </div>
  );
}

// ============================================================================
// Extraction Summary View
// ============================================================================

function ExtractionSummaryView({
  documents,
  extractions,
  isPartial,
}: {
  documents?: DocumentSummary[];
  extractions?: QuoteExtraction[];
  isPartial: boolean;
}) {
  if (!extractions || extractions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No extraction data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partial warning */}
      {isPartial && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Some documents could not be fully extracted. Results may be incomplete.
          </p>
        </div>
      )}

      {/* Extraction summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {extractions.map((extraction, index) => (
          <ExtractionCard
            key={index}
            extraction={extraction}
            document={documents?.[index]}
            index={index}
          />
        ))}
      </div>

      {/* Placeholder for comparison table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparison Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <p>Detailed comparison table will be implemented in Story 7.3</p>
            <p className="text-sm mt-2">
              Coverage comparison, gap analysis, and difference highlighting coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Extraction Card
// ============================================================================

function ExtractionCard({
  extraction,
  document,
  index,
}: {
  extraction: QuoteExtraction;
  document?: DocumentSummary;
  index: number;
}) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            {index + 1}
          </div>
          <span className="truncate">{extraction.carrierName || 'Unknown Carrier'}</span>
        </CardTitle>
        {document && (
          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {document.filename}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {/* Named Insured */}
        <div className="flex items-center gap-2 text-sm">
          <Building className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Insured:</span>
          <span className="font-medium truncate">{extraction.namedInsured || '—'}</span>
        </div>

        {/* Premium */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Premium:</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(extraction.annualPremium)}
          </span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Period:</span>
          <span className="font-medium">
            {formatDate(extraction.effectiveDate)} — {formatDate(extraction.expirationDate)}
          </span>
        </div>

        {/* Coverage count */}
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Coverages:</span>
          <Badge variant="secondary" className="text-xs">
            {extraction.coverages.length} found
          </Badge>
        </div>

        {/* Exclusions count */}
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Exclusions:</span>
          <Badge variant="secondary" className="text-xs">
            {extraction.exclusions.length} found
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Types
// ============================================================================

interface ComparisonResponse {
  comparisonId: string;
  status: ComparisonData['status'];
  documents?: DocumentSummary[];
  extractions?: QuoteExtraction[];
  createdAt?: string;
  completedAt?: string;
}
