'use client';

/**
 * Extraction Pending Banner Component
 *
 * Story 11.7: Comparison Page - Extraction Status Handling
 * AC-11.7.2: Pending Extraction Banner
 * AC-11.7.3: Alternative Actions
 *
 * Shows a friendly banner when documents are still being analyzed,
 * with estimated time and a link to chat while waiting.
 */

import { Loader2, MessageSquare, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { estimateExtractionTime } from '@/lib/compare/extraction-readiness';
import type { DocumentWithExtraction } from '@/lib/compare/extraction-readiness';

interface ExtractionPendingBannerProps {
  /** Documents waiting in queue */
  pendingDocs: DocumentWithExtraction[];
  /** Documents currently being extracted */
  extractingDocs: DocumentWithExtraction[];
  /** All selected document IDs (for chat link) */
  selectedDocIds: string[];
  /** Documents that failed extraction */
  failedDocs?: DocumentWithExtraction[];
  /** Callback to retry failed extraction */
  onRetry?: (docId: string) => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
}

/**
 * ExtractionPendingBanner
 *
 * Displays when one or more documents are still being analyzed.
 * Provides:
 * - List of pending/extracting documents with spinners
 * - Estimated time based on page count
 * - Link to chat with documents while waiting
 * - Retry button for failed documents
 */
export function ExtractionPendingBanner({
  pendingDocs,
  extractingDocs,
  selectedDocIds,
  failedDocs = [],
  onRetry,
  isRetrying = false,
}: ExtractionPendingBannerProps) {
  const allPending = [...pendingDocs, ...extractingDocs];
  const estimatedSeconds = estimateExtractionTime(allPending);
  const hasFailures = failedDocs.length > 0;

  // If nothing to show, return null
  if (allPending.length === 0 && failedDocs.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="extraction-pending-banner"
      className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3 flex-shrink-0">
          <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Analyzing Quote Details
          </h3>

          <p className="text-blue-700 dark:text-blue-300 mt-1">
            We're extracting coverage information from{' '}
            {allPending.length} document{allPending.length !== 1 ? 's' : ''}.
            This usually takes 15-30 seconds.
          </p>

          {/* Pending Documents List */}
          {allPending.length > 0 && (
            <div className="mt-3 space-y-2">
              {allPending.map((doc) => (
                <div
                  key={doc.id}
                  data-testid="extraction-pending-doc"
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
                >
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="truncate">
                    {doc.display_name || doc.filename}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Failed Documents */}
          {hasFailures && (
            <div className="mt-3 space-y-2">
              {failedDocs.map((doc) => (
                <div
                  key={doc.id}
                  data-testid="extraction-failed-indicator"
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {doc.display_name || doc.filename}
                  </span>
                  {onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(doc.id)}
                      disabled={isRetrying}
                      className="h-6 px-2 text-xs ml-auto"
                      data-testid="extraction-retry-button"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Estimated Time */}
          {allPending.length > 0 && (
            <div
              data-testid="extraction-estimate"
              className="flex items-center gap-2 mt-4 text-sm text-blue-600 dark:text-blue-400"
            >
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Estimated: ~{estimatedSeconds}s remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Alternative Action: Chat while waiting */}
      <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-blue-700 dark:text-blue-300">
            You can chat with these documents while we finish the analysis!
          </span>
        </div>

        <Link
          href={`/chat-docs/${selectedDocIds[0]}`}
          data-testid="chat-while-waiting-link"
        >
          <Button
            variant="outline"
            className="mt-3 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat with Documents
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * ExtractionFailedBanner
 *
 * Shown when all documents have failed extraction.
 * Provides retry option and warning about incomplete comparison.
 */
interface ExtractionFailedBannerProps {
  /** Documents that failed extraction */
  failedDocs: DocumentWithExtraction[];
  /** Documents that are ready */
  readyDocs: DocumentWithExtraction[];
  /** Callback to retry failed extraction */
  onRetry?: (docId: string) => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Callback to proceed with partial data */
  onProceedAnyway?: () => void;
}

export function ExtractionFailedBanner({
  failedDocs,
  readyDocs,
  onRetry,
  isRetrying = false,
  onProceedAnyway,
}: ExtractionFailedBannerProps) {
  const canProceed = readyDocs.length >= 2;

  return (
    <div
      data-testid="extraction-failed-banner"
      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="bg-amber-100 dark:bg-amber-900/50 rounded-full p-3 flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Some Documents Couldn't Be Analyzed
          </h3>

          <p className="text-amber-700 dark:text-amber-300 mt-1">
            {failedDocs.length} document{failedDocs.length !== 1 ? 's' : ''} failed
            to extract. You can retry or proceed with available data.
          </p>

          {/* Failed Documents List */}
          <div className="mt-3 space-y-2">
            {failedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1">
                  {doc.display_name || doc.filename}
                </span>
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetry(doc.id)}
                    disabled={isRetrying}
                    className="h-7 px-2 text-xs"
                    data-testid="extraction-retry-button"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Proceed anyway option */}
          {canProceed && onProceedAnyway && (
            <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                You have {readyDocs.length} documents ready. Comparison may be incomplete.
              </p>
              <Button
                variant="outline"
                onClick={onProceedAnyway}
                className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
              >
                Proceed with Available Data
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
