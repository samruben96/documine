'use client';

/**
 * ReportChart Component
 * Epic 23: Flexible AI Reports - Story 23.5
 *
 * Renders interactive charts based on AI-recommended configurations.
 * Supports bar, line, pie, and area charts with multi-series data.
 *
 * AC-23.5.1: AI-recommended chart types rendered correctly
 * AC-23.5.2: Recharts library with proper data binding
 * AC-23.5.3: Interactive with hover tooltips
 * AC-23.5.5: Responsive on mobile (min-width: 320px)
 * AC-23.5.6: Accessible labels and ARIA attributes
 * AC-23.5.7: Graceful fallback for empty/invalid configs
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { ChartConfig } from '@/types/reporting';

// ============================================================================
// Constants
// ============================================================================

/**
 * Chart color palette using CSS variables for consistent theming.
 * AC-23.5.2: Uses shadcn/ui design tokens
 */
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 173 58% 39%))',
  'hsl(var(--chart-3, 197 37% 24%))',
  'hsl(var(--chart-4, 43 74% 66%))',
  'hsl(var(--chart-5, 27 87% 67%))',
];

/**
 * Default chart height in pixels
 */
const DEFAULT_CHART_HEIGHT = 300;

// ============================================================================
// Types
// ============================================================================

export interface ReportChartProps {
  /** Chart configuration from AI */
  config: ChartConfig;
  /** Index for test IDs */
  index?: number;
  /** Optional height override */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

interface ChartErrorProps {
  message: string;
  title?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate chart configuration has required fields and data.
 */
function validateChartConfig(config: ChartConfig): { valid: boolean; error?: string } {
  if (!config) {
    return { valid: false, error: 'No chart configuration provided' };
  }

  if (!config.type || !['bar', 'line', 'pie', 'area'].includes(config.type)) {
    return { valid: false, error: `Invalid chart type: ${config.type}` };
  }

  if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
    return { valid: false, error: 'No data available for chart' };
  }

  if (!config.xKey) {
    return { valid: false, error: 'Missing x-axis key (xKey)' };
  }

  if (!config.yKey) {
    return { valid: false, error: 'Missing y-axis key (yKey)' };
  }

  return { valid: true };
}

/**
 * Get array of y-keys for multi-series support.
 */
function getYKeys(yKey: string | string[]): string[] {
  return Array.isArray(yKey) ? yKey : [yKey];
}

/**
 * Format numeric values for tooltips.
 */
function formatValue(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';

  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Error/Fallback display for invalid charts.
 * AC-23.5.7: Graceful fallback UI
 */
function ChartError({ message, title }: ChartErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[200px] bg-slate-50 rounded-lg border border-dashed border-slate-200"
      data-testid="chart-error"
    >
      <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
      <p className="text-sm text-slate-600 font-medium">{title || 'Chart Error'}</p>
      <p className="text-xs text-slate-400 mt-1 text-center px-4">{message}</p>
    </div>
  );
}

/**
 * Custom tooltip component for hover interaction.
 * AC-23.5.3: Interactive with hover tooltips
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      className="rounded-lg border bg-background p-3 shadow-md"
      data-testid="chart-tooltip"
    >
      <p className="text-sm font-medium mb-2">{label}</p>
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
          <span className="font-medium">{formatValue(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Custom tooltip for pie charts showing percentage.
 */
interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: Record<string, unknown>;
  }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload || !payload.length || !payload[0]) {
    return null;
  }

  const entry = payload[0];
  const total = (entry.payload?._total as number) || 0;
  const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';

  return (
    <div
      className="rounded-lg border bg-background p-3 shadow-md"
      data-testid="chart-tooltip"
    >
      <p className="text-sm font-medium">{entry.name}</p>
      <p className="text-sm text-muted-foreground">
        {formatValue(entry.value)} ({percentage}%)
      </p>
    </div>
  );
}

// ============================================================================
// Chart Implementations
// ============================================================================

/**
 * Bar Chart implementation.
 * Task 2: Supports single-series and multi-series
 */
function BarChartImpl({
  config,
  height,
}: {
  config: ChartConfig;
  height: number;
}) {
  const yKeys = getYKeys(config.yKey);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={config.data as Record<string, unknown>[]}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          width={50}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && (
          <Legend verticalAlign="bottom" height={36} />
        )}
        {yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            name={key}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Line Chart implementation.
 * Task 3: Supports single-line and multi-line with dot markers
 */
function LineChartImpl({
  config,
  height,
}: {
  config: ChartConfig;
  height: number;
}) {
  const yKeys = getYKeys(config.yKey);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={config.data as Record<string, unknown>[]}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          width={50}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && (
          <Legend verticalAlign="bottom" height={36} />
        )}
        {yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Pie Chart implementation.
 * Task 4: Maps data to segments with percentage labels
 */
function PieChartImpl({
  config,
  height,
}: {
  config: ChartConfig;
  height: number;
}) {
  // For pie charts, we expect xKey to be the label and yKey to be the value
  const yKeyValue = Array.isArray(config.yKey) ? config.yKey[0] : config.yKey;
  const yKey = yKeyValue || '';

  // Calculate total for percentage calculations
  const total = useMemo(() => {
    if (!yKey) return 0;
    return (config.data as Record<string, unknown>[]).reduce((sum, item) => {
      const value = Number(item[yKey]) || 0;
      return sum + value;
    }, 0);
  }, [config.data, yKey]);

  // Transform data to include total for tooltip percentage calculation
  const pieData = useMemo(() => {
    if (!yKey) return [];
    return (config.data as Record<string, unknown>[]).map((item) => ({
      ...item,
      name: item[config.xKey] as string,
      value: Number(item[yKey]) || 0,
      _total: total,
    }));
  }, [config.data, config.xKey, yKey, total]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={Math.min(height * 0.35, 100)}
          label={({ name, percent }) =>
            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
        >
          {pieData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Area Chart implementation.
 * Task 5: Supports stacked area with gradient fills
 */
function AreaChartImpl({
  config,
  height,
}: {
  config: ChartConfig;
  height: number;
}) {
  const yKeys = getYKeys(config.yKey);
  const chartId = config.id || 'area-chart';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={config.data as Record<string, unknown>[]}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <defs>
          {yKeys.map((key, index) => (
            <linearGradient
              key={key}
              id={`gradient-${chartId}-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                stopOpacity={0.1}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          width={50}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && (
          <Legend verticalAlign="bottom" height={36} />
        )}
        {yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={`url(#gradient-${chartId}-${index})`}
            strokeWidth={2}
            stackId={yKeys.length > 1 ? 'stack' : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ReportChart renders AI-recommended visualizations.
 *
 * @example
 * ```tsx
 * <ReportChart
 *   config={{
 *     type: 'bar',
 *     data: [{ month: 'Jan', value: 100 }, { month: 'Feb', value: 150 }],
 *     xKey: 'month',
 *     yKey: 'value',
 *     title: 'Monthly Sales',
 *   }}
 * />
 * ```
 */
export function ReportChart({
  config,
  index = 0,
  height = DEFAULT_CHART_HEIGHT,
  className,
}: ReportChartProps) {
  // Validate configuration
  const validation = validateChartConfig(config);

  // Generate aria-label for accessibility (AC-23.5.6)
  const ariaLabel = useMemo(() => {
    if (!validation.valid) return 'Chart could not be rendered';
    const yKeys = getYKeys(config.yKey);
    return `${config.type} chart: ${config.title || 'Data visualization'} showing ${yKeys.join(', ')} by ${config.xKey}`;
  }, [config, validation.valid]);

  // Render error state if invalid (AC-23.5.7)
  if (!validation.valid) {
    console.error(`[ReportChart] Validation failed:`, validation.error);
    return (
      <Card className={className} data-testid={`report-chart-${index}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {config?.title || 'Chart'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartError message={validation.error!} />
        </CardContent>
      </Card>
    );
  }

  // Render the appropriate chart type
  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return <BarChartImpl config={config} height={height - 80} />;
      case 'line':
        return <LineChartImpl config={config} height={height - 80} />;
      case 'pie':
        return <PieChartImpl config={config} height={height - 80} />;
      case 'area':
        return <AreaChartImpl config={config} height={height - 80} />;
      default:
        return <ChartError message={`Unknown chart type: ${config.type}`} />;
    }
  };

  return (
    <Card
      className={className}
      data-testid={`report-chart-${index}`}
      // AC-23.5.6: Accessibility attributes
      role="img"
      aria-label={ariaLabel}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        {config.description && (
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
