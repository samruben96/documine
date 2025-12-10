import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin Panel Skeleton Component
 * Story 22.2: AC-22.2.1 - Shared skeleton for admin sub-panels
 * Configurable options for search header, rows, and columns
 */

export interface AdminPanelSkeletonProps {
  /** Show search bar skeleton */
  showSearch?: boolean;
  /** Show filter controls skeleton */
  showFilters?: boolean;
  /** Number of table rows to render (default 5) */
  rows?: number;
  /** Number of table columns (default 5) */
  columns?: number;
  /** Custom column widths (optional) */
  columnWidths?: string[];
  /** Show card wrapper (default true) */
  showCard?: boolean;
  /** Additional class names */
  className?: string;
}

export function AdminPanelSkeleton({
  showSearch = true,
  showFilters = false,
  rows = 5,
  columns = 5,
  columnWidths,
  showCard = true,
  className,
}: AdminPanelSkeletonProps) {
  const content = (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Search and action buttons */}
      {showSearch && (
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" data-testid="search-skeleton" />
          <Skeleton className="h-10 w-28" data-testid="action-button-skeleton" />
        </div>
      )}

      {/* Filter controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-6 w-[150px]" />
        </div>
      )}

      {/* Table skeleton */}
      <Table>
        <TableHeader>
          <TableRow>
            {[...Array(columns)].map((_, i) => (
              <TableHead key={i}>
                <Skeleton
                  className={`h-4 ${columnWidths?.[i] || 'w-20'}`}
                  data-testid={`header-skeleton-${i}`}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(rows)].map((_, rowIndex) => (
            <TableRow key={rowIndex} data-testid={`row-skeleton-${rowIndex}`}>
              {[...Array(columns)].map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    className={`h-4 ${columnWidths?.[colIndex] || 'w-full'}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card data-testid="admin-panel-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

/**
 * Pre-configured skeleton for User Management panel
 */
export function UserManagementSkeleton() {
  return (
    <AdminPanelSkeleton
      showSearch={true}
      rows={5}
      columns={5}
      columnWidths={['w-28', 'w-40', 'w-16', 'w-24', 'w-8']}
    />
  );
}

/**
 * Pre-configured skeleton for Audit Log panel
 */
export function AuditLogSkeleton() {
  return (
    <AdminPanelSkeleton
      showSearch={false}
      showFilters={true}
      rows={5}
      columns={6}
      columnWidths={['w-24', 'w-28', 'w-32', 'w-24', 'w-12', 'w-20']}
    />
  );
}
