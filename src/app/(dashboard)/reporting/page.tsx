'use client';

/**
 * Reporting Page
 * Epic 23: Flexible AI Reports
 * Story 23.1: File Upload Infrastructure
 * Story 23.3: Prompt Input UI
 *
 * Upload any data file (Excel, CSV, PDF) and get AI-generated reports.
 *
 * UI Flow State Machine:
 * 1. Initial: Show FileUploader only
 * 2. Uploading: FileUploader with progress
 * 3. Analyzing: Show "Analyzing your data..." spinner below uploader
 * 4. Ready: Show PromptInput + SuggestedPrompts + Generate button
 * 5. Generating: Disabled state during generation (Story 23.4)
 */

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/reporting/file-uploader';
import { PromptInput } from '@/components/reporting/prompt-input';
import { SuggestedPrompts } from '@/components/reporting/suggested-prompts';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useReportingAnalysis } from '@/hooks/use-reporting-analysis';
import { cn } from '@/lib/utils';

/**
 * UI Flow States
 * AC-23.3.5: Loading state shown while analysis is in progress
 */
type PageState = 'initial' | 'analyzing' | 'ready' | 'generating' | 'error';

export default function ReportingPage() {
  // Upload state
  const [uploadedSourceId, setUploadedSourceId] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  // Prompt state
  const [prompt, setPrompt] = useState('');

  // Generation state (Story 23.4)
  const [isGenerating, setIsGenerating] = useState(false);

  // Analysis hook
  const {
    analyze,
    data: analysisData,
    isLoading: isAnalyzing,
    error: analysisError,
    reset: resetAnalysis,
  } = useReportingAnalysis();

  // Derive current page state
  const getPageState = (): PageState => {
    if (analysisError) return 'error';
    if (isGenerating) return 'generating';
    if (analysisData) return 'ready';
    if (isAnalyzing) return 'analyzing';
    return 'initial';
  };

  const pageState = getPageState();

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
  };

  const handleGenerateReport = async () => {
    if (!uploadedSourceId) return;
    setIsGenerating(true);
    // TODO: Story 23.4 - Call /api/reporting/generate
    console.log('Generate report:', {
      sourceId: uploadedSourceId,
      prompt: prompt || '(auto-analyze)',
    });
    setTimeout(() => setIsGenerating(false), 2000); // Placeholder
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

  // AC-23.3.4: Generate button enabled after file upload completes (prompt is optional)
  const canGenerate = pageState === 'ready' && !isGenerating;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-900">Data Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload any data file and let AI generate insights and visualizations
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
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

            {/* Analyzing indicator - AC-23.3.5 */}
            {pageState === 'analyzing' && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
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

          {/* Error Alert - AC-23.3.6 */}
          {pageState === 'error' && analysisError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription className="mt-2">
                <p>{analysisError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryAnalysis}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Step 2: Prompt Input - AC-23.3.1, AC-23.3.2, AC-23.3.3 */}
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

            <PromptInput
              value={prompt}
              onChange={setPrompt}
              disabled={pageState !== 'ready' && pageState !== 'generating'}
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

          {/* Placeholder for report output - TODO: Story 23.4+ */}
          {isGenerating && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500">
                Your AI-generated report will appear here...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
