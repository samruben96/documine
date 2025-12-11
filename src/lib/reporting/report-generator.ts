/**
 * Report Generator Service
 * Epic 23: Flexible AI Reports - Story 23.4
 *
 * AI-powered report generation from parsed data with optional user prompts.
 * AC-23.4.1: AI generates report title and summary from data + prompt
 * AC-23.4.2: Report includes 3-5 key insights with type/severity indicators
 * AC-23.4.3: Without prompt, AI generates best-effort analysis automatically
 * AC-23.4.5: Generation completes within 30 seconds for datasets < 10K rows
 * AC-23.4.6: Report includes chart configurations (2-4 recommended visualizations)
 */

import { getLLMClient, getModelId } from '@/lib/llm/config';
import type {
  ParsedData,
  ColumnInfo,
  GeneratedReport,
  ReportInsight,
  ChartConfig,
} from '@/types/reporting';

// ============================================================================
// Types
// ============================================================================

export interface GenerateReportOptions {
  /** Maximum time to wait for generation in ms (default: 30000) */
  timeout?: number;
  /** Maximum rows to include in sample data (default: 50) */
  maxSampleRows?: number;
}

export interface ReportProgress {
  stage: 'analyzing' | 'generating' | 'charting';
  percent: number;
}

// ============================================================================
// System Prompts
// ============================================================================

/**
 * System prompt for AI report generation.
 * Instructs the AI to generate structured report content.
 */
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
      "yKey": "string|string[]",
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
          summary += `: min=${col.stats.min}, max=${col.stats.max}, avg=${col.stats.mean.toFixed(2)}, sum=${col.stats.sum.toFixed(2)}`;
        } else if ('earliest' in col.stats) {
          summary += `: ${col.stats.earliest} to ${col.stats.latest} (${col.stats.range})`;
        }
      }

      summary += ` [${col.uniqueCount} unique, ${col.nullCount} nulls]`;
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
  const colNames = columns.slice(0, 10).map((c) => c.name); // Limit columns for context

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
 * Build chart data by aggregating rows based on xKey and yKey.
 * Groups data by xKey and sums numeric yKey values for visualization.
 *
 * AC-23.9.2: Filters out zero-sum categories and "Unknown" labels
 */
function buildChartData(
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string | string[]
): Record<string, unknown>[] {
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  // Values to filter out (AC-23.9.2)
  const invalidXValues = new Set([
    'unknown',
    'n/a',
    'na',
    'null',
    'undefined',
    '',
  ]);

  // Group and aggregate by xKey
  const grouped = new Map<string, Record<string, number>>();

  for (const row of rows) {
    const rawXValue = row[xKey];

    // Skip null/undefined xKey values (AC-23.9.2)
    if (rawXValue === null || rawXValue === undefined) continue;

    const xValue = String(rawXValue);

    // Skip invalid/unknown xKey values (AC-23.9.2)
    if (invalidXValues.has(xValue.toLowerCase().trim())) continue;

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

  // Convert to array format for charts, filtering out zero-sum entries (AC-23.9.2)
  const result: Record<string, unknown>[] = [];
  for (const [xValue, yValues] of grouped) {
    // Calculate sum of all yKey values
    const totalSum = Object.values(yValues).reduce((sum, val) => sum + val, 0);

    // Skip entries where all values sum to 0 (AC-23.9.2)
    if (totalSum === 0) continue;

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
 * Parse and validate AI response to GeneratedReport structure.
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
    // If JSON parsing fails, create a basic report structure
    parsed = {
      title: 'Data Analysis Report',
      summary: content.substring(0, 500),
      insights: [],
      charts: [],
    };
  }

  // Validate and normalize insights
  const insights: ReportInsight[] = (parsed.insights || [])
    .slice(0, 5)
    .map((insight, idx) => ({
      type: validateInsightType(insight.type) || 'finding',
      severity: validateSeverity(insight.severity) || 'info',
      title: insight.title || `Insight ${idx + 1}`,
      description: insight.description || '',
      relatedColumns: insight.relatedColumns || [],
    }));

  // Ensure we have at least 3 insights
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

  // Validate and normalize charts
  const charts: ChartConfig[] = (parsed.charts || [])
    .slice(0, 4)
    .map((chart, idx) => {
      const xKey = columnNames.has(chart.xKey || '')
        ? chart.xKey!
        : columns[0]?.name || 'x';
      const yKey = chart.yKey || columns[1]?.name || 'y';

      return {
        id: `chart-${idx + 1}`,
        type: validateChartType(chart.type) || 'bar',
        title: chart.title || `Chart ${idx + 1}`,
        xKey,
        yKey,
        description: chart.description,
        data: buildChartData(rows, xKey, yKey),
      };
    });

  // Ensure we have at least 2 charts
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

  // Build data table config (use all data)
  const dataTable = {
    columns: columns.map((c) => c.name),
    rows: rows,
    sortable: true,
    filterable: true,
  };

  return {
    title: parsed.title || 'Data Analysis Report',
    summary: parsed.summary || 'Analysis of the uploaded dataset.',
    insights,
    charts,
    dataTable,
    generatedAt: new Date().toISOString(),
    promptUsed: prompt || 'Auto-generated analysis',
  };
}

/**
 * Validate insight type.
 */
function validateInsightType(
  type?: string
): 'finding' | 'trend' | 'anomaly' | 'recommendation' | null {
  const valid = ['finding', 'trend', 'anomaly', 'recommendation'];
  return valid.includes(type || '') ? (type as ReportInsight['type']) : null;
}

/**
 * Validate severity level.
 */
function validateSeverity(
  severity?: string
): 'info' | 'warning' | 'critical' | null {
  const valid = ['info', 'warning', 'critical'];
  if (severity && valid.includes(severity)) {
    return severity as 'info' | 'warning' | 'critical';
  }
  return null;
}

/**
 * Validate chart type.
 */
function validateChartType(
  type?: string
): 'bar' | 'line' | 'pie' | 'area' | null {
  const valid = ['bar', 'line', 'pie', 'area'];
  return valid.includes(type || '') ? (type as ChartConfig['type']) : null;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate an AI-powered report from parsed data.
 *
 * AC-23.4.1: Generates report title and summary
 * AC-23.4.2: Includes 3-5 key insights
 * AC-23.4.3: Auto-analysis when no prompt provided
 * AC-23.4.5: Completes within 30 seconds
 * AC-23.4.6: Includes 2-4 chart configurations
 *
 * @param parsedData - Parsed data from file
 * @param prompt - Optional user prompt for report direction
 * @param options - Generation options
 * @returns Generated report
 */
export async function generateReport(
  parsedData: ParsedData,
  prompt?: string,
  options: GenerateReportOptions = {}
): Promise<GeneratedReport> {
  const { timeout = 30000, maxSampleRows = 50 } = options;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const client = getLLMClient();
    const modelId = getModelId();

    // Build context about the data
    const columnSummary = buildColumnSummary(parsedData.columns);
    const sampleData = buildSampleData(
      parsedData.rows,
      parsedData.columns,
      maxSampleRows
    );

    // Build user prompt
    const userPrompt = `Dataset Information:
- Total Rows: ${parsedData.metadata.totalRows.toLocaleString()}
- Total Columns: ${parsedData.metadata.totalColumns}
- File Type: ${parsedData.metadata.fileType}

Columns:
${columnSummary}

Sample Data (first ${Math.min(parsedData.rows.length, maxSampleRows)} rows):
${sampleData}

${prompt ? `User Request: ${prompt}` : 'Generate a comprehensive analysis of this data, identifying the most important patterns, trends, and insights.'}

Generate the report now:`;

    const response = await client.chat.completions.create(
      {
        model: modelId,
        messages: [
          { role: 'system', content: REPORT_GENERATION_SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      },
      { signal: controller.signal }
    );

    const content = response.choices[0]?.message?.content || '{}';

    return parseAIResponse(content, prompt, parsedData.columns, parsedData.rows);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate report with streaming progress updates.
 * Used by the API route for SSE streaming.
 *
 * @param parsedData - Parsed data from file
 * @param prompt - Optional user prompt
 * @param onProgress - Callback for progress updates
 * @returns Generated report
 */
export async function generateReportWithProgress(
  parsedData: ParsedData,
  prompt?: string,
  onProgress?: (progress: ReportProgress) => void
): Promise<GeneratedReport> {
  // Stage 1: Analyzing (0-30%)
  onProgress?.({ stage: 'analyzing', percent: 10 });

  // Build context
  const columnSummary = buildColumnSummary(parsedData.columns);
  const sampleData = buildSampleData(parsedData.rows, parsedData.columns, 50);

  onProgress?.({ stage: 'analyzing', percent: 30 });

  // Stage 2: Generating (30-80%)
  onProgress?.({ stage: 'generating', percent: 40 });

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

  onProgress?.({ stage: 'generating', percent: 50 });

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: REPORT_GENERATION_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  onProgress?.({ stage: 'generating', percent: 70 });

  const content = response.choices[0]?.message?.content || '{}';

  // Stage 3: Charting (80-100%)
  onProgress?.({ stage: 'charting', percent: 80 });

  const report = parseAIResponse(
    content,
    prompt,
    parsedData.columns,
    parsedData.rows
  );

  onProgress?.({ stage: 'charting', percent: 100 });

  return report;
}
