/**
 * Usage Trend Chart Component
 * Story 20.3: Usage Analytics Dashboard
 * Story 21.5: Extended for multi-feature trend tracking
 *
 * Line chart showing daily active users and activity across all features.
 * AC-20.3.4: Line chart trends
 * AC-20.3.5: Chart hover interaction with tooltip
 * AC-21.5.5: Trend charts show activity across all features
 */

'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import type { UsageTrend } from '@/types/ai-buddy';

export interface UsageTrendChartProps {
  /** Array of trend data points */
  data: UsageTrend[];
  /** Whether the chart is in loading state */
  isLoading?: boolean;
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Format date for X-axis display
 */
function formatXAxisDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

/**
 * Custom tooltip component for hover interaction
 * AC-20.3.5: Tooltip displays exact values for that day
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !label) {
    return null;
  }

  const formattedDate = (() => {
    try {
      return format(parseISO(label), 'EEEE, MMMM d, yyyy');
    } catch {
      return label;
    }
  })();

  return (
    <div
      className="rounded-lg border bg-background p-3 shadow-md"
      data-testid="trend-chart-tooltip"
    >
      <p className="text-sm font-medium mb-2">{formattedDate}</p>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Usage Trend Chart for displaying daily metrics over time
 *
 * @example
 * ```tsx
 * <UsageTrendChart
 *   data={[
 *     { date: '2024-01-01', activeUsers: 5, conversations: 12 },
 *     { date: '2024-01-02', activeUsers: 8, conversations: 20 },
 *   ]}
 * />
 * ```
 */
type ViewMode = 'primary' | 'all';

export function UsageTrendChart({
  data,
  isLoading = false,
  title = 'Usage Trends',
  description = 'Daily activity across all features',
  className,
  testId = 'usage-trend-chart',
}: UsageTrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('primary');

  // Calculate chart domain for Y axis based on view mode
  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 10];

    let maxValue: number;
    if (viewMode === 'primary') {
      maxValue = Math.max(
        ...data.map((d) => Math.max(d.activeUsers, d.conversations))
      );
    } else {
      maxValue = Math.max(
        ...data.map((d) => Math.max(
          d.activeUsers,
          d.conversations,
          d.documents || 0,
          d.comparisons || 0,
          d.onePagers || 0,
          d.documentChats || 0
        ))
      );
    }
    return [0, Math.ceil(maxValue * 1.1) || 10]; // 10% headroom
  }, [data, viewMode]);

  if (isLoading) {
    return (
      <Card className={className} data-testid={`${testId}-loading`}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className} data-testid={`${testId}-empty`}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid={testId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'primary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('primary')}
              data-testid="view-primary"
            >
              Primary
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
              data-testid="view-all"
            >
              All Features
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisDate}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={viewMode === 'all' ? 48 : 36}
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="conversations"
                name="AI Buddy"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              {viewMode === 'all' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="documents"
                    name="Documents"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="comparisons"
                    name="Comparisons"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="onePagers"
                    name="One-Pagers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="documentChats"
                    name="Doc Chat"
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
