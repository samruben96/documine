/**
 * User Breakdown Table Component
 * Story 20.3: Usage Analytics Dashboard
 * Story 21.5: Extended for multi-feature per-user tracking
 *
 * Table showing per-user usage metrics with sorting and pagination.
 * AC-20.3.2: Per-user breakdown table with columns for name, email, conversations, messages, documents, last active
 * AC-21.5.1-21.5.4: Additional columns for comparisons, one-pagers, document chats
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserUsageStats } from '@/types/ai-buddy';

export interface UserBreakdownTableProps {
  /** Array of user usage statistics */
  data: UserUsageStats[];
  /** Whether the table is in loading state */
  isLoading?: boolean;
  /** Number of rows per page */
  pageSize?: number;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

type SortColumn = 'name' | 'conversations' | 'messages' | 'documents' | 'comparisons' | 'onePagers' | 'documentChats' | 'lastActiveAt';
type SortDirection = 'asc' | 'desc';

/**
 * Format last active time as relative time
 */
function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

/**
 * Sort icon component
 */
function SortIcon({ column, currentColumn, direction }: {
  column: SortColumn;
  currentColumn: SortColumn;
  direction: SortDirection;
}) {
  if (column !== currentColumn) {
    return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
  }
  return direction === 'asc' ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  );
}

/**
 * User Breakdown Table for displaying per-user usage metrics
 *
 * @example
 * ```tsx
 * <UserBreakdownTable
 *   data={[
 *     { userId: '1', userName: 'John Doe', userEmail: 'john@example.com', conversations: 10, messages: 50, documents: 5, lastActiveAt: '2024-01-15T10:30:00Z' },
 *   ]}
 * />
 * ```
 */
export function UserBreakdownTable({
  data,
  isLoading = false,
  pageSize = 10,
  className,
  testId = 'user-breakdown-table',
}: UserBreakdownTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('conversations');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle sort toggle
  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Sort and paginate data
  const { sortedData, totalPages, paginatedData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { sortedData: [], totalPages: 0, paginatedData: [] };
    }

    // Sort data
    const sorted = [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'name':
          comparison = (a.userName || a.userEmail || '').localeCompare(b.userName || b.userEmail || '');
          break;
        case 'conversations':
          comparison = a.conversations - b.conversations;
          break;
        case 'messages':
          comparison = a.messages - b.messages;
          break;
        case 'documents':
          comparison = a.documents - b.documents;
          break;
        case 'comparisons':
          comparison = (a.comparisons || 0) - (b.comparisons || 0);
          break;
        case 'onePagers':
          comparison = (a.onePagers || 0) - (b.onePagers || 0);
          break;
        case 'documentChats':
          comparison = (a.documentChats || 0) - (b.documentChats || 0);
          break;
        case 'lastActiveAt':
          const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Calculate pagination
    const total = Math.ceil(sorted.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginated = sorted.slice(start, end);

    return { sortedData: sorted, totalPages: total, paginatedData: paginated };
  }, [data, sortColumn, sortDirection, currentPage, pageSize]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={className} data-testid={`${testId}-loading`}>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className={className} data-testid={`${testId}-empty`}>
        <CardHeader>
          <CardTitle className="text-base">User Breakdown</CardTitle>
          <CardDescription>Usage metrics by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No user activity data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-base">User Breakdown</CardTitle>
        <CardDescription>
          Usage metrics by team member ({data.length} {data.length === 1 ? 'user' : 'users'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-medium"
                    onClick={() => handleSort('name')}
                    data-testid="sort-name"
                  >
                    User
                    <SortIcon column="name" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 font-medium text-xs"
                    onClick={() => handleSort('conversations')}
                    data-testid="sort-conversations"
                  >
                    Chats
                    <SortIcon column="conversations" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 font-medium text-xs"
                    onClick={() => handleSort('documents')}
                    data-testid="sort-documents"
                  >
                    Docs
                    <SortIcon column="documents" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 font-medium text-xs"
                    onClick={() => handleSort('comparisons')}
                    data-testid="sort-comparisons"
                  >
                    Compare
                    <SortIcon column="comparisons" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 font-medium text-xs"
                    onClick={() => handleSort('onePagers')}
                    data-testid="sort-onePagers"
                  >
                    1-Pagers
                    <SortIcon column="onePagers" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 font-medium text-xs"
                    onClick={() => handleSort('documentChats')}
                    data-testid="sort-documentChats"
                  >
                    Doc Chat
                    <SortIcon column="documentChats" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 font-medium text-xs"
                    onClick={() => handleSort('lastActiveAt')}
                    data-testid="sort-lastActive"
                  >
                    Active
                    <SortIcon column="lastActiveAt" currentColumn={sortColumn} direction={sortDirection} />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((user) => (
                <TableRow key={user.userId} data-testid={`user-row-${user.userId}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.userName || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.userEmail || 'No email'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {user.conversations.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {user.documents.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(user.comparisons || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(user.onePagers || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(user.documentChats || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {formatLastActive(user.lastActiveAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                data-testid="next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
