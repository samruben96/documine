'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Users, HardDrive } from 'lucide-react';
import type { UsageMetrics } from '@/types';

interface UsageTabProps {
  metrics: UsageMetrics;
}

/**
 * Format bytes to human-readable storage string
 * Per AC-3.5.4: Display in MB for < 1GB, GB otherwise
 */
function formatStorage(bytes: number): string {
  if (bytes === 0) return '0 MB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Format number with thousand separators
 */
function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Usage Tab Component
 * Per AC-3.5.1 to AC-3.5.4: Displays usage metrics for agency admins
 * Per AC-3.5.5: Data is fetched fresh on page load
 */
export function UsageTab({ metrics }: UsageTabProps) {
  return (
    <div className="space-y-6 mt-6">
      {/* Story 22.4: gap-6 for card grids */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Documents Card - AC-3.5.1, AC-6.8.12: Brand accent icons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">Documents Uploaded</CardTitle>
              <CardDescription>PDF documents analyzed</CardDescription>
            </div>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-lg font-semibold">{formatNumber(metrics.documentsUploaded.thisMonth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">All Time</span>
                <span className="text-lg font-semibold">{formatNumber(metrics.documentsUploaded.allTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queries Card - AC-3.5.2, AC-6.8.12: Brand accent icons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">Questions Asked</CardTitle>
              <CardDescription>AI queries submitted</CardDescription>
            </div>
            <MessageSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-lg font-semibold">{formatNumber(metrics.queriesAsked.thisMonth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">All Time</span>
                <span className="text-lg font-semibold">{formatNumber(metrics.queriesAsked.allTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users Card - AC-3.5.3, AC-6.8.12: Brand accent icons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">Active Users</CardTitle>
              <CardDescription>Users with activity in last 7 days</CardDescription>
            </div>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.activeUsers}</div>
          </CardContent>
        </Card>

        {/* Storage Card - AC-3.5.4, AC-6.8.12: Brand accent icons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">Storage Used</CardTitle>
              <CardDescription>Total document storage</CardDescription>
            </div>
            <HardDrive className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatStorage(metrics.storageUsedBytes)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
