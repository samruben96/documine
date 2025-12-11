'use client';

import { FileText, Clock, FileStack } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/date';
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';
import { DocumentTypeToggle } from './document-type-toggle';
import { ExtractionStatusBadge } from './extraction-status-badge';
import { LabelPill } from './label-pill';
import type { Label } from '@/app/(dashboard)/chat-docs/actions';
import type { DocumentType, ExtractionStatus } from '@/types';

interface DocumentCardProps {
  id: string;
  filename: string;
  displayName?: string | null;
  status: string;
  pageCount?: number | null;
  createdAt: string;
  labels?: Label[];
  /** Document type (quote | general) */
  documentType?: DocumentType | null;
  /** Callback when document type is changed via toggle */
  onTypeChange?: (id: string, type: DocumentType) => void;
  /** Shows loading state on type toggle during update */
  isUpdatingType?: boolean;
  /** AI-generated tags (Story F2-3: AC-F2-3.1) */
  aiTags?: string[] | null;
  /** AI-generated summary (Story F2-3: AC-F2-3.2) */
  aiSummary?: string | null;
  /** Story 10.12: Carrier name from extraction_data */
  carrierName?: string | null;
  /** Story 10.12: Annual premium from extraction_data */
  annualPremium?: number | null;
  /** Story 11.8: Extraction status for quote analysis */
  extractionStatus?: ExtractionStatus | null;
  /** Story 11.8: Callback when extraction retry is requested */
  onRetryExtraction?: (id: string) => void;
  /** Story 11.8: Whether extraction retry is in progress */
  isRetryingExtraction?: boolean;
  className?: string;
}

/**
 * Document Card Component
 *
 * Story F2-1: Grid card for document library
 * Implements:
 * - AC-F2-1.3: Shows filename, upload date, page count, status, type badge, tags
 * - AC-F2-1.4: Click navigates to /chat-docs/[id] viewer
 */
export function DocumentCard({
  id,
  filename,
  displayName,
  status,
  pageCount,
  createdAt,
  labels = [],
  documentType,
  onTypeChange,
  isUpdatingType = false,
  aiTags,
  aiSummary,
  carrierName,
  annualPremium,
  extractionStatus,
  onRetryExtraction,
  isRetryingExtraction = false,
  className,
}: DocumentCardProps) {
  const router = useRouter();
  const name = displayName || filename;

  const handleTypeChange = (newType: DocumentType) => {
    onTypeChange?.(id, newType);
  };

  const handleClick = () => {
    router.push(`/chat-docs/${id}`);
  };

  return (
    <Card
      data-testid="document-card"
      hoverable
      onClick={handleClick}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Open document: ${name}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Status and Type badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DocumentStatusBadge status={status as DocumentStatusType} />
            {/* Story 11.8: Extraction status badge - only for ready quote documents */}
            {status === 'ready' && documentType !== 'general' && (
              <ExtractionStatusBadge
                status={extractionStatus || null}
                documentType={documentType}
                onRetry={onRetryExtraction ? () => onRetryExtraction(id) : undefined}
                isRetrying={isRetryingExtraction}
              />
            )}
          </div>
          {/* Document type toggle - AC-F2-2.3: UI toggle/dropdown to change document type */}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DocumentTypeToggle
              type={documentType}
              onTypeChange={handleTypeChange}
              isLoading={isUpdatingType}
              disabled={status !== 'ready'}
            />
          </div>
        </div>

        {/* Document icon and name */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {name}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="break-all">{name}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          {/* Upload date */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeDate(createdAt)}</span>
          </div>
          {/* Page count */}
          {pageCount !== null && pageCount !== undefined && (
            <div className="flex items-center gap-1">
              <FileStack className="h-3 w-3" />
              <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
            </div>
          )}
        </div>

        {/* Story 10.12: Carrier and Premium from extraction_data */}
        {(carrierName || annualPremium) && (
          <div
            className="flex items-center justify-between text-xs"
            data-testid="quote-info"
          >
            {carrierName && (
              <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px] font-medium">
                {carrierName}
              </span>
            )}
            {annualPremium && (
              <span className="text-slate-500 dark:text-slate-500 font-semibold">
                ${annualPremium.toLocaleString()}/yr
              </span>
            )}
          </div>
        )}

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {labels.slice(0, 3).map((label) => (
              <LabelPill
                key={label.id}
                id={label.id}
                name={label.name}
                color={label.color}
                className="text-[10px] px-1.5 py-0"
              />
            ))}
            {labels.length > 3 && (
              <span className="text-[10px] text-slate-400">
                +{labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* AI Tags (Story F2-3: AC-F2-3.6) */}
        {aiTags && aiTags.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-1 flex-wrap"
                data-testid="ai-tags"
              >
                {aiTags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
                {aiTags.length > 3 && (
                  <span className="text-[10px] text-slate-400">
                    +{aiTags.length - 3}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            {aiSummary && (
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-xs">{aiSummary}</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
}
