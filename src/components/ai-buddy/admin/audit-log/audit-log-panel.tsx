/**
 * Audit Log Panel Component
 * Story 20.4: Audit Log Interface
 *
 * Main panel composing filters, table, export button, and transcript modal.
 * AC-20.4.1 through AC-20.4.10: Full audit log interface
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSearch, AlertCircle, Loader2 } from 'lucide-react';
import { AuditLogTable } from './audit-log-table';
import { AuditFilters, type AuditLogFilters, type UserOption } from './audit-filters';
import { TranscriptModal } from './transcript-modal';
import { ExportButton } from './export-button';
import { useAuditLogs } from '@/hooks/ai-buddy/use-audit-logs';
import { pdf } from '@react-pdf/renderer';
import { AuditLogPdfDocument } from '@/lib/ai-buddy/admin/pdf-export-template';
import type { AuditLogTableEntry } from '@/app/api/admin/audit-logs/route';

export interface AuditLogPanelProps {
  /** Whether the user has view_audit_logs permission */
  hasPermission?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for the panel
 */
function PanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-6 w-[150px]" />
        </div>
        {/* Table skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Permission denied state
 */
function PermissionDenied() {
  return (
    <Card data-testid="audit-log-permission-denied">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to view audit logs.
            Contact your administrator to request the &quot;view_audit_logs&quot; permission.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Audit Log Panel component
 *
 * @example
 * ```tsx
 * <AuditLogPanel hasPermission={hasViewAuditLogsPermission} />
 * ```
 */
export function AuditLogPanel({
  hasPermission = false,
  className,
}: AuditLogPanelProps) {
  // State
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogTableEntry | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Use audit logs hook
  const {
    logs,
    isLoading,
    error,
    totalCount,
    page,
    pageSize,
    totalPages,
    setPage,
    setFilters: setHookFilters,
    refetch,
  } = useAuditLogs({
    initialFilters: filters,
  });

  // Fetch agency users for filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.users) {
            setUsers(
              data.data.users.map((u: { id: string; name: string | null; email: string }) => ({
                id: u.id,
                name: u.name,
                email: u.email,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    if (hasPermission) {
      fetchUsers();
    }
  }, [hasPermission]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setHookFilters(newFilters);
  }, [setHookFilters]);

  // Handle row click to open transcript
  const handleRowClick = useCallback((entry: AuditLogTableEntry) => {
    setSelectedEntry(entry);
    if (entry.conversationId) {
      setTranscriptOpen(true);
    }
  }, []);

  // Handle CSV export
  const handleCsvExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', 'csv');
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
      if (filters.search) params.set('search', filters.search);
      if (filters.hasGuardrailEvents) params.set('hasGuardrailEvents', 'true');

      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          filters: {
            userId: filters.userId,
            startDate: filters.startDate?.toISOString(),
            endDate: filters.endDate?.toISOString(),
            search: filters.search,
            hasGuardrailEvents: filters.hasGuardrailEvents,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'audit-log-export.csv';

      // Download the CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  // Handle PDF export
  const handlePdfExport = useCallback(async (includeTranscripts: boolean) => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          filters: {
            userId: filters.userId,
            startDate: filters.startDate?.toISOString(),
            endDate: filters.endDate?.toISOString(),
            search: filters.search,
            hasGuardrailEvents: filters.hasGuardrailEvents,
          },
          includeTranscripts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Generate PDF on client using react-pdf
      const pdfBlob = await pdf(
        <AuditLogPdfDocument data={result.data} />
      ).toBlob();

      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  // Permission check
  if (!hasPermission) {
    return <PermissionDenied />;
  }

  return (
    <Card className={className} data-testid="audit-log-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <CardDescription>
              View and export conversation audit logs for compliance tracking
            </CardDescription>
          </div>
          <ExportButton
            filters={filters}
            onExportCsv={handleCsvExport}
            onExportPdf={handlePdfExport}
            isExporting={isExporting}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <AuditFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          users={users}
          usersLoading={usersLoading}
        />

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'} found`
            )}
          </span>
        </div>

        {/* Table */}
        <AuditLogTable
          entries={logs}
          total={totalCount}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading}
          error={error}
          onRowClick={handleRowClick}
          onPageChange={setPage}
          onRetry={refetch}
        />

        {/* Transcript Modal */}
        <TranscriptModal
          conversationId={selectedEntry?.conversationId ?? null}
          open={transcriptOpen}
          onOpenChange={setTranscriptOpen}
        />
      </CardContent>
    </Card>
  );
}
