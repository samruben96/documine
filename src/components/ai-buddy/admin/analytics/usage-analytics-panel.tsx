/**
 * Usage Analytics Panel Component
 * Story 20.3: Usage Analytics Dashboard
 *
 * Main dashboard panel composing all analytics components.
 * AC-20.3.1 through AC-20.3.8
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Users,
  FileText,
  MessagesSquare,
  Download,
  AlertCircle,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { UsageStatCard } from './usage-stat-card';
import { UsageTrendChart } from './usage-trend-chart';
import { UserBreakdownTable } from './user-breakdown-table';
import {
  AnalyticsDateRangePicker,
  getDefaultDateRange,
  type AnalyticsDateRange,
} from './date-range-picker';
import { useUsageAnalytics } from '@/hooks/ai-buddy/use-usage-analytics';

export interface UsageAnalyticsPanelProps {
  /** Whether the user has permission to view analytics */
  hasPermission?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main Usage Analytics Dashboard Panel
 *
 * @example
 * ```tsx
 * <UsageAnalyticsPanel hasPermission={true} />
 * ```
 */
export function UsageAnalyticsPanel({
  hasPermission = true,
  className,
}: UsageAnalyticsPanelProps) {
  const {
    summary,
    byUser,
    trends,
    isLoading,
    error,
    isEmpty,
    dateRange,
    setDateRange,
    refetch,
    exportCsv,
  } = useUsageAnalytics();

  /**
   * Handle CSV export with toast feedback
   */
  const handleExport = async () => {
    try {
      await exportCsv();
      toast.success('Usage data exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  // Permission denied (AC-20.3.7 - non-admin users get 403)
  if (!hasPermission) {
    return (
      <Card className={className} data-testid="analytics-panel-forbidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            View usage metrics and trends for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view usage analytics. Contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <Card className={className} data-testid="analytics-panel-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load analytics: {error.message}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state (AC-20.3.8)
  if (isEmpty && !isLoading) {
    return (
      <Card className={className} data-testid="analytics-panel-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            View usage metrics and trends for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessagesSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No usage data yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Once your team starts using AI Buddy, you&apos;ll see usage metrics, trends, and
              per-user breakdowns here.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Get started by having team members open AI Buddy and start a conversation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="analytics-panel">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Analytics
            </CardTitle>
            <CardDescription>
              View usage metrics and trends for your team
            </CardDescription>
          </div>

          {/* Date range picker and export button */}
          <div className="flex flex-wrap items-center gap-2">
            <AnalyticsDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || isEmpty}
              data-testid="export-csv-btn"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards (AC-20.3.1) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageStatCard
            title="Total Conversations"
            value={summary?.totalConversations || 0}
            icon={<MessageSquare className="h-4 w-4" />}
            changePercent={summary?.comparisonPeriod?.conversations}
            changeLabel="vs previous period"
            isLoading={isLoading}
            testId="stat-conversations"
          />
          <UsageStatCard
            title="Active Users"
            value={summary?.activeUsers || 0}
            icon={<Users className="h-4 w-4" />}
            changePercent={summary?.comparisonPeriod?.users}
            changeLabel="vs previous period"
            isLoading={isLoading}
            testId="stat-users"
          />
          <UsageStatCard
            title="Documents Uploaded"
            value={summary?.documentsUploaded || 0}
            icon={<FileText className="h-4 w-4" />}
            changePercent={summary?.comparisonPeriod?.documents}
            changeLabel="vs previous period"
            isLoading={isLoading}
            testId="stat-documents"
          />
          <UsageStatCard
            title="Messages Sent"
            value={summary?.messagesSent || 0}
            icon={<MessagesSquare className="h-4 w-4" />}
            changePercent={summary?.comparisonPeriod?.messages}
            changeLabel="vs previous period"
            isLoading={isLoading}
            testId="stat-messages"
          />
        </div>

        {/* Trend Chart (AC-20.3.4, AC-20.3.5) */}
        <UsageTrendChart
          data={trends}
          isLoading={isLoading}
          title="Usage Trends"
          description="Daily active users and conversations over time"
        />

        {/* User Breakdown Table (AC-20.3.2) */}
        <UserBreakdownTable
          data={byUser}
          isLoading={isLoading}
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
}
