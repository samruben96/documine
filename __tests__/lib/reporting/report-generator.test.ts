/**
 * Report Generator Service Tests
 * Epic 23: Flexible AI Reports - Story 23.4
 *
 * Tests for report generation, response parsing, and validation.
 * AC-23.4.1: AI generates report title and summary from data + prompt
 * AC-23.4.2: Report includes 3-5 key insights with type/severity indicators
 * AC-23.4.3: Without prompt, AI generates best-effort analysis automatically
 * AC-23.4.5: Generation completes within 30 seconds for datasets < 10K rows
 * AC-23.4.6: Report includes chart configurations for 2-4 visualizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateReport,
  generateReportWithProgress,
} from '@/lib/reporting/report-generator';
import type { ParsedData, ColumnInfo } from '@/types/reporting';

// Mock the LLM config module
vi.mock('@/lib/llm/config', () => ({
  getLLMClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
  getModelId: vi.fn(() => 'anthropic/claude-sonnet-4.5'),
}));

// Sample test data
const createTestParsedData = (rowCount = 100): ParsedData => ({
  columns: [
    {
      name: 'Date',
      type: 'date',
      sampleValues: ['2024-01-01', '2024-01-02'],
      nullCount: 0,
      uniqueCount: rowCount,
      stats: { earliest: '2024-01-01', latest: '2024-12-31', range: '365 days' },
    },
    {
      name: 'Revenue',
      type: 'currency',
      sampleValues: ['$1,000', '$2,500'],
      nullCount: 5,
      uniqueCount: rowCount - 5,
      stats: { min: 100, max: 10000, mean: 2500, sum: rowCount * 2500 },
    },
    {
      name: 'Region',
      type: 'text',
      sampleValues: ['North', 'South', 'East', 'West'],
      nullCount: 0,
      uniqueCount: 4,
    },
    {
      name: 'Quantity',
      type: 'number',
      sampleValues: [10, 25, 50],
      nullCount: 2,
      uniqueCount: 50,
      stats: { min: 1, max: 100, mean: 25, sum: rowCount * 25 },
    },
  ] as ColumnInfo[],
  rows: Array.from({ length: rowCount }, (_, i) => ({
    Date: `2024-0${(i % 12) + 1}-01`,
    Revenue: 1000 + (i * 100),
    Region: ['North', 'South', 'East', 'West'][i % 4],
    Quantity: 10 + (i % 90),
  })),
  metadata: {
    totalRows: rowCount,
    totalColumns: 4,
    parsedAt: new Date().toISOString(),
    fileType: 'csv',
  },
});

// Sample valid AI response
const createValidAIResponse = () => JSON.stringify({
  title: 'Revenue Analysis Report',
  summary: 'This report analyzes revenue trends across regions. Key findings include strong performance in the North region and seasonal patterns in Q4. Recommendations include focusing marketing efforts on underperforming regions.',
  insights: [
    {
      type: 'finding',
      severity: 'info',
      title: 'North Region Leads Revenue',
      description: 'The North region accounts for 35% of total revenue, outperforming other regions.',
      relatedColumns: ['Region', 'Revenue'],
    },
    {
      type: 'trend',
      severity: 'info',
      title: 'Q4 Shows Strong Growth',
      description: 'Revenue increased 25% in Q4 compared to Q3.',
      relatedColumns: ['Date', 'Revenue'],
    },
    {
      type: 'anomaly',
      severity: 'warning',
      title: 'March Revenue Dip',
      description: 'Unusual 15% drop in revenue during March.',
      relatedColumns: ['Date', 'Revenue'],
    },
    {
      type: 'recommendation',
      severity: 'info',
      title: 'Focus on South Region',
      description: 'South region shows growth potential with untapped market.',
      relatedColumns: ['Region'],
    },
  ],
  charts: [
    {
      type: 'bar',
      title: 'Revenue by Region',
      xKey: 'Region',
      yKey: 'Revenue',
      description: 'Comparison of total revenue across regions',
    },
    {
      type: 'line',
      title: 'Revenue Over Time',
      xKey: 'Date',
      yKey: 'Revenue',
      description: 'Monthly revenue trend',
    },
    {
      type: 'pie',
      title: 'Regional Distribution',
      xKey: 'Region',
      yKey: 'Revenue',
      description: 'Percentage breakdown by region',
    },
  ],
});

describe('Report Generator Service', () => {
  let mockLLMClient: {
    chat: { completions: { create: ReturnType<typeof vi.fn> } };
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock LLM client
    const { getLLMClient } = require('@/lib/llm/config');
    mockLLMClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: createValidAIResponse() } }],
          }),
        },
      },
    };
    getLLMClient.mockReturnValue(mockLLMClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateReport', () => {
    it('generates a report with title and summary (AC-23.4.1)', async () => {
      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData, 'Show me revenue trends');

      expect(report.title).toBe('Revenue Analysis Report');
      expect(report.summary).toContain('revenue trends');
      expect(report.generatedAt).toBeDefined();
      expect(report.promptUsed).toBe('Show me revenue trends');
    });

    it('includes 3-5 insights with type and severity (AC-23.4.2)', async () => {
      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.insights.length).toBeGreaterThanOrEqual(3);
      expect(report.insights.length).toBeLessThanOrEqual(5);

      // Each insight should have required fields
      report.insights.forEach((insight) => {
        expect(['finding', 'trend', 'anomaly', 'recommendation']).toContain(
          insight.type
        );
        expect(['info', 'warning', 'critical']).toContain(insight.severity);
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
      });
    });

    it('generates auto-analysis when no prompt provided (AC-23.4.3)', async () => {
      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.promptUsed).toBe('Auto-generated analysis');
      expect(mockLLMClient.chat.completions.create).toHaveBeenCalled();

      // Verify the prompt sent to LLM includes auto-analysis instruction
      const callArgs = mockLLMClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain(
        'Generate a comprehensive analysis'
      );
    });

    it('includes 2-4 chart configurations (AC-23.4.6)', async () => {
      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.charts.length).toBeGreaterThanOrEqual(2);
      expect(report.charts.length).toBeLessThanOrEqual(4);

      // Each chart should have required fields
      report.charts.forEach((chart) => {
        expect(['bar', 'line', 'pie', 'area']).toContain(chart.type);
        expect(chart.title).toBeDefined();
        expect(chart.xKey).toBeDefined();
        expect(chart.yKey).toBeDefined();
      });
    });

    it('handles malformed AI response gracefully', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'This is not valid JSON' } }],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      // Should still return a valid report structure
      expect(report.title).toBe('Data Analysis Report');
      expect(report.insights.length).toBeGreaterThanOrEqual(3);
      expect(report.charts.length).toBeGreaterThanOrEqual(2);
    });

    it('handles markdown code blocks in AI response', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '```json\n' + createValidAIResponse() + '\n```',
            },
          },
        ],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.title).toBe('Revenue Analysis Report');
    });

    it('includes data table configuration', async () => {
      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.dataTable).toBeDefined();
      expect(report.dataTable.columns).toHaveLength(4);
      expect(report.dataTable.rows.length).toBe(parsedData.rows.length);
      expect(report.dataTable.sortable).toBe(true);
      expect(report.dataTable.filterable).toBe(true);
    });

    it('validates and normalizes insight types', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Report',
                summary: 'Test summary',
                insights: [
                  {
                    type: 'invalid_type',
                    severity: 'invalid_severity',
                    title: 'Test',
                    description: 'Test desc',
                  },
                ],
                charts: [],
              }),
            },
          },
        ],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      // Should default to 'finding' and 'info'
      expect(report.insights[0].type).toBe('finding');
      expect(report.insights[0].severity).toBe('info');
    });

    it('validates and normalizes chart types', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Report',
                summary: 'Test summary',
                insights: [],
                charts: [
                  {
                    type: 'invalid_chart',
                    title: 'Test',
                    xKey: 'x',
                    yKey: 'y',
                  },
                ],
              }),
            },
          },
        ],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      // Should default to 'bar'
      expect(report.charts[0].type).toBe('bar');
    });
  });

  describe('generateReportWithProgress', () => {
    it('emits progress callbacks during generation', async () => {
      const parsedData = createTestParsedData();
      const progressUpdates: { stage: string; percent: number }[] = [];

      await generateReportWithProgress(parsedData, 'Test prompt', (progress) => {
        progressUpdates.push(progress);
      });

      // Should have progress updates for analyzing, generating, charting
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some((p) => p.stage === 'analyzing')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'generating')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'charting')).toBe(true);

      // Should end at 100%
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.percent).toBe(100);
    });

    it('returns same report structure as generateReport', async () => {
      const parsedData = createTestParsedData();
      const report = await generateReportWithProgress(parsedData);

      expect(report.title).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.insights.length).toBeGreaterThanOrEqual(3);
      expect(report.charts.length).toBeGreaterThanOrEqual(2);
      expect(report.dataTable).toBeDefined();
    });
  });

  describe('data context building', () => {
    it('includes column statistics in AI prompt', async () => {
      const parsedData = createTestParsedData();
      await generateReport(parsedData);

      const callArgs = mockLLMClient.chat.completions.create.mock.calls[0][0];
      const userPrompt = callArgs.messages[1].content;

      // Should include column info
      expect(userPrompt).toContain('Revenue');
      expect(userPrompt).toContain('currency');
      expect(userPrompt).toContain('Date');
      expect(userPrompt).toContain('Region');
    });

    it('limits sample data to maxSampleRows', async () => {
      const parsedData = createTestParsedData(1000);
      await generateReport(parsedData, undefined, { maxSampleRows: 10 });

      const callArgs = mockLLMClient.chat.completions.create.mock.calls[0][0];
      const userPrompt = callArgs.messages[1].content;

      // Should mention sample rows
      expect(userPrompt).toContain('first 10 rows');
    });

    it('includes dataset metadata in prompt', async () => {
      const parsedData = createTestParsedData(500);
      await generateReport(parsedData);

      const callArgs = mockLLMClient.chat.completions.create.mock.calls[0][0];
      const userPrompt = callArgs.messages[1].content;

      expect(userPrompt).toContain('500');
      expect(userPrompt).toContain('4'); // columns
      expect(userPrompt).toContain('csv');
    });
  });

  describe('error handling', () => {
    it('handles LLM API errors gracefully', async () => {
      mockLLMClient.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const parsedData = createTestParsedData();

      await expect(generateReport(parsedData)).rejects.toThrow(
        'API rate limit exceeded'
      );
    });

    it('handles empty AI response', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      // Should return fallback report
      expect(report.title).toBe('Data Analysis Report');
      expect(report.insights.length).toBeGreaterThanOrEqual(3);
    });

    it('handles null message content', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.title).toBe('Data Analysis Report');
    });
  });

  describe('insight generation fallback', () => {
    it('fills in missing insights to reach minimum of 3', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Report',
                summary: 'Test summary',
                insights: [
                  {
                    type: 'finding',
                    severity: 'info',
                    title: 'Only One',
                    description: 'Only one insight',
                  },
                ],
                charts: [],
              }),
            },
          },
        ],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.insights.length).toBe(3);
      expect(report.insights[1].title).toContain('General Observation');
    });
  });

  describe('chart generation fallback', () => {
    it('fills in missing charts to reach minimum of 2', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Report',
                summary: 'Test summary',
                insights: [],
                charts: [],
              }),
            },
          },
        ],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      expect(report.charts.length).toBe(2);
    });

    it('uses numeric columns for fallback charts', async () => {
      mockLLMClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Report',
                summary: 'Test summary',
                insights: [],
                charts: [],
              }),
            },
          },
        ],
      });

      const parsedData = createTestParsedData();
      const report = await generateReport(parsedData);

      // Should use Revenue (currency) column for yKey
      const hasRevenueChart = report.charts.some(
        (c) => c.yKey === 'Revenue' || c.title.includes('Revenue')
      );
      expect(hasRevenueChart).toBe(true);
    });
  });

  describe('chart data filtering (AC-23.9.2)', () => {
    it('filters out Unknown xKey values from chart data', async () => {
      const parsedData = createTestParsedData();
      // Add rows with Unknown region
      parsedData.rows.push(
        { Date: '2024-01-01', Revenue: 100, Region: 'Unknown', Quantity: 10 },
        { Date: '2024-01-02', Revenue: 200, Region: null, Quantity: 20 },
        { Date: '2024-01-03', Revenue: 300, Region: '', Quantity: 30 }
      );

      const report = await generateReport(parsedData);

      // Chart data should not contain Unknown, null, or empty Region values
      const regionChart = report.charts.find((c) => c.xKey === 'Region');
      if (regionChart && regionChart.data) {
        const regionValues = regionChart.data.map(
          (d: Record<string, unknown>) => d['Region']
        );
        expect(regionValues).not.toContain('Unknown');
        expect(regionValues).not.toContain(null);
        expect(regionValues).not.toContain('');
      }
    });

    it('filters out zero-sum entries from chart data', async () => {
      const parsedData = createTestParsedData();
      // Add rows where a region has zero revenue
      parsedData.rows = [
        { Date: '2024-01-01', Revenue: 0, Region: 'ZeroRegion', Quantity: 0 },
        { Date: '2024-01-02', Revenue: 500, Region: 'ValidRegion', Quantity: 50 },
      ];

      const report = await generateReport(parsedData);

      // Chart data should not contain ZeroRegion (sum = 0)
      const regionChart = report.charts.find((c) => c.xKey === 'Region');
      if (regionChart && regionChart.data) {
        const regionValues = regionChart.data.map(
          (d: Record<string, unknown>) => d['Region']
        );
        expect(regionValues).not.toContain('ZeroRegion');
        expect(regionValues).toContain('ValidRegion');
      }
    });
  });
});
