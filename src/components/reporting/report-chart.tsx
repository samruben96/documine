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
 * Professional chart color palette with explicit hex colors.
 * AC-23.9.1: Vibrant, accessible colors (WCAG 2.1 AA compliant)
 *
 * Color meanings:
 * - Blue (#3b82f6): Primary, first series
 * - Emerald (#10b981): Positive/success metrics
 * - Amber (#f59e0b): Warning/attention
 * - Red (#ef4444): Negative/critical
 * - Violet (#8b5cf6): Fifth series
 * - Pink (#ec4899): Sixth series
 * - Cyan (#06b6d4): Seventh series
 * - Orange (#f97316): Eighth series
 */
const CHART_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
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
 * Format tooltip values based on data type.
 * AC-23.9.5: Formatted values (currency, percentages, numbers)
 */
function formatTooltipValue(value: number, name?: string): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';

  // Detect currency fields by name pattern
  const isCurrency =
    name &&
    /amount|price|cost|revenue|total|fee|payment|balance|sum/i.test(name);

  if (isCurrency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Detect percentage fields
  const isPercentage = name && /percent|rate|ratio/i.test(name);
  if (isPercentage && value <= 1) {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Format large numbers with abbreviations
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Custom tooltip component with shadcn styling.
 * AC-23.9.5: Styled tooltips with formatted values
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
      className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-3 shadow-lg"
      data-testid="chart-tooltip"
      style={{ minWidth: '140px' }}
    >
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 pb-1 border-b border-slate-100 dark:border-slate-700">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate max-w-[100px]">{entry.name}</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {formatTooltipValue(entry.value, entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Custom tooltip for pie charts showing percentage.
 * AC-23.9.5: Consistent styling with CustomTooltip
 */
interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: Record<string, unknown> & { _total?: number };
    color?: string;
  }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload || !payload.length || !payload[0]) {
    return null;
  }

  const entry = payload[0];
  const total = entry.payload?._total || 0;
  const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-3 shadow-lg"
      data-testid="chart-tooltip"
      style={{ minWidth: '120px' }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color || CHART_COLORS[0] }}
        />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
          {entry.name}
        </p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">Value</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
          {formatTooltipValue(entry.value)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">Share</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Chart Implementations
// ============================================================================

/**
 * Bar Chart implementation with gradient fills and enhanced styling.
 * AC-23.9.4: Gradient fill, subtle grid, readable axis, border radius
 */
function BarChartImpl({
  config,
  height,
}: {
  config: ChartConfig;
  height: number;
}) {
  const yKeys = getYKeys(config.yKey);
  const chartId = config.id || 'bar-chart';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={config.data as Record<string, unknown>[]}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        {/* Gradient definitions for bars (AC-23.9.4) */}
        <defs>
          {CHART_COLORS.map((color, index) => (
            <linearGradient
              key={`bar-gradient-${index}`}
              id={`bar-gradient-${chartId}-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>
        {/* AC-23.9.4: Subtle grid lines (lighter, dashed) */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          strokeOpacity={0.6}
          vertical={false}
        />
        <XAxis
          dataKey={config.xKey}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval="preserveStartEnd"
          tickMargin={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
            )}
          />
        )}
        {yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            name={key}
            fill={`url(#bar-gradient-${chartId}-${index % CHART_COLORS.length})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Line Chart implementation with enhanced styling.
 * AC-23.9.6: Responsive legend with proper styling
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
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          strokeOpacity={0.6}
          vertical={false}
        />
        <XAxis
          dataKey={config.xKey}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickMargin={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && (
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
            )}
          />
        )}
        {yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Pie Chart implementation with donut style and enhanced styling.
 * AC-23.9.3: Gradient fills, innerRadius, paddingAngle, hover effects
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
  const chartId = config.id || 'pie-chart';

  // Calculate total for percentage calculations
  const total = useMemo(() => {
    if (!yKey) return 0;
    return (config.data as Record<string, unknown>[]).reduce((sum, item) => {
      const value = Number(item[yKey]) || 0;
      return sum + value;
    }, 0);
  }, [config.data, yKey]);

  // Transform data to include total for tooltip percentage calculation
  // AC-23.9.2: Filter out zero values from pie chart
  const pieData = useMemo(() => {
    if (!yKey) return [];
    return (config.data as Record<string, unknown>[])
      .map((item) => ({
        ...item,
        name: item[config.xKey] as string,
        value: Number(item[yKey]) || 0,
        _total: total,
      }))
      .filter((item) => item.value > 0); // AC-23.9.2: No 0% slices
  }, [config.data, config.xKey, yKey, total]);

  const outerRadius = Math.min(height * 0.35, 100);
  const innerRadius = outerRadius * 0.6; // Donut effect (AC-23.9.3)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        {/* Gradient definitions for pie slices (AC-23.9.3) */}
        <defs>
          {CHART_COLORS.map((color, index) => (
            <linearGradient
              key={`pie-gradient-${index}`}
              id={`pie-gradient-${chartId}-${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
        >
          {pieData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#pie-gradient-${chartId}-${index % CHART_COLORS.length})`}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Area Chart implementation with enhanced styling.
 * AC-23.9.6: Responsive legend with proper styling
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
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          strokeOpacity={0.6}
          vertical={false}
        />
        <XAxis
          dataKey={config.xKey}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickMargin={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {yKeys.length > 1 && (
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
            )}
          />
        )}
        {yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={`url(#gradient-${chartId}-${index})`}
            strokeWidth={2.5}
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
