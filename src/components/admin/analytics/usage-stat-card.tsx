/**
 * Usage Stat Card Component
 * Story 20.3: Usage Analytics Dashboard
 *
 * Displays a single summary statistic with optional comparison to previous period.
 * AC-20.3.1: Summary cards showing total conversations, active users, documents, messages
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UsageStatCardProps {
  /** Title of the stat card */
  title: string;
  /** Current value to display */
  value: number;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Percentage change from previous period (positive = up, negative = down) */
  changePercent?: number;
  /** Description of the comparison period */
  changeLabel?: string;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/**
 * Get trend icon and color based on change percentage
 */
function getTrendInfo(changePercent: number | undefined): {
  icon: React.ReactNode;
  color: string;
  text: string;
} {
  if (changePercent === undefined || changePercent === 0) {
    return {
      icon: <Minus className="h-3 w-3" />,
      color: 'text-muted-foreground',
      text: 'No change',
    };
  }

  if (changePercent > 0) {
    return {
      icon: <TrendingUp className="h-3 w-3" />,
      color: 'text-green-600 dark:text-green-400',
      text: `+${changePercent}%`,
    };
  }

  return {
    icon: <TrendingDown className="h-3 w-3" />,
    color: 'text-red-600 dark:text-red-400',
    text: `${changePercent}%`,
  };
}

/**
 * Usage Stat Card for displaying summary metrics
 *
 * @example
 * ```tsx
 * <UsageStatCard
 *   title="Total Conversations"
 *   value={1234}
 *   icon={<MessageSquare className="h-4 w-4" />}
 *   changePercent={12}
 *   changeLabel="from last week"
 * />
 * ```
 */
export function UsageStatCard({
  title,
  value,
  icon,
  changePercent,
  changeLabel = 'from previous period',
  isLoading = false,
  className,
  testId,
}: UsageStatCardProps) {
  const trend = getTrendInfo(changePercent);

  if (isLoading) {
    return (
      <Card className={className} data-testid={testId ? `${testId}-loading` : 'stat-card-loading'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid={testId || 'usage-stat-card'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={testId ? `${testId}-value` : 'stat-value'}>
          {formatNumber(value)}
        </div>
        {changePercent !== undefined && (
          <p
            className={cn('text-xs flex items-center gap-1 mt-1', trend.color)}
            data-testid={testId ? `${testId}-change` : 'stat-change'}
          >
            {trend.icon}
            <span>{trend.text}</span>
            <span className="text-muted-foreground ml-1">{changeLabel}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
