/**
 * Audit Log Table Component
 * Story 20.4: Audit Log Interface
 *
 * Table component displaying audit log entries with pagination.
 * AC-20.4.1: Columns: date/time, user, project, conversation title, message count, guardrail badge
 * AC-20.4.3: Paginated at 25 per page with total count displayed
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldAlert,
  AlertCircle,
  Upload,
  Trash2,
  FileEdit,
  GitCompare,
  Download,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import type { AuditLogTableEntry } from '@/app/api/admin/audit-logs/route';
import type { AuditAction } from '@/lib/admin/audit-logger';

export interface AuditLogTableProps {
  /** Audit log entries to display */
  entries: AuditLogTableEntry[];
  /** Total number of entries (for pagination) */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Callback when row is clicked */
  onRowClick: (entry: AuditLogTableEntry) => void;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback to retry on error */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format timestamp for table display
 */
function formatDateTime(isoString: string): string {
  try {
    return format(new Date(isoString), 'MMM d, yyyy h:mm a');
  } catch {
    return isoString;
  }
}

/**
 * Truncate text for display
 */
function truncateText(text: string | null, maxLength: number = 30): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Action type display configuration
 * Story 21.4 (AC-21.4.5): All action types visible in unified audit view
 */
const ACTION_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  category: 'document' | 'comparison' | 'one-pager' | 'chat' | 'ai-buddy' | 'admin';
}> = {
  // Document Library actions
  document_uploaded: { label: 'Document Uploaded', icon: Upload, variant: 'secondary', category: 'document' },
  document_deleted: { label: 'Document Deleted', icon: Trash2, variant: 'destructive', category: 'document' },
  document_modified: { label: 'Document Modified', icon: FileEdit, variant: 'secondary', category: 'document' },
  // Comparison actions
  comparison_created: { label: 'Comparison Created', icon: GitCompare, variant: 'secondary', category: 'comparison' },
  comparison_exported: { label: 'Comparison Exported', icon: Download, variant: 'outline', category: 'comparison' },
  // One-Pager actions
  one_pager_generated: { label: 'One-Pager Generated', icon: ClipboardList, variant: 'secondary', category: 'one-pager' },
  one_pager_exported: { label: 'One-Pager Exported', icon: Download, variant: 'outline', category: 'one-pager' },
  // Document Chat actions
  document_chat_started: { label: 'Document Chat Started', icon: MessageSquare, variant: 'secondary', category: 'chat' },
  // AI Buddy actions (existing)
  message_sent: { label: 'Message Sent', icon: MessageSquare, variant: 'default', category: 'ai-buddy' },
  message_received: { label: 'Message Received', icon: MessageSquare, variant: 'default', category: 'ai-buddy' },
  guardrail_triggered: { label: 'Guardrail Triggered', icon: ShieldAlert, variant: 'destructive', category: 'ai-buddy' },
  conversation_created: { label: 'Conversation Created', icon: MessageSquare, variant: 'secondary', category: 'ai-buddy' },
  conversation_deleted: { label: 'Conversation Deleted', icon: Trash2, variant: 'destructive', category: 'ai-buddy' },
  project_created: { label: 'Project Created', icon: FileText, variant: 'secondary', category: 'ai-buddy' },
  project_archived: { label: 'Project Archived', icon: FileText, variant: 'outline', category: 'ai-buddy' },
  document_attached: { label: 'Document Attached', icon: FileText, variant: 'secondary', category: 'ai-buddy' },
  document_removed: { label: 'Document Removed', icon: FileText, variant: 'outline', category: 'ai-buddy' },
  preferences_updated: { label: 'Preferences Updated', icon: FileEdit, variant: 'outline', category: 'ai-buddy' },
  guardrails_configured: { label: 'Guardrails Configured', icon: ShieldAlert, variant: 'secondary', category: 'admin' },
  // Admin actions
  user_invited: { label: 'User Invited', icon: FileText, variant: 'secondary', category: 'admin' },
  user_removed: { label: 'User Removed', icon: Trash2, variant: 'destructive', category: 'admin' },
  permission_granted: { label: 'Permission Granted', icon: FileText, variant: 'secondary', category: 'admin' },
  permission_revoked: { label: 'Permission Revoked', icon: FileText, variant: 'outline', category: 'admin' },
  ownership_transferred: { label: 'Ownership Transferred', icon: FileText, variant: 'secondary', category: 'admin' },
  ownership_transfer_failed: { label: 'Transfer Failed', icon: AlertCircle, variant: 'destructive', category: 'admin' },
};

/**
 * Get display config for an action type, with fallback for unknown types
 */
function getActionConfig(action: string) {
  return ACTION_TYPE_CONFIG[action] || {
    label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: FileText,
    variant: 'outline' as const,
    category: 'other' as const,
  };
}

/**
 * Action Type Badge Component
 * AC-21.4.5: Visual indicator for action type
 */
function ActionTypeBadge({ action }: { action: string }) {
  const config = getActionConfig(action);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 whitespace-nowrap">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

/**
 * Action Details Component
 * Story 21.4: Context-aware details display based on action type
 */
function ActionDetails({ entry }: { entry: AuditLogTableEntry }) {
  const metadata = entry.metadata || {};

  // Document actions - show filename
  if (entry.action.startsWith('document_') && metadata.filename) {
    return (
      <span title={metadata.filename as string}>
        {truncateText(metadata.filename as string, 30)}
      </span>
    );
  }

  // Comparison actions - show document count
  if (entry.action.startsWith('comparison_') && metadata.documentIds) {
    const docIds = metadata.documentIds as string[];
    return <span>{docIds.length} documents</span>;
  }

  // One-pager actions - show source info
  if (entry.action.startsWith('one_pager_')) {
    if (metadata.sourceComparisonId) {
      return <span>From comparison</span>;
    }
    if (metadata.sourceDocumentId) {
      return <span>From document</span>;
    }
    return <span>-</span>;
  }

  // Document chat - show conversation info
  if (entry.action === 'document_chat_started') {
    return <span>Document chat session</span>;
  }

  // AI Buddy conversation title or project name
  if (entry.conversationTitle) {
    return (
      <span title={entry.conversationTitle}>
        {truncateText(entry.conversationTitle, 30)}
      </span>
    );
  }

  if (entry.projectName) {
    return (
      <span title={entry.projectName}>
        {truncateText(entry.projectName, 25)}
      </span>
    );
  }

  // Fallback - show first non-standard metadata key value
  const meaningfulKeys = ['filename', 'documentId', 'comparisonId', 'userId', 'email', 'role'];
  for (const key of meaningfulKeys) {
    if (metadata[key]) {
      return (
        <span title={String(metadata[key])}>
          {truncateText(String(metadata[key]), 30)}
        </span>
      );
    }
  }

  return <span className="text-xs">—</span>;
}

/**
 * Loading skeleton for table
 */
function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date/Time</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Details</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="audit-log-empty"
    >
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No audit log entries</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Audit log entries will appear here when activity occurs.
      </p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="audit-log-error"
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium">Failed to load audit logs</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {error.message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Pagination controls component
 */
function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className="flex items-center justify-between px-2 py-4"
      data-testid="pagination-controls"
    >
      <p className="text-sm text-muted-foreground" data-testid="pagination-info">
        Showing {start} to {end} of {total} entries
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          data-testid="prev-page-btn"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground" data-testid="page-indicator">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          data-testid="next-page-btn"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Audit Log Table component
 *
 * @example
 * ```tsx
 * <AuditLogTable
 *   entries={logs}
 *   total={100}
 *   page={1}
 *   pageSize={25}
 *   totalPages={4}
 *   isLoading={false}
 *   error={null}
 *   onRowClick={(entry) => setSelectedEntry(entry)}
 *   onPageChange={(page) => setPage(page)}
 * />
 * ```
 */
export function AuditLogTable({
  entries,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRowClick,
  onPageChange,
  onRetry,
  className,
}: AuditLogTableProps) {
  // Loading state
  if (isLoading && entries.length === 0) {
    return (
      <div className={className} data-testid="audit-log-table-loading">
        <TableSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={className} data-testid="audit-log-table">
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Details</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(entry)}
                data-testid={`audit-log-row-${entry.id}`}
              >
                {/* Date/Time */}
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(entry.loggedAt)}
                </TableCell>

                {/* User */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium" title={entry.userEmail}>
                      {truncateText(entry.userName || entry.userEmail, 25)}
                    </span>
                    {entry.userName && (
                      <span className="text-xs text-muted-foreground" title={entry.userEmail}>
                        {truncateText(entry.userEmail, 20)}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Action Type (Story 21.4: AC-21.4.5) */}
                <TableCell>
                  <ActionTypeBadge action={entry.action} />
                </TableCell>

                {/* Details - context-aware based on action type */}
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  <ActionDetails entry={entry} />
                </TableCell>

                {/* Status/Count */}
                <TableCell className="text-center">
                  {entry.guardrailEventCount > 0 ? (
                    <Badge
                      variant="destructive"
                      className="gap-1"
                      data-testid="guardrail-badge"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      {entry.guardrailEventCount}
                    </Badge>
                  ) : entry.messageCount > 0 ? (
                    <Badge variant="secondary" className="min-w-[2rem]">
                      {entry.messageCount} msg
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (AC-20.4.3) */}
      {total > pageSize && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
