/**
 * RAG Metrics Collection
 *
 * Collects and reports metrics for RAG retrieval quality measurement.
 * Implements AC-5.8.1 (test query set) and AC-5.8.2 (baseline metrics).
 *
 * @module @/lib/chat/metrics
 */

import type { ConfidenceLevel } from './confidence';

/**
 * Query categories for test set
 */
export type QueryCategory = 'simple_lookup' | 'table_data' | 'semantic' | 'complex';

/**
 * Test query from the query set
 */
export interface TestQuery {
  id: string;
  category: QueryCategory;
  query: string;
  expectedType: string;
  notes?: string;
}

/**
 * Result from running a single test query
 */
export interface QueryResult {
  queryId: string;
  category: QueryCategory;
  query: string;
  topSimilarityScore: number | null;
  avgSimilarityScore: number | null;
  confidence: ConfidenceLevel;
  chunksRetrieved: number;
  latencyMs: number;
  timestamp: string;
}

/**
 * Category-level metrics
 */
export interface CategoryMetrics {
  queryCount: number;
  avgSimilarityScore: number;
  avgLatencyMs: number;
  recallAt5: number;
  confidenceDistribution: {
    high: number;
    needs_review: number;
    not_found: number;
  };
}

/**
 * Full baseline metrics report
 */
export interface BaselineMetrics {
  version: string;
  description: string;
  generatedAt: string | null;
  documentId: string | null;
  documentName: string | null;
  summary: {
    totalQueries: number;
    avgSimilarityScore: number;
    avgLatencyMs: number;
    confidenceDistribution: {
      high: number;
      needs_review: number;
      not_found: number;
    };
    confidencePercentages: {
      high: number;
      needs_review: number;
      not_found: number;
    };
  };
  byCategory: Record<QueryCategory, CategoryMetrics>;
  queryResults: QueryResult[];
}

/**
 * Calculate metrics summary from query results
 *
 * @param results - Array of query results
 * @returns Computed metrics summary
 */
export function calculateMetricsSummary(results: QueryResult[]): BaselineMetrics['summary'] {
  if (results.length === 0) {
    return {
      totalQueries: 0,
      avgSimilarityScore: 0,
      avgLatencyMs: 0,
      confidenceDistribution: { high: 0, needs_review: 0, not_found: 0 },
      confidencePercentages: { high: 0, needs_review: 0, not_found: 0 },
    };
  }

  const validScores = results
    .map((r) => r.topSimilarityScore)
    .filter((s): s is number => s !== null);

  const avgSimilarityScore =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

  const avgLatencyMs = results.reduce((a, b) => a + b.latencyMs, 0) / results.length;

  const confidenceDistribution = {
    high: results.filter((r) => r.confidence === 'high').length,
    needs_review: results.filter((r) => r.confidence === 'needs_review').length,
    not_found: results.filter((r) => r.confidence === 'not_found').length,
  };

  const total = results.length;
  const confidencePercentages = {
    high: Math.round((confidenceDistribution.high / total) * 100),
    needs_review: Math.round((confidenceDistribution.needs_review / total) * 100),
    not_found: Math.round((confidenceDistribution.not_found / total) * 100),
  };

  return {
    totalQueries: results.length,
    avgSimilarityScore: Math.round(avgSimilarityScore * 1000) / 1000,
    avgLatencyMs: Math.round(avgLatencyMs),
    confidenceDistribution,
    confidencePercentages,
  };
}

/**
 * Calculate metrics for a specific category
 *
 * @param results - Query results filtered by category
 * @returns Category metrics
 */
export function calculateCategoryMetrics(results: QueryResult[]): CategoryMetrics {
  if (results.length === 0) {
    return {
      queryCount: 0,
      avgSimilarityScore: 0,
      avgLatencyMs: 0,
      recallAt5: 0,
      confidenceDistribution: { high: 0, needs_review: 0, not_found: 0 },
    };
  }

  const validScores = results
    .map((r) => r.topSimilarityScore)
    .filter((s): s is number => s !== null);

  const avgSimilarityScore =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

  const avgLatencyMs = results.reduce((a, b) => a + b.latencyMs, 0) / results.length;

  // Recall@5: queries that retrieved at least one relevant chunk (similarity > 0.3)
  const relevantQueries = results.filter(
    (r) => r.chunksRetrieved > 0 && r.topSimilarityScore !== null && r.topSimilarityScore > 0.3
  );
  const recallAt5 = relevantQueries.length / results.length;

  const confidenceDistribution = {
    high: results.filter((r) => r.confidence === 'high').length,
    needs_review: results.filter((r) => r.confidence === 'needs_review').length,
    not_found: results.filter((r) => r.confidence === 'not_found').length,
  };

  return {
    queryCount: results.length,
    avgSimilarityScore: Math.round(avgSimilarityScore * 1000) / 1000,
    avgLatencyMs: Math.round(avgLatencyMs),
    recallAt5: Math.round(recallAt5 * 100) / 100,
    confidenceDistribution,
  };
}

/**
 * Build full baseline metrics report from query results
 *
 * @param results - All query results
 * @param documentId - The document ID used for testing
 * @param documentName - Human-readable document name
 * @returns Full baseline metrics report
 */
export function buildBaselineReport(
  results: QueryResult[],
  documentId: string,
  documentName: string
): BaselineMetrics {
  const summary = calculateMetricsSummary(results);

  const categories: QueryCategory[] = ['simple_lookup', 'table_data', 'semantic', 'complex'];
  const byCategory = {} as Record<QueryCategory, CategoryMetrics>;

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category);
    byCategory[category] = calculateCategoryMetrics(categoryResults);
  }

  return {
    version: '1.0',
    description: 'Baseline metrics for RAG retrieval quality (Story 5.8)',
    generatedAt: new Date().toISOString(),
    documentId,
    documentName,
    summary,
    byCategory,
    queryResults: results,
  };
}

/**
 * Compare two metrics reports and summarize improvements
 *
 * @param baseline - Baseline metrics
 * @param current - Current metrics after optimization
 * @returns Comparison summary
 */
export function compareMetrics(
  baseline: BaselineMetrics,
  current: BaselineMetrics
): {
  highConfidenceChange: number;
  notFoundChange: number;
  avgSimilarityChange: number;
  avgLatencyChange: number;
  meetsTargets: {
    highConfidence: boolean; // >= 50%
    notFound: boolean; // <= 25%
    latency: boolean; // P95 < 3s
  };
} {
  const highConfidenceChange =
    current.summary.confidencePercentages.high - baseline.summary.confidencePercentages.high;
  const notFoundChange =
    current.summary.confidencePercentages.not_found -
    baseline.summary.confidencePercentages.not_found;
  const avgSimilarityChange =
    current.summary.avgSimilarityScore - baseline.summary.avgSimilarityScore;
  const avgLatencyChange = current.summary.avgLatencyMs - baseline.summary.avgLatencyMs;

  return {
    highConfidenceChange,
    notFoundChange,
    avgSimilarityChange,
    avgLatencyChange,
    meetsTargets: {
      highConfidence: current.summary.confidencePercentages.high >= 50,
      notFound: current.summary.confidencePercentages.not_found <= 25,
      latency: current.summary.avgLatencyMs < 3000,
    },
  };
}
