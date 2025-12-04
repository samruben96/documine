'use client';

import { FileText, Clock, FileStack } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils/date';
import { DocumentStatusBadge, type DocumentStatusType } from './document-status';
import { LabelPill } from './label-pill';
import type { Label } from '@/app/(dashboard)/chat-docs/actions';

interface DocumentCardProps {
  id: string;
  filename: string;
  displayName?: string | null;
  status: string;
  pageCount?: number | null;
  createdAt: string;
  labels?: Label[];
  /** Document type (quote | general) - will be available after F2-2 */
  documentType?: string | null;
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
  className,
}: DocumentCardProps) {
  const router = useRouter();
  const name = displayName || filename;

  const handleClick = () => {
    router.push(`/chat-docs/${id}`);
  };

  return (
    <Card
      data-testid="document-card"
      onClick={handleClick}
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:border-primary/50 hover:shadow-md',
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
          <DocumentStatusBadge status={status as DocumentStatusType} />
          {/* Document type badge - defaults to "quote" until F2-2 adds categorization */}
          <Badge variant="outline" className="text-xs">
            {documentType || 'quote'}
          </Badge>
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
      </CardContent>
    </Card>
  );
}
