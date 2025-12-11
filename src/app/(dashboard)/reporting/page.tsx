'use client';

/**
 * Reporting Page
 * Epic 23: Flexible AI Reports
 * Story 23.1: File Upload Infrastructure
 * Story 23.3: Prompt Input UI
 * Story 23.4: AI Report Generation
 *
 * Upload any data file (Excel, CSV, PDF) and get AI-generated reports.
 *
 * UI Flow State Machine:
 * 1. Initial: Show FileUploader only
 * 2. Uploading: FileUploader with progress
 * 3. Analyzing: Show "Analyzing your data..." spinner below uploader
 * 4. Ready: Show PromptInput + SuggestedPrompts + Generate button
 * 5. Generating: Show progress indicator during AI generation
 * 6. Report: Show ReportView with generated report
 * 7. Error: Show error alert with retry option
 */

import { useState, useEffect, useCallback } from 'react';
import { FileUploader } from '@/components/reporting/file-uploader';
import { PromptInput } from '@/components/reporting/prompt-input';
import { SuggestedPrompts } from '@/components/reporting/suggested-prompts';
import { ReportView } from '@/components/reporting/report-view';
import { ReportingError } from '@/components/reporting/reporting-error';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  XCircle,
} from 'lucide-react';
import { useReportingAnalysis } from '@/hooks/use-reporting-analysis';
import { useReportGeneration } from '@/hooks/use-report-generation';
import { cn } from '@/lib/utils';

/**
 * UI Flow States
 * AC-23.3.5: Loading state shown while analysis is in progress
 * AC-23.4.4: Generating state shows streaming progress feedback
 */
type PageState =
  | 'initial'
  | 'analyzing'
  | 'ready'
  | 'generating'
  | 'report'
  | 'error';

/**
 * Stage labels for progress display
 */
const STAGE_LABELS = {
  analyzing: 'Analyzing data structure...',
  generating: 'Generating insights...',
  charting: 'Creating chart recommendations...',
} as const;

export default function ReportingPage() {
  // Upload state
  const [uploadedSourceId, setUploadedSourceId] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  // Prompt state
  const [prompt, setPrompt] = useState('');

  // Analysis hook
  const {
    analyze,
    data: analysisData,
    isLoading: isAnalyzing,
    error: analysisError,
    reset: resetAnalysis,
  } = useReportingAnalysis();

  // Generation hook (AC-23.4.4)
  const {
    generate,
    report,
    isGenerating,
    progress,
    streamingTitle,
    streamingSummary,
    streamingInsights,
    error: generationError,
    reset: resetGeneration,
    cancel: cancelGeneration,
  } = useReportGeneration();

  // Derive current page state
  const getPageState = useCallback((): PageState => {
    if (report) return 'report';
    if (generationError || analysisError) return 'error';
    if (isGenerating) return 'generating';
    if (analysisData) return 'ready';
    if (isAnalyzing) return 'analyzing';
    return 'initial';
  }, [report, generationError, analysisError, isGenerating, analysisData, isAnalyzing]);

  const pageState = getPageState();

  // Get current error message
  const errorMessage = generationError || analysisError;

  // Trigger analysis after successful upload
  useEffect(() => {
    if (uploadedSourceId && !analysisData && !isAnalyzing && !analysisError) {
      analyze(uploadedSourceId);
    }
  }, [uploadedSourceId, analysisData, isAnalyzing, analysisError, analyze]);

  const handleUploadComplete = (sourceId: string, filename: string) => {
    setUploadedSourceId(sourceId);
    setUploadedFilename(filename);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setUploadedSourceId(null);
    setUploadedFilename(null);
  };

  const handleNewFile = () => {
    // Reset all state for new file upload
    setUploadedSourceId(null);
    setUploadedFilename(null);
    setPrompt('');
    resetAnalysis();
    resetGeneration();
  };

  const handleGenerateReport = async () => {
    if (!uploadedSourceId) return;
    // AC-23.4.3: prompt is optional - auto-analysis if blank
    await generate(uploadedSourceId, prompt || undefined);
  };

  const handleSuggestedPromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleRetryAnalysis = () => {
    if (uploadedSourceId) {
      resetAnalysis();
      analyze(uploadedSourceId);
    }
  };

  const handleRetryGeneration = () => {
    if (uploadedSourceId) {
      resetGeneration();
      // Re-trigger generation with same prompt
      generate(uploadedSourceId, prompt || undefined);
    }
  };

  const handleNewReport = () => {
    // Go back to ready state to allow new generation
    resetGeneration();
    setPrompt('');
  };

  const handleCancelGeneration = () => {
    cancelGeneration();
  };

  // AC-23.3.4: Generate button enabled after file upload completes (prompt is optional)
  const canGenerate = pageState === 'ready' && !isGenerating;

  // Show report view when report is available
  if (pageState === 'report' && report) {
    return (
      <div className="flex flex-col h-full">
        {/* Skip link for accessibility (AC-23.8.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>

        {/* Header */}
        {/* Story DR.3: AC-DR.3.4 - text-2xl font-semibold text-slate-900 */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900">Data Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload any data file and let AI generate insights and visualizations
          </p>
        </div>

        {/* Report Content */}
        <main id="main-content" className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            <ReportView report={report} onNewReport={handleNewReport} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Skip link for accessibility (AC-23.8.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Header */}
      {/* Story DR.3: AC-DR.3.4 - text-2xl font-semibold text-slate-900 */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-slate-900">Data Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload any data file and let AI generate insights and visualizations
        </p>
      </div>

      {/* Content */}
      <main id="main-content" className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Step 1: Upload Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-slate-900">
                Step 1: Upload Your Data
              </h2>
              {uploadedFilename && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewFile}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Upload different file
                </Button>
              )}
            </div>

            {/* Show uploader or uploaded file status */}
            {!uploadedFilename ? (
              <FileUploader
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">
                    {uploadedFilename}
                  </p>
                  <p className="text-xs text-emerald-600">File uploaded successfully</p>
                </div>
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
            )}

            {/* Analyzing indicator - AC-23.3.5, AC-23.8.1, AC-23.8.2: Enhanced loading state with pulse animation */}
            {pageState === 'analyzing' && (
              <div
                className="mt-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse"
                role="status"
                aria-live="polite"
                aria-label="Analyzing your data"
              >
                <div className="relative flex-shrink-0">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" aria-hidden="true" />
                  <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Analyzing your data...
                  </p>
                  <p className="text-xs text-blue-600">
                    Detecting column types and preparing suggestions
                  </p>
                </div>
              </div>
            )}

            {/* Help text - only show before upload */}
            {!uploadedFilename && (
              <div className="mt-6 rounded-md bg-slate-50 p-4">
                <h3 className="text-sm font-medium text-slate-700">
                  Supported Formats
                </h3>
                <ul className="mt-2 text-sm text-slate-600 space-y-1">
                  <li>
                    <span className="font-medium">Excel:</span> .xlsx, .xls spreadsheets
                  </li>
                  <li>
                    <span className="font-medium">CSV:</span> Comma-separated data files
                  </li>
                  <li>
                    <span className="font-medium">PDF:</span> Documents with tables (will
                    be extracted)
                  </li>
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Maximum file size: 50MB. Files are securely processed within your
                  agency.
                </p>
              </div>
            )}
          </div>

          {/* Error Alert - AC-23.4.7, AC-23.8.3: Enhanced error component */}
          {pageState === 'error' && errorMessage && (
            <ReportingError
              type={generationError ? 'generation' : 'analysis'}
              message={errorMessage}
              onRetry={generationError ? handleRetryGeneration : handleRetryAnalysis}
              onUploadNew={handleNewFile}
            />
          )}

          {/* Generating Progress - AC-23.4.4, AC-23.8.1: aria-live for dynamic updates */}
          {pageState === 'generating' && (
            <div
              className="rounded-lg border border-blue-200 bg-blue-50 p-6"
              role="status"
              aria-live="polite"
              aria-label="Generating your report"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Generating Your Report
                    </p>
                    <p className="text-xs text-blue-600">
                      {progress
                        ? STAGE_LABELS[progress.stage]
                        : 'Starting generation...'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelGeneration}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>

              {/* Progress bar */}
              {progress && (
                <Progress value={progress.percent} className="h-2 mb-4" />
              )}

              {/* Streaming preview */}
              {(streamingTitle || streamingSummary || streamingInsights.length > 0) && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                  {streamingTitle && (
                    <h3 className="font-medium text-slate-900 mb-2">{streamingTitle}</h3>
                  )}
                  {streamingSummary && (
                    <p className="text-sm text-slate-600 mb-2 line-clamp-3">
                      {streamingSummary}
                    </p>
                  )}
                  {streamingInsights.length > 0 && (
                    <p className="text-xs text-slate-400">
                      {streamingInsights.length} insight
                      {streamingInsights.length !== 1 ? 's' : ''} found...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Prompt Input - AC-23.3.1, AC-23.3.2, AC-23.3.3, AC-23.8.2: Skeleton during analysis */}
          <div
            className={cn(
              'rounded-lg border border-slate-200 bg-white p-6 transition-opacity duration-300',
              pageState !== 'ready' && pageState !== 'generating' && 'opacity-50'
            )}
          >
            <h2 className="text-base font-medium text-slate-900 mb-2">
              Step 2: What report do you want?{' '}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Describe what you want to see, or leave blank for AI to generate the best
              analysis automatically.
            </p>

            {/* Skeleton loader during analysis (AC-23.8.2) */}
            {pageState === 'analyzing' ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-[100px] bg-slate-100 rounded-md" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-24" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-7 bg-slate-100 rounded-full w-32" />
                    <div className="h-7 bg-slate-100 rounded-full w-40" />
                    <div className="h-7 bg-slate-100 rounded-full w-28" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  disabled={pageState !== 'ready'}
                />

                {/* Suggested prompts - AC-23.3.3 */}
                {analysisData?.suggestedPrompts && (
                  <div className="mt-4">
                    <SuggestedPrompts
                      prompts={analysisData.suggestedPrompts}
                      onSelect={handleSuggestedPromptSelect}
                      disabled={pageState !== 'ready'}
                    />
                  </div>
                )}

                {/* Analysis metadata (for debugging/transparency) */}
                {analysisData && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      {analysisData.columns.length} columns detected &middot;{' '}
                      {analysisData.rowCount.toLocaleString()} rows
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Generate Button - AC-23.3.4 */}
          <Button
            onClick={handleGenerateReport}
            disabled={!canGenerate}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
