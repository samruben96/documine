/**
 * POST /api/reporting/generate
 * Epic 23: Flexible AI Reports - Story 23.4
 *
 * Generate AI-powered report from parsed data with SSE streaming.
 * AC-23.4.1: AI generates report title and summary from data + prompt
 * AC-23.4.2: Report includes 3-5 key insights with type/severity indicators
 * AC-23.4.3: Without prompt, AI generates best-effort analysis automatically
 * AC-23.4.4: Generation shows streaming progress feedback via SSE
 * AC-23.4.5: Generation completes within 30 seconds for datasets < 10K rows
 * AC-23.4.6: Report includes chart configurations for 2-4 visualizations
 * AC-23.4.7: Error states handled gracefully with retry capability
 */

import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/admin/audit-logger';
import { getLLMClient, getModelId } from '@/lib/llm/config';
import type {
  ParsedData,
  ColumnInfo,
  GeneratedReport,
  ReportInsight,
  ChartConfig,
  ApiError,
} from '@/types/reporting';

// Edge Runtime for low latency SSE streaming (AC-23.4.4)
export const runtime = 'edge';

// ============================================================================
// SSE Event Types (AC-23.4.4)
// ============================================================================

interface ReportSSEEvent {
  type: 'progress' | 'title' | 'summary' | 'insight' | 'chart' | 'done' | 'error';
  stage?: 'analyzing' | 'generating' | 'charting';
  percent?: number;
  title?: string;
  summary?: string;
  insight?: ReportInsight;
  chart?: ChartConfig;
  report?: GeneratedReport;
  error?: string;
  code?: string;
}

/**
 * Format SSE event for transmission.
 */
function formatSSEEvent(event: ReportSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ============================================================================
// Report Generation System Prompt
// ============================================================================

const REPORT_GENERATION_SYSTEM = `You are a data analyst expert. Analyze the provided dataset and generate a comprehensive report.

Your task is to:
1. Generate a descriptive title for the report
2. Write a 2-3 paragraph executive summary
3. Identify 3-5 key insights, each with:
   - type: finding | trend | anomaly | recommendation
   - severity: info | warning | critical
   - title: short headline
   - description: detailed explanation
4. Recommend 2-4 visualizations, each with:
   - type: bar | line | pie | area
   - title: chart title
   - xKey: column name for x-axis
   - yKey: column name for y-axis (or array for multi-series)
   - description: what the chart shows

Focus on actionable insights and clear explanations.
For auto-analysis mode (no user prompt), identify the most important patterns, trends, and anomalies.

Output ONLY valid JSON matching this exact structure:
{
  "title": "string",
  "summary": "string",
  "insights": [
    {
      "type": "finding|trend|anomaly|recommendation",
      "severity": "info|warning|critical",
      "title": "string",
      "description": "string",
      "relatedColumns": ["column1", "column2"]
    }
  ],
  "charts": [
    {
      "type": "bar|line|pie|area",
      "title": "string",
      "xKey": "string",
      "yKey": "string",
      "description": "string"
    }
  ]
}

Do not include any explanations, markdown, or code blocks - ONLY the JSON object.`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build column summary for AI context.
 */
function buildColumnSummary(columns: ColumnInfo[]): string {
  return columns
    .map((col) => {
      let summary = `- ${col.name} (${col.type})`;

      if (col.stats) {
        if ('sum' in col.stats) {
          summary += `: min=${col.stats.min}, max=${col.stats.max}, avg=${col.stats.mean.toFixed(2)}`;
        } else if ('earliest' in col.stats) {
          summary += `: ${col.stats.earliest} to ${col.stats.latest}`;
        }
      }

      summary += ` [${col.uniqueCount} unique]`;
      return summary;
    })
    .join('\n');
}

/**
 * Build sample data for AI context.
 */
function buildSampleData(
  rows: Record<string, unknown>[],
  columns: ColumnInfo[],
  maxRows: number
): string {
  const sampleRows = rows.slice(0, maxRows);
  const colNames = columns.slice(0, 10).map((c) => c.name);

  return sampleRows
    .map((row) => {
      const sample: Record<string, string> = {};
      for (const name of colNames) {
        const val = row[name];
        sample[name] =
          val !== null && val !== undefined
            ? String(val).substring(0, 100)
            : 'null';
      }
      return JSON.stringify(sample);
    })
    .join('\n');
}

/**
 * Validate insight type.
 */
function validateInsightType(
  type?: string
): 'finding' | 'trend' | 'anomaly' | 'recommendation' {
  const valid = ['finding', 'trend', 'anomaly', 'recommendation'];
  return valid.includes(type || '') ? (type as ReportInsight['type']) : 'finding';
}

/**
 * Validate severity level.
 */
function validateSeverity(severity?: string): 'info' | 'warning' | 'critical' {
  const valid = ['info', 'warning', 'critical'];
  return valid.includes(severity || '')
    ? (severity as NonNullable<ReportInsight['severity']>)
    : 'info';
}

/**
 * Validate chart type.
 */
function validateChartType(type?: string): 'bar' | 'line' | 'pie' | 'area' {
  const valid = ['bar', 'line', 'pie', 'area'];
  return valid.includes(type || '') ? (type as ChartConfig['type']) : 'bar';
}

/**
 * Build chart data by aggregating rows based on xKey and yKey.
 * Groups data by xKey and sums numeric yKey values for visualization.
 */
function buildChartData(
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string | string[]
): Record<string, unknown>[] {
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  // Group and aggregate by xKey
  const grouped = new Map<string, Record<string, number>>();

  for (const row of rows) {
    const xValue = String(row[xKey] ?? 'Unknown');

    if (!grouped.has(xValue)) {
      const initial: Record<string, number> = {};
      for (const yk of yKeys) {
        initial[yk] = 0;
      }
      grouped.set(xValue, initial);
    }

    const agg = grouped.get(xValue)!;
    for (const yk of yKeys) {
      const val = row[yk];
      if (typeof val === 'number') {
        agg[yk] = (agg[yk] ?? 0) + val;
      } else if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/[$,]/g, ''));
        if (!isNaN(parsed)) {
          agg[yk] = (agg[yk] ?? 0) + parsed;
        }
      }
    }
  }

  // Convert to array format for charts
  const result: Record<string, unknown>[] = [];
  for (const [xValue, yValues] of grouped) {
    result.push({ [xKey]: xValue, ...yValues });
  }

  // Sort by xKey for consistent display (limit to top 20 for readability)
  result.sort((a, b) => {
    const aVal = a[xKey];
    const bVal = b[xKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    }
    return 0;
  });

  return result.slice(0, 20);
}

/**
 * Parse AI response and build report structure.
 */
function parseAIResponse(
  content: string,
  prompt: string | undefined,
  columns: ColumnInfo[],
  rows: Record<string, unknown>[]
): GeneratedReport {
  // Handle potential markdown code blocks
  let jsonContent = content.trim();
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '');
  }

  let parsed: {
    title?: string;
    summary?: string;
    insights?: Array<{
      type?: string;
      severity?: string;
      title?: string;
      description?: string;
      relatedColumns?: string[];
    }>;
    charts?: Array<{
      type?: string;
      title?: string;
      xKey?: string;
      yKey?: string | string[];
      description?: string;
    }>;
  };

  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    parsed = {
      title: 'Data Analysis Report',
      summary: content.substring(0, 500),
      insights: [],
      charts: [],
    };
  }

  // Validate and normalize insights (AC-23.4.2: 3-5 insights)
  const insights: ReportInsight[] = (parsed.insights || [])
    .slice(0, 5)
    .map((insight, idx) => ({
      type: validateInsightType(insight.type),
      severity: validateSeverity(insight.severity),
      title: insight.title || `Insight ${idx + 1}`,
      description: insight.description || '',
      relatedColumns: insight.relatedColumns || [],
    }));

  // Ensure at least 3 insights
  while (insights.length < 3) {
    insights.push({
      type: 'finding',
      severity: 'info',
      title: `General Observation ${insights.length + 1}`,
      description: 'Additional analysis may reveal more patterns in your data.',
    });
  }

  // Get column names for validation
  const columnNames = new Set(columns.map((c) => c.name));

  // Validate and normalize charts (AC-23.4.6: 2-4 charts)
  const charts: ChartConfig[] = (parsed.charts || [])
    .slice(0, 4)
    .map((chart, idx) => {
      const xKey = columnNames.has(chart.xKey || '')
        ? chart.xKey!
        : columns[0]?.name || 'x';
      const yKey = chart.yKey || columns[1]?.name || 'y';

      return {
        id: `chart-${idx + 1}`,
        type: validateChartType(chart.type),
        title: chart.title || `Chart ${idx + 1}`,
        xKey,
        yKey,
        description: chart.description,
        data: buildChartData(rows, xKey, yKey),
      };
    });

  // Ensure at least 2 charts
  while (charts.length < 2 && columns.length >= 2) {
    const numericCols = columns.filter((c) =>
      ['number', 'currency', 'percentage'].includes(c.type)
    );
    const textCols = columns.filter(
      (c) => c.type === 'text' && c.uniqueCount < 50
    );

    if (numericCols.length > 0) {
      const xKey = textCols[0]?.name || columns[0]?.name || 'category';
      const yKey = numericCols[0]?.name || 'value';

      charts.push({
        id: `chart-${charts.length + 1}`,
        type: charts.length === 0 ? 'bar' : 'pie',
        title: `${numericCols[0]?.name || 'Value'} Distribution`,
        xKey,
        yKey,
        data: buildChartData(rows, xKey, yKey),
      });
    } else {
      break;
    }
  }

  return {
    title: parsed.title || 'Data Analysis Report',
    summary: parsed.summary || 'Analysis of the uploaded dataset.',
    insights,
    charts,
    dataTable: {
      columns: columns.map((c) => c.name),
      rows: rows,
      sortable: true,
      filterable: true,
    },
    generatedAt: new Date().toISOString(),
    promptUsed: prompt || 'Auto-generated analysis',
  };
}

// ============================================================================
// Main Route Handler
// ============================================================================

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    // Parse request body
    let body: { sourceId: string; prompt?: string };
    try {
      body = await request.json();
    } catch {
      const error: ApiError = {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body. Expected { sourceId: string, prompt?: string }',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { sourceId, prompt } = body;

    if (!sourceId) {
      const error: ApiError = {
        code: 'INVALID_REQUEST',
        message: 'sourceId is required',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const error: ApiError = {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's agency
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      const error: ApiError = {
        code: 'AUTH_REQUIRED',
        message: 'User not found',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const agencyId = userData.agency_id;

    // Verify source exists and user has access (RLS via SELECT - verify-then-service pattern)
    const { data: source, error: sourceError } = await supabase
      .from('commission_data_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: 'Data source not found',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate source status is 'ready'
    if (source.status !== 'ready') {
      const error: ApiError = {
        code: 'INVALID_STATUS',
        message: `Cannot generate report for source with status '${source.status}'. Expected 'ready'.`,
        details: { currentStatus: source.status },
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load parsed data
    const parsedData = source.parsed_data as ParsedData | null;

    if (!parsedData || !parsedData.columns || !parsedData.rows) {
      const error: ApiError = {
        code: 'NO_PARSED_DATA',
        message: 'Source has no parsed data. Please run analysis first.',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify LLM configuration
    if (!process.env.OPENROUTER_API_KEY) {
      const error: ApiError = {
        code: 'SERVICE_UNAVAILABLE',
        message: 'AI service not configured',
      };
      return new Response(JSON.stringify({ data: null, error }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create SSE streaming response (AC-23.4.4)
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Stage 1: Analyzing (0-30%)
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'analyzing', percent: 10 })
            )
          );

          // Build context for AI
          const columnSummary = buildColumnSummary(parsedData.columns);
          const sampleData = buildSampleData(
            parsedData.rows,
            parsedData.columns,
            50
          );

          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'analyzing', percent: 30 })
            )
          );

          // Stage 2: Generating (30-80%)
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'generating', percent: 40 })
            )
          );

          const client = getLLMClient();
          const modelId = getModelId();

          const userPrompt = `Dataset Information:
- Total Rows: ${parsedData.metadata.totalRows.toLocaleString()}
- Total Columns: ${parsedData.metadata.totalColumns}
- File Type: ${parsedData.metadata.fileType}

Columns:
${columnSummary}

Sample Data (first ${Math.min(parsedData.rows.length, 50)} rows):
${sampleData}

${prompt ? `User Request: ${prompt}` : 'Generate a comprehensive analysis of this data, identifying the most important patterns, trends, and insights.'}

Generate the report now:`;

          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'generating', percent: 50 })
            )
          );

          // Call AI
          const response = await client.chat.completions.create({
            model: modelId,
            messages: [
              { role: 'system', content: REPORT_GENERATION_SYSTEM },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 3000,
          });

          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'generating', percent: 70 })
            )
          );

          const content = response.choices[0]?.message?.content || '{}';

          // Stage 3: Charting (80-100%)
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'charting', percent: 80 })
            )
          );

          // Parse and build report
          const report = parseAIResponse(
            content,
            prompt,
            parsedData.columns,
            parsedData.rows
          );

          // Emit title
          controller.enqueue(
            encoder.encode(formatSSEEvent({ type: 'title', title: report.title }))
          );

          // Emit summary
          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'summary', summary: report.summary })
            )
          );

          // Emit insights one by one
          for (const insight of report.insights) {
            controller.enqueue(
              encoder.encode(formatSSEEvent({ type: 'insight', insight }))
            );
          }

          // Emit chart configs one by one
          for (const chart of report.charts) {
            controller.enqueue(
              encoder.encode(formatSSEEvent({ type: 'chart', chart }))
            );
          }

          controller.enqueue(
            encoder.encode(
              formatSSEEvent({ type: 'progress', stage: 'charting', percent: 100 })
            )
          );

          // Emit final done event with complete report
          controller.enqueue(
            encoder.encode(formatSSEEvent({ type: 'done', report }))
          );

          // Log audit event
          const processingTimeMs = Date.now() - startTime;
          await logAuditEvent({
            agencyId,
            userId: user.id,
            action: 'reporting_generated',
            metadata: {
              sourceId,
              filename: source.filename,
              promptUsed: prompt || '(auto-analysis)',
              insightCount: report.insights.length,
              chartCount: report.charts.length,
              processingTimeMs,
              timestamp: new Date().toISOString(),
            },
          });

          // AC-23.4.5: Log warning if > 30 seconds
          if (processingTimeMs > 30000) {
            console.warn(`Report generation took ${processingTimeMs}ms (> 30s target)`, {
              sourceId,
              rowCount: parsedData.metadata.totalRows,
            });
          }

          controller.close();
        } catch (error) {
          console.error('Report generation error:', error);

          // Emit error event (AC-23.4.7)
          const errorEvent: ReportSSEEvent = {
            type: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'Report generation failed. Please try again.',
            code: 'GENERATION_FAILED',
          };
          controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Generate route error:', err);
    const error: ApiError = {
      code: 'GENERATION_FAILED',
      message: 'An unexpected error occurred',
    };
    return new Response(JSON.stringify({ data: null, error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
