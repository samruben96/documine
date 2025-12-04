'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Download, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { toast } from 'sonner';

import { useOnePagerData } from '@/hooks/use-one-pager-data';
import { useAgencyBranding } from '@/hooks/use-agency-branding';
import { useAgencyId } from '@/hooks/use-document-status';
import { DocumentSelector } from '@/components/one-pager/document-selector';
import { OnePagerForm, type OnePagerFormData } from '@/components/one-pager/one-pager-form';
import { OnePagerPreview } from '@/components/one-pager/one-pager-preview';
import { downloadOnePagerPdf } from '@/lib/one-pager/pdf-template';

/**
 * One-Pager Page Content
 *
 * Story 9.3: Main page for generating one-pagers.
 * Supports three entry modes via searchParams:
 * - AC-9.3.2: ?comparisonId=xxx (comparison mode)
 * - AC-9.3.3: ?documentId=xxx (document mode)
 * - AC-9.3.4: No params (select mode)
 */
function OnePagerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get entry parameters
  const comparisonId = searchParams.get('comparisonId');
  const documentId = searchParams.get('documentId');

  // Fetch one-pager data based on entry mode
  const { data, isLoading, error, loadComparison } = useOnePagerData(
    comparisonId,
    documentId
  );

  // Fetch agency branding
  const { agencyId } = useAgencyId();
  const { branding, isLoading: isBrandingLoading } = useAgencyBranding(agencyId);

  // Form state (lifted for preview coordination)
  const [formData, setFormData] = useState<OnePagerFormData>({
    clientName: '',
    agentNotes: '',
  });

  // Track if form is being edited (for debounce indicator)
  const [isFormUpdating, setIsFormUpdating] = useState(false);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle form changes (debounced from OnePagerForm)
  const handleFormChange = useCallback((newData: OnePagerFormData) => {
    setFormData(newData);
    setIsFormUpdating(false);
  }, []);

  // Update client name when data loads
  useMemo(() => {
    if (data?.defaultClientName && !formData.clientName) {
      setFormData((prev) => ({
        ...prev,
        clientName: data.defaultClientName,
      }));
    }
  }, [data?.defaultClientName, formData.clientName]);

  // Handle document selection in select mode
  const handleDocumentGenerate = useCallback(async (documentIds: string[]) => {
    if (documentIds.length === 1) {
      // Single document - navigate with documentId param
      router.push(`/one-pager?documentId=${documentIds[0]}`);
    } else if (documentIds.length > 1) {
      // Multiple documents - create a comparison first
      try {
        const response = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to create comparison');
        }

        const { comparisonId: newComparisonId } = await response.json();
        router.push(`/one-pager?comparisonId=${newComparisonId}`);
      } catch (err) {
        console.error('Error creating comparison:', err);
        toast.error('Failed to process selected documents');
      }
    }
  }, [router]);

  // Handle PDF download
  // AC-9.3.8: Download with filename docuMINE-one-pager-YYYY-MM-DD.pdf
  const handleDownload = useCallback(async () => {
    if (!data?.extractions.length) {
      toast.error('No data available for PDF generation');
      return;
    }

    if (!formData.clientName) {
      toast.error('Please enter a client name');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadOnePagerPdf(
        formData.clientName,
        formData.agentNotes || '',
        data.extractions,
        branding
      );
      toast.success('One-pager downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  }, [data?.extractions, formData, branding]);

  // Navigate to comparison history to use existing comparison
  const handleUseComparison = useCallback(() => {
    router.push('/compare/history');
  }, [router]);

  // Loading state
  if (isLoading || isBrandingLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-sm text-red-600">{error.message}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  // Select mode - show document selector
  if (data?.entryMode === 'select') {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generate One-Pager
              </h1>
              <p className="text-sm text-slate-500">
                Select documents to include in your summary
              </p>
            </div>
          </div>

          {/* Document Selector */}
          <DocumentSelector
            documents={data.selectableDocuments}
            onGenerate={handleDocumentGenerate}
            onUseComparison={handleUseComparison}
          />
        </div>
      </div>
    );
  }

  // Comparison or Document mode - show split layout with form and preview
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 dark:border-slate-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                One-Pager
              </h1>
              <p className="text-sm text-slate-500">
                {data?.extractions.length === 1
                  ? 'Single quote summary'
                  : `Comparing ${data?.extractions.length || 0} quotes`}
              </p>
            </div>
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading || !data?.extractions.length}
            data-testid="download-button"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Split Layout: Form (left) | Preview (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Panel (40%) */}
        <div className="w-full lg:w-2/5 border-r dark:border-slate-800 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customize One-Pager</CardTitle>
            </CardHeader>
            <CardContent>
              <OnePagerForm
                defaultClientName={data?.defaultClientName}
                onChange={handleFormChange}
                debounceMs={300}
              />
            </CardContent>
          </Card>

          {/* Data summary card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quote Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {data?.extractions.map((extraction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {extraction.carrierName || `Quote ${index + 1}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {extraction.coverages.length} coverages •{' '}
                        {extraction.exclusions.length} exclusions
                      </p>
                    </div>
                    {extraction.annualPremium && (
                      <span className="font-medium text-primary">
                        ${extraction.annualPremium.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel (60%) - hidden on mobile */}
        <div className="hidden lg:flex lg:w-3/5 bg-slate-100 dark:bg-slate-800/50 overflow-auto p-6">
          <div className="w-full max-w-2xl mx-auto">
            <OnePagerPreview
              clientName={formData.clientName}
              agentNotes={formData.agentNotes}
              extractions={data?.extractions || []}
              branding={branding}
              isUpdating={isFormUpdating}
            />
          </div>
        </div>
      </div>

      {/* Mobile Preview Toggle (shown on smaller screens) */}
      <div className="lg:hidden border-t dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
        <Button variant="outline" className="w-full" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function OnePagerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <OnePagerPageContent />
    </Suspense>
  );
}
