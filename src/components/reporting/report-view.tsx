'use client';

/**
 * ReportView Component
 * Epic 23: Flexible AI Reports - Stories 23.4 & 23.5
 *
 * Displays the generated report with title, summary, insights, and interactive charts.
 * AC-23.4.1: Shows AI-generated report title and summary
 * AC-23.4.2: Shows 3-5 key insights with type indicators and severity levels
 * AC-23.5.4: Renders multiple charts in responsive grid layout
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { GeneratedReport, ReportInsight } from '@/types/reporting';
import { cn } from '@/lib/utils';
import { ReportChart } from './report-chart';

// ============================================================================
// Types
// ============================================================================

export interface ReportViewProps {
  /** The generated report to display */
  report: GeneratedReport;
  /** Handler for generating a new report */
  onNewReport?: () => void;
  /** Handler for PDF export (disabled until Story 23.7) */
  onExportPdf?: () => void;
  /** Handler for Excel export (disabled until Story 23.7) */
  onExportExcel?: () => void;
}

// ============================================================================
// Insight Type Configuration
// ============================================================================

const INSIGHT_TYPE_CONFIG: Record<
  ReportInsight['type'],
  { icon: typeof Lightbulb; label: string; className: string }
> = {
  finding: {
    icon: Lightbulb,
    label: 'Finding',
    className: 'text-amber-600',
  },
  trend: {
    icon: TrendingUp,
    label: 'Trend',
    className: 'text-blue-600',
  },
  anomaly: {
    icon: AlertTriangle,
    label: 'Anomaly',
    className: 'text-orange-600',
  },
  recommendation: {
    icon: Target,
    label: 'Recommendation',
    className: 'text-green-600',
  },
};

const SEVERITY_CONFIG: Record<
  NonNullable<ReportInsight['severity']>,
  { className: string; label: string }
> = {
  info: {
    className: 'bg-blue-100 text-blue-800',
    label: 'Info',
  },
  warning: {
    className: 'bg-yellow-100 text-yellow-800',
    label: 'Warning',
  },
  critical: {
    className: 'bg-red-100 text-red-800',
    label: 'Critical',
  },
};


// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Individual insight card.
 */
function InsightCard({ insight, index }: { insight: ReportInsight; index: number }) {
  const typeConfig = INSIGHT_TYPE_CONFIG[insight.type];
  const severityConfig = insight.severity
    ? SEVERITY_CONFIG[insight.severity]
    : SEVERITY_CONFIG.info;
  const Icon = typeConfig.icon;

  return (
    <Card
      className="transition-all duration-200 hover:shadow-md"
      data-testid={`insight-card-${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 flex-shrink-0',
              typeConfig.className
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-medium text-slate-900 text-sm">{insight.title}</h4>
              <Badge
                variant="secondary"
                className={cn('text-xs', severityConfig.className)}
              >
                {severityConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {insight.description}
            </p>
            {insight.relatedColumns && insight.relatedColumns.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <span>Related:</span>
                {insight.relatedColumns.map((col, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


/**
 * Data table placeholder (for Story 23.6 implementation).
 */
function DataTablePlaceholder({ columns, rowCount }: { columns: string[]; rowCount: number }) {
  return (
    <Card data-testid="data-table-placeholder">
      <CardHeader>
        <CardTitle className="text-base">Data Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-32 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <FileSpreadsheet className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">
            {rowCount.toLocaleString()} rows &middot; {columns.length} columns
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Interactive table coming in Story 23.6
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ReportView displays the complete generated report.
 *
 * AC-23.4.1: Shows title and summary
 * AC-23.4.2: Shows 3-5 insights with type/severity indicators
 * AC-23.4.6: Shows chart configuration placeholders
 */
export function ReportView({
  report,
  onNewReport,
  onExportPdf,
  onExportExcel,
}: ReportViewProps) {
  return (
    <div className="space-y-6" data-testid="report-view">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="report-title">
            {report.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export buttons - disabled until Story 23.7 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPdf}
            disabled={!onExportPdf}
            title="PDF export coming in Story 23.7"
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={!onExportExcel}
            title="Excel export coming in Story 23.7"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          {onNewReport && (
            <Button variant="default" size="sm" onClick={onNewReport}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Report
            </Button>
          )}
        </div>
      </div>

      {/* Prompt Used */}
      {report.promptUsed && (
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-slate-500">Analysis Based On</p>
            <p className="text-sm text-slate-700">{report.promptUsed}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
            data-testid="report-summary"
          >
            {report.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Key Insights</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {report.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} index={index} />
          ))}
        </div>
      </div>

      {/* Charts - AC-23.5.4: Multiple charts in responsive grid */}
      {report.charts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-900 mb-4">
            Recommended Visualizations
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {report.charts.map((chart, index) => (
              <ReportChart key={chart.id || index} config={chart} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Data Table Placeholder */}
      {report.dataTable && (
        <DataTablePlaceholder
          columns={report.dataTable.columns}
          rowCount={report.dataTable.rows.length}
        />
      )}
    </div>
  );
}
