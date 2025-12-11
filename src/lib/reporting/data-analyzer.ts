/**
 * Data Analyzer Service
 * Epic 23: Flexible AI Reports - Story 23.2
 *
 * Analyzes parsed data to detect column types and generate AI-powered prompt suggestions.
 * AC-23.2.3: AI detects column types (number, date, text, boolean, currency, percentage)
 * AC-23.2.4: AI suggests 3-5 relevant report prompts based on detected data patterns
 */

import { getLLMClient, getModelId } from '@/lib/llm/config';
import type { ParsedData, ColumnInfo, ColumnType, NumericStats, DateStats } from '@/types/reporting';

// ============================================================================
// Column Type Detection (AC-23.2.3)
// ============================================================================

/**
 * Date format patterns for detection.
 */
const DATE_PATTERNS = [
  // ISO formats
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/,
  // US format: MM/DD/YYYY
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  // EU format: DD.MM.YYYY
  /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,
  // Written format: Jan 1, 2024
  /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}$/,
];

/**
 * Currency patterns for detection.
 */
const CURRENCY_PATTERNS = [
  // $1,234.56 or $1234.56
  /^\$[\d,]+\.?\d*$/,
  // 1,234.56 USD
  /^[\d,]+\.?\d*\s*(USD|EUR|GBP|CAD|AUD)$/i,
  // €1.234,56 (EU format)
  /^[€£¥][\d.]+,?\d*$/,
];

/**
 * Analyze a single value to determine its likely type.
 */
function detectValueType(value: unknown): ColumnType {
  if (value === null || value === undefined) {
    return 'text'; // Can't determine from null
  }

  // Already typed by parser
  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (value instanceof Date) {
    return 'date';
  }

  const strValue = String(value).trim();

  if (strValue === '') {
    return 'text';
  }

  // Check for boolean strings
  const lower = strValue.toLowerCase();
  if (['true', 'false', 'yes', 'no', '1', '0'].includes(lower)) {
    return 'boolean';
  }

  // Check for percentage
  if (strValue.endsWith('%')) {
    const num = parseFloat(strValue.slice(0, -1));
    if (!isNaN(num)) {
      return 'percentage';
    }
  }

  // Check for currency
  for (const pattern of CURRENCY_PATTERNS) {
    if (pattern.test(strValue)) {
      return 'currency';
    }
  }

  // Check for date
  for (const pattern of DATE_PATTERNS) {
    if (pattern.test(strValue)) {
      return 'date';
    }
  }

  // Check for number (after removing currency symbols)
  const cleanedNum = strValue.replace(/[$€£¥,]/g, '');
  const num = parseFloat(cleanedNum);
  if (!isNaN(num) && isFinite(num) && cleanedNum !== '') {
    // Check if it looks like currency
    if (strValue.includes('$') || strValue.includes('€') || strValue.includes('£')) {
      return 'currency';
    }
    return 'number';
  }

  return 'text';
}

/**
 * Determine the most likely type for a column based on sample values.
 * Uses majority voting with null tolerance.
 */
function determineColumnType(values: unknown[]): ColumnType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) {
    return 'text';
  }

  const typeCounts: Record<ColumnType, number> = {
    number: 0,
    date: 0,
    text: 0,
    boolean: 0,
    currency: 0,
    percentage: 0,
  };

  for (const value of nonNullValues) {
    const type = detectValueType(value);
    typeCounts[type]++;
  }

  // Find majority type (>70% of non-null values)
  const threshold = nonNullValues.length * 0.7;
  let bestType: ColumnType = 'text';
  let bestCount = 0;

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count >= threshold && count > bestCount) {
      bestType = type as ColumnType;
      bestCount = count;
    }
  }

  return bestType;
}

/**
 * Calculate statistics for numeric columns.
 */
function calculateNumericStats(values: unknown[]): NumericStats | undefined {
  const numbers = values
    .map((v) => {
      if (typeof v === 'number') return v;
      if (v === null || v === undefined) return null;
      const str = String(v).replace(/[$€£¥,%]/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    })
    .filter((n): n is number => n !== null);

  if (numbers.length === 0) return undefined;

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
    sum: numbers.reduce((a, b) => a + b, 0),
  };
}

/**
 * Calculate statistics for date columns.
 */
function calculateDateStats(values: unknown[]): DateStats | undefined {
  const dates: Date[] = [];

  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (value instanceof Date) {
      dates.push(value);
      continue;
    }
    const parsed = new Date(String(value));
    if (!isNaN(parsed.getTime())) {
      dates.push(parsed);
    }
  }

  if (dates.length === 0) return undefined;

  dates.sort((a, b) => a.getTime() - b.getTime());
  const earliest = dates[0]!;
  const latest = dates[dates.length - 1]!;
  const diffDays = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

  return {
    earliest: earliest.toISOString().split('T')[0]!,
    latest: latest.toISOString().split('T')[0]!,
    range: `${diffDays} days`,
  };
}

/**
 * Analyze column types for all columns in ParsedData.
 * AC-23.2.3: Detects number, date, text, boolean, currency, percentage.
 *
 * @param data - ParsedData from file parser
 * @returns Array of ColumnInfo with detected types and stats
 */
export function analyzeColumnTypes(data: ParsedData): ColumnInfo[] {
  return data.columns.map((col) => {
    // Get all values for this column
    const values = data.rows.map((row) => row[col.name]);

    // Determine type from values
    const detectedType = determineColumnType(values);

    // Calculate type-specific stats
    let stats: NumericStats | DateStats | undefined;
    if (detectedType === 'number' || detectedType === 'currency' || detectedType === 'percentage') {
      stats = calculateNumericStats(values);
    } else if (detectedType === 'date') {
      stats = calculateDateStats(values);
    }

    return {
      name: col.name,
      type: detectedType,
      sampleValues: values.slice(0, 5),
      nullCount: values.filter((v) => v === null || v === undefined || v === '').length,
      uniqueCount: new Set(values.map((v) => JSON.stringify(v))).size,
      stats,
    };
  });
}

// ============================================================================
// AI Prompt Suggestions (AC-23.2.4)
// ============================================================================

/**
 * System prompt for generating report prompt suggestions.
 */
const PROMPT_SUGGESTION_SYSTEM = `You are a data analyst assistant. Given column names, types, and sample data,
suggest 3-5 natural language prompts the user might want for generating reports.

Focus on:
- Aggregate summaries (totals, averages) for numeric/currency columns
- Time-based trends if date columns are present
- Category comparisons if categorical text columns exist
- Top N analysis by numeric columns
- Distribution analysis for important metrics

Return ONLY a JSON array of 3-5 prompt strings. No explanation, just the JSON array.
Example: ["Show total sales by month", "Compare revenue across regions", "What are the top 10 customers by order value?"]`;

/**
 * Generate AI-powered prompt suggestions based on data analysis.
 * AC-23.2.4: Returns 3-5 relevant report prompts.
 *
 * @param columns - Analyzed column information
 * @param data - Original parsed data
 * @returns Array of 3-5 suggested prompt strings
 */
export async function generateSuggestedPrompts(
  columns: ColumnInfo[],
  data: ParsedData
): Promise<string[]> {
  const client = getLLMClient();
  const modelId = getModelId();

  // Build context about the data
  const columnSummary = columns.map((col) => {
    let summary = `- ${col.name} (${col.type})`;
    if (col.stats) {
      if ('sum' in col.stats) {
        summary += `: min=${col.stats.min}, max=${col.stats.max}, avg=${col.stats.mean.toFixed(2)}`;
      } else if ('earliest' in col.stats) {
        summary += `: ${col.stats.earliest} to ${col.stats.latest}`;
      }
    }
    summary += ` [${col.uniqueCount} unique values]`;
    return summary;
  }).join('\n');

  // Sample data (first 3 rows, truncated)
  const sampleRows = data.rows.slice(0, 3).map((row) => {
    const sample: Record<string, string> = {};
    for (const col of columns.slice(0, 6)) {
      const val = row[col.name];
      sample[col.name] = val !== null && val !== undefined
        ? String(val).substring(0, 50)
        : 'null';
    }
    return JSON.stringify(sample);
  }).join('\n');

  const userPrompt = `Data has ${data.metadata.totalRows} rows and ${data.metadata.totalColumns} columns.

Columns:
${columnSummary}

Sample data:
${sampleRows}

Generate 3-5 useful report prompts for this data:`;

  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: PROMPT_SUGGESTION_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '[]';

    // Parse JSON response
    try {
      // Handle potential markdown code blocks
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '');
      }

      const prompts = JSON.parse(jsonContent);

      if (Array.isArray(prompts) && prompts.every((p) => typeof p === 'string')) {
        // Ensure 3-5 prompts
        return prompts.slice(0, 5);
      }
    } catch {
      console.error('Failed to parse prompt suggestions JSON:', content);
    }

    // Fallback: generate default prompts based on column types
    return generateDefaultPrompts(columns, data);
  } catch (error) {
    console.error('Error generating prompt suggestions:', error);
    // Return default prompts on error
    return generateDefaultPrompts(columns, data);
  }
}

/**
 * Generate default prompt suggestions based on column types.
 * Used as fallback when AI generation fails.
 */
function generateDefaultPrompts(columns: ColumnInfo[], data: ParsedData): string[] {
  const prompts: string[] = [];

  // Find key column types
  const numericCols = columns.filter((c) =>
    ['number', 'currency', 'percentage'].includes(c.type)
  );
  const dateCols = columns.filter((c) => c.type === 'date');
  const textCols = columns.filter((c) => c.type === 'text' && c.uniqueCount < 50);

  // Summary prompt
  if (numericCols.length > 0) {
    prompts.push(`Summarize the key metrics from this data`);
  }

  // Time-based prompt
  if (dateCols.length > 0 && numericCols.length > 0 && numericCols[0]) {
    prompts.push(`Show trends over time for ${numericCols[0].name}`);
  }

  // Category comparison
  if (textCols.length > 0 && numericCols.length > 0 && numericCols[0] && textCols[0]) {
    prompts.push(`Compare ${numericCols[0].name} by ${textCols[0].name}`);
  }

  // Top N prompt
  if (numericCols.length > 0 && numericCols[0]) {
    prompts.push(`What are the top 10 entries by ${numericCols[0].name}?`);
  }

  // Distribution prompt
  if (numericCols.length > 0 && numericCols[0]) {
    prompts.push(`Show the distribution of ${numericCols[0].name}`);
  }

  // Ensure at least 3 prompts
  while (prompts.length < 3) {
    prompts.push(`Generate insights from this ${data.metadata.totalRows} row dataset`);
  }

  return prompts.slice(0, 5);
}
