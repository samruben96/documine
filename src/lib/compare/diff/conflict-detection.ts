/**
 * Diff Engine Conflict Detection
 *
 * Identifies limit variance, deductible variance, and exclusion mismatches.
 *
 * @module @/lib/compare/diff/conflict-detection
 */

import type { QuoteExtraction, CoverageType, ExclusionCategory } from '@/types/compare';
import type { ConflictWarning } from './types';
import {
  COVERAGE_TYPE_LABELS,
  COVERAGE_SEVERITY,
  SEVERITY_ORDER,
  EXCLUSION_CATEGORY_LABELS,
  EXCLUSION_SEVERITY,
  CONFLICT_THRESHOLDS,
} from './constants';
import { formatCurrency } from './formatters';

/**
 * Detect conflicts across quotes.
 * AC-7.4.3: Identifies limit variance, deductible variance, exclusion mismatches.
 *
 * @param extractions - Array of quote extractions
 * @returns Array of conflict warnings sorted by severity
 */
export function detectConflicts(extractions: QuoteExtraction[]): ConflictWarning[] {
  if (extractions.length < 2) {
    return [];
  }

  const conflicts: ConflictWarning[] = [];

  // Collect all coverage types across all quotes
  const allCoverageTypes = new Set<CoverageType>();
  for (const extraction of extractions) {
    for (const coverage of extraction.coverages) {
      allCoverageTypes.add(coverage.type);
    }
  }

  // Check each coverage type for limit and deductible variances
  for (const coverageType of allCoverageTypes) {
    const coverageData = extractions.map((e, i) => ({
      index: i,
      coverage: e.coverages.find((c) => c.type === coverageType),
    }));

    // Only check if at least 2 quotes have this coverage
    const withCoverage = coverageData.filter((d) => d.coverage !== undefined);
    if (withCoverage.length < 2) {
      continue;
    }

    // Check limit variance
    const limits = withCoverage
      .filter((d) => d.coverage!.limit !== null)
      .map((d) => ({ index: d.index, value: d.coverage!.limit! }));

    if (limits.length >= 2) {
      const maxLimit = Math.max(...limits.map((l) => l.value));
      const minLimit = Math.min(...limits.map((l) => l.value));

      // Conflict if lowest limit is <50% of highest limit
      if (minLimit < maxLimit * (1 - CONFLICT_THRESHOLDS.limitVariance)) {
        const variance = Math.round((1 - minLimit / maxLimit) * 100);
        conflicts.push({
          field: COVERAGE_TYPE_LABELS[coverageType],
          conflictType: 'limit_variance',
          description: `${COVERAGE_TYPE_LABELS[coverageType]} limit varies ${variance}% (${formatCurrency(minLimit)} to ${formatCurrency(maxLimit)})`,
          affectedDocuments: limits.map((l) => l.index),
          severity: COVERAGE_SEVERITY[coverageType],
          coverageType,
        });
      }
    }

    // Check deductible variance
    const deductibles = withCoverage
      .filter((d) => d.coverage!.deductible !== null)
      .map((d) => ({ index: d.index, value: d.coverage!.deductible! }));

    if (deductibles.length >= 2) {
      const maxDeductible = Math.max(...deductibles.map((d) => d.value));
      const minDeductible = Math.min(...deductibles.map((d) => d.value));

      // Conflict if highest deductible is >2x lowest deductible
      if (maxDeductible > minDeductible * (1 + CONFLICT_THRESHOLDS.deductibleVariance)) {
        const variance = Math.round((maxDeductible / minDeductible - 1) * 100);
        conflicts.push({
          field: COVERAGE_TYPE_LABELS[coverageType],
          conflictType: 'deductible_variance',
          description: `${COVERAGE_TYPE_LABELS[coverageType]} deductible varies ${variance}% (${formatCurrency(minDeductible)} to ${formatCurrency(maxDeductible)})`,
          affectedDocuments: deductibles.map((d) => d.index),
          severity: COVERAGE_SEVERITY[coverageType],
          coverageType,
        });
      }
    }
  }

  // Check for exclusion mismatches
  const exclusionConflicts = detectExclusionMismatches(extractions);
  conflicts.push(...exclusionConflicts);

  // Sort by severity: high → medium → low
  return conflicts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * Detect exclusion mismatches across quotes.
 * AC-7.4.3: Identifies when an exclusion is present in some quotes but not others.
 */
function detectExclusionMismatches(extractions: QuoteExtraction[]): ConflictWarning[] {
  const conflicts: ConflictWarning[] = [];
  const allExclusionCategories = new Set<ExclusionCategory>();

  // Collect all exclusion categories across all quotes
  for (const extraction of extractions) {
    for (const exclusion of extraction.exclusions) {
      allExclusionCategories.add(exclusion.category);
    }
  }

  // Check each category for mismatches
  for (const category of allExclusionCategories) {
    const hasExclusion: number[] = [];
    const noExclusion: number[] = [];

    extractions.forEach((extraction, index) => {
      const has = extraction.exclusions.some((e) => e.category === category);
      if (has) {
        hasExclusion.push(index);
      } else {
        noExclusion.push(index);
      }
    });

    // Mismatch if some have the exclusion and some don't
    if (hasExclusion.length > 0 && noExclusion.length > 0) {
      const categoryLabel = EXCLUSION_CATEGORY_LABELS[category];
      conflicts.push({
        field: `${categoryLabel} Exclusion`,
        conflictType: 'exclusion_mismatch',
        description: `${categoryLabel} excluded in ${hasExclusion.length} quote(s) but not in ${noExclusion.length}`,
        affectedDocuments: [...hasExclusion, ...noExclusion],
        severity: EXCLUSION_SEVERITY[category],
      });
    }
  }

  return conflicts;
}
