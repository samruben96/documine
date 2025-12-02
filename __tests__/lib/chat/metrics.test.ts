/**
 * Tests for RAG metrics collection module
 * @module __tests__/lib/chat/metrics.test
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMetricsSummary,
  calculateCategoryMetrics,
  buildBaselineReport,
  compareMetrics,
  type QueryResult,
  type BaselineMetrics,
} from '@/lib/chat/metrics';

describe('calculateMetricsSummary', () => {
  it('returns zeros for empty results', () => {
    const summary = calculateMetricsSummary([]);
    expect(summary.totalQueries).toBe(0);
    expect(summary.avgSimilarityScore).toBe(0);
    expect(summary.avgLatencyMs).toBe(0);
    expect(summary.confidenceDistribution.high).toBe(0);
  });

  it('calculates correct averages', () => {
    const results: QueryResult[] = [
      {
        queryId: 'Q1',
        category: 'simple_lookup',
        query: 'test1',
        topSimilarityScore: 0.9,
        avgSimilarityScore: 0.8,
        confidence: 'high',
        chunksRetrieved: 5,
        latencyMs: 100,
        timestamp: new Date().toISOString(),
      },
      {
        queryId: 'Q2',
        category: 'simple_lookup',
        query: 'test2',
        topSimilarityScore: 0.7,
        avgSimilarityScore: 0.6,
        confidence: 'needs_review',
        chunksRetrieved: 5,
        latencyMs: 200,
        timestamp: new Date().toISOString(),
      },
    ];

    const summary = calculateMetricsSummary(results);

    expect(summary.totalQueries).toBe(2);
    expect(summary.avgSimilarityScore).toBe(0.8); // (0.9 + 0.7) / 2
    expect(summary.avgLatencyMs).toBe(150); // (100 + 200) / 2
    expect(summary.confidenceDistribution.high).toBe(1);
    expect(summary.confidenceDistribution.needs_review).toBe(1);
    expect(summary.confidencePercentages.high).toBe(50);
    expect(summary.confidencePercentages.needs_review).toBe(50);
  });

  it('handles null similarity scores', () => {
    const results: QueryResult[] = [
      {
        queryId: 'Q1',
        category: 'simple_lookup',
        query: 'test1',
        topSimilarityScore: null,
        avgSimilarityScore: null,
        confidence: 'not_found',
        chunksRetrieved: 0,
        latencyMs: 50,
        timestamp: new Date().toISOString(),
      },
      {
        queryId: 'Q2',
        category: 'simple_lookup',
        query: 'test2',
        topSimilarityScore: 0.8,
        avgSimilarityScore: 0.8,
        confidence: 'needs_review',
        chunksRetrieved: 5,
        latencyMs: 100,
        timestamp: new Date().toISOString(),
      },
    ];

    const summary = calculateMetricsSummary(results);

    // Only the non-null score should be averaged
    expect(summary.avgSimilarityScore).toBe(0.8);
    expect(summary.confidenceDistribution.not_found).toBe(1);
  });
});

describe('calculateCategoryMetrics', () => {
  it('calculates recall@5 correctly', () => {
    const results: QueryResult[] = [
      {
        queryId: 'Q1',
        category: 'simple_lookup',
        query: 'test1',
        topSimilarityScore: 0.9,
        avgSimilarityScore: 0.8,
        confidence: 'high',
        chunksRetrieved: 5,
        latencyMs: 100,
        timestamp: new Date().toISOString(),
      },
      {
        queryId: 'Q2',
        category: 'simple_lookup',
        query: 'test2',
        topSimilarityScore: 0.2, // Below 0.3 threshold
        avgSimilarityScore: 0.2,
        confidence: 'not_found',
        chunksRetrieved: 5,
        latencyMs: 100,
        timestamp: new Date().toISOString(),
      },
    ];

    const metrics = calculateCategoryMetrics(results);

    // Only Q1 has relevant results (score > 0.3)
    expect(metrics.recallAt5).toBe(0.5); // 1/2 = 50%
  });

  it('returns zero recall for zero chunks', () => {
    const results: QueryResult[] = [
      {
        queryId: 'Q1',
        category: 'simple_lookup',
        query: 'test1',
        topSimilarityScore: null,
        avgSimilarityScore: null,
        confidence: 'not_found',
        chunksRetrieved: 0,
        latencyMs: 50,
        timestamp: new Date().toISOString(),
      },
    ];

    const metrics = calculateCategoryMetrics(results);
    expect(metrics.recallAt5).toBe(0);
  });
});

describe('buildBaselineReport', () => {
  it('creates a complete report with all categories', () => {
    const results: QueryResult[] = [
      {
        queryId: 'SL-001',
        category: 'simple_lookup',
        query: 'What is the policy number?',
        topSimilarityScore: 0.9,
        avgSimilarityScore: 0.85,
        confidence: 'high',
        chunksRetrieved: 5,
        latencyMs: 100,
        timestamp: new Date().toISOString(),
      },
      {
        queryId: 'TD-001',
        category: 'table_data',
        query: 'What is the deductible?',
        topSimilarityScore: 0.7,
        avgSimilarityScore: 0.65,
        confidence: 'needs_review',
        chunksRetrieved: 5,
        latencyMs: 150,
        timestamp: new Date().toISOString(),
      },
    ];

    const report = buildBaselineReport(results, 'doc-123', 'Test Policy');

    expect(report.version).toBe('1.0');
    expect(report.documentId).toBe('doc-123');
    expect(report.documentName).toBe('Test Policy');
    expect(report.generatedAt).not.toBeNull();
    expect(report.summary.totalQueries).toBe(2);
    expect(report.byCategory.simple_lookup.queryCount).toBe(1);
    expect(report.byCategory.table_data.queryCount).toBe(1);
    expect(report.byCategory.semantic.queryCount).toBe(0);
    expect(report.byCategory.complex.queryCount).toBe(0);
    expect(report.queryResults).toHaveLength(2);
  });
});

describe('compareMetrics', () => {
  it('calculates improvements correctly', () => {
    const baseline: BaselineMetrics = {
      version: '1.0',
      description: 'Baseline',
      generatedAt: '2025-01-01T00:00:00Z',
      documentId: 'doc-1',
      documentName: 'Test',
      summary: {
        totalQueries: 50,
        avgSimilarityScore: 0.55,
        avgLatencyMs: 2000,
        confidenceDistribution: { high: 15, needs_review: 15, not_found: 20 },
        confidencePercentages: { high: 30, needs_review: 30, not_found: 40 },
      },
      byCategory: {
        simple_lookup: {
          queryCount: 15,
          avgSimilarityScore: 0.6,
          avgLatencyMs: 1800,
          recallAt5: 0.8,
          confidenceDistribution: { high: 5, needs_review: 5, not_found: 5 },
        },
        table_data: {
          queryCount: 10,
          avgSimilarityScore: 0.5,
          avgLatencyMs: 2000,
          recallAt5: 0.7,
          confidenceDistribution: { high: 3, needs_review: 3, not_found: 4 },
        },
        semantic: {
          queryCount: 15,
          avgSimilarityScore: 0.55,
          avgLatencyMs: 2100,
          recallAt5: 0.75,
          confidenceDistribution: { high: 4, needs_review: 4, not_found: 7 },
        },
        complex: {
          queryCount: 10,
          avgSimilarityScore: 0.5,
          avgLatencyMs: 2200,
          recallAt5: 0.6,
          confidenceDistribution: { high: 3, needs_review: 3, not_found: 4 },
        },
      },
      queryResults: [],
    };

    const current: BaselineMetrics = {
      ...baseline,
      summary: {
        totalQueries: 50,
        avgSimilarityScore: 0.7,
        avgLatencyMs: 2200,
        confidenceDistribution: { high: 30, needs_review: 15, not_found: 5 },
        confidencePercentages: { high: 60, needs_review: 30, not_found: 10 },
      },
    };

    const comparison = compareMetrics(baseline, current);

    expect(comparison.highConfidenceChange).toBe(30); // 60% - 30%
    expect(comparison.notFoundChange).toBe(-30); // 10% - 40%
    expect(comparison.avgSimilarityChange).toBeCloseTo(0.15, 2);
    expect(comparison.avgLatencyChange).toBe(200);
    expect(comparison.meetsTargets.highConfidence).toBe(true); // 60% >= 50%
    expect(comparison.meetsTargets.notFound).toBe(true); // 10% <= 25%
    expect(comparison.meetsTargets.latency).toBe(true); // 2200ms < 3000ms
  });

  it('identifies when targets are not met', () => {
    const baseline: BaselineMetrics = {
      version: '1.0',
      description: 'Baseline',
      generatedAt: '2025-01-01T00:00:00Z',
      documentId: 'doc-1',
      documentName: 'Test',
      summary: {
        totalQueries: 50,
        avgSimilarityScore: 0.55,
        avgLatencyMs: 2000,
        confidenceDistribution: { high: 15, needs_review: 15, not_found: 20 },
        confidencePercentages: { high: 30, needs_review: 30, not_found: 40 },
      },
      byCategory: {
        simple_lookup: {
          queryCount: 15,
          avgSimilarityScore: 0.6,
          avgLatencyMs: 1800,
          recallAt5: 0.8,
          confidenceDistribution: { high: 5, needs_review: 5, not_found: 5 },
        },
        table_data: {
          queryCount: 10,
          avgSimilarityScore: 0.5,
          avgLatencyMs: 2000,
          recallAt5: 0.7,
          confidenceDistribution: { high: 3, needs_review: 3, not_found: 4 },
        },
        semantic: {
          queryCount: 15,
          avgSimilarityScore: 0.55,
          avgLatencyMs: 2100,
          recallAt5: 0.75,
          confidenceDistribution: { high: 4, needs_review: 4, not_found: 7 },
        },
        complex: {
          queryCount: 10,
          avgSimilarityScore: 0.5,
          avgLatencyMs: 2200,
          recallAt5: 0.6,
          confidenceDistribution: { high: 3, needs_review: 3, not_found: 4 },
        },
      },
      queryResults: [],
    };

    // Same as baseline - targets not met
    const comparison = compareMetrics(baseline, baseline);

    expect(comparison.highConfidenceChange).toBe(0);
    expect(comparison.notFoundChange).toBe(0);
    expect(comparison.meetsTargets.highConfidence).toBe(false); // 30% < 50%
    expect(comparison.meetsTargets.notFound).toBe(false); // 40% > 25%
    expect(comparison.meetsTargets.latency).toBe(true); // 2000ms < 3000ms
  });
});
