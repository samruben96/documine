/**
 * Gap Analysis Service
 *
 * Story 10.7: AC-10.7.1 through AC-10.7.6
 * Automated gap analysis for insurance quote comparisons.
 *
 * @module @/lib/compare/gap-analysis
 */

import type {
  QuoteExtraction,
  CoverageType,
  GapAnalysis,
  MissingCoverage,
  LimitConcern,
  EndorsementGap,
  GapImportance,
  Endorsement,
} from '@/types/compare';
import {
  MINIMUM_LIMITS,
  CRITICAL_COVERAGES,
  RECOMMENDED_COVERAGES,
  CRITICAL_ENDORSEMENTS,
  COVERAGE_TYPE_DISPLAY,
} from '@/types/compare';

// ============================================================================
// Constants
// ============================================================================

/**
 * Risk score weights for different gap types.
 * AC-10.7.4: Weighted calculation for overall risk score.
 */
const RISK_WEIGHTS = {
  /** Critical missing coverage (GL, Property, Workers' Comp) */
  criticalCoverage: 25,
  /** Medium/recommended missing coverage */
  recommendedCoverage: 10,
  /** Optional missing coverage */
  optionalCoverage: 5,
  /** Inadequate limits */
  limitConcern: 15,
  /** Missing critical endorsement */
  criticalEndorsement: 20,
  /** Missing recommended endorsement */
  recommendedEndorsement: 5,
} as const;

/**
 * Reasons for missing critical coverages.
 * Used to generate descriptive messages.
 */
const COVERAGE_REASONS: Record<CoverageType, string> = {
  general_liability: 'Protects against third-party bodily injury and property damage claims',
  property: 'Covers damage to owned buildings, equipment, and inventory',
  workers_comp: 'Required in most states to cover employee work-related injuries',
  umbrella: 'Provides excess liability coverage above primary policy limits',
  professional_liability: 'Covers errors and omissions in professional services',
  auto_liability: 'Covers accidents involving business-owned vehicles',
  auto_physical_damage: 'Covers damage to business-owned vehicles',
  cyber: 'Protects against data breaches and cyber attacks',
  epli: 'Covers employment-related claims like discrimination or wrongful termination',
  d_and_o: 'Protects directors and officers from personal liability',
  crime: 'Covers losses from employee theft and other criminal acts',
  pollution: 'Covers environmental contamination liability',
  inland_marine: 'Covers mobile equipment and goods in transit',
  builders_risk: 'Covers buildings under construction',
  business_interruption: 'Covers lost income during business disruption',
  product_liability: 'Covers liability for defective products',
  garage_liability: 'Covers auto dealer operations',
  liquor_liability: 'Covers liability from serving alcohol',
  medical_malpractice: 'Covers medical professional negligence',
  fiduciary: 'Covers breaches of fiduciary duty for employee benefit plans',
  other: 'Additional coverage specific to business needs',
};

/**
 * Reasons for critical endorsements.
 */
const ENDORSEMENT_REASONS: Record<string, string> = {
  'CG 20 10': 'Required by most commercial contracts to extend coverage to property owners',
  'CG 20 37': 'Extends additional insured coverage to completed operations - essential for contractors',
  'CG 24 04': 'Waives right to recover damages from additional insureds - commonly required in contracts',
  'CG 20 01': 'Makes your policy primary regardless of other coverage - often a contract requirement',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine importance level for a coverage type.
 * AC-10.7.1: Critical for GL, Property, Workers' Comp.
 */
function getCoverageImportance(coverageType: CoverageType): GapImportance {
  if (CRITICAL_COVERAGES.includes(coverageType)) {
    return 'critical';
  }
  if (RECOMMENDED_COVERAGES.includes(coverageType)) {
    return 'recommended';
  }
  return 'optional';
}

/**
 * Get the display label for a coverage type.
 */
function getCoverageLabel(coverageType: CoverageType): string {
  return COVERAGE_TYPE_DISPLAY[coverageType]?.label || coverageType;
}

/**
 * Get carrier name from extraction or fallback to index.
 */
function getCarrierName(extraction: QuoteExtraction, index: number): string {
  return extraction.carrierName || `Quote ${index + 1}`;
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect missing coverages across quotes.
 * AC-10.7.1: Identify coverages present in some quotes but missing in others.
 *
 * @param extractions - Array of quote extractions
 * @returns Array of missing coverage findings
 */
export function detectMissingCoverages(extractions: QuoteExtraction[]): MissingCoverage[] {
  if (extractions.length < 2) {
    return [];
  }

  const missingCoverages: MissingCoverage[] = [];
  const allCoverageTypes = new Set<CoverageType>();

  // Collect all coverage types across all quotes
  for (const extraction of extractions) {
    for (const coverage of extraction.coverages) {
      allCoverageTypes.add(coverage.type);
    }
  }

  // Check each coverage type for gaps
  for (const coverageType of allCoverageTypes) {
    const presentIn: string[] = [];
    const missingIn: number[] = [];

    extractions.forEach((extraction, index) => {
      const hasCoverage = extraction.coverages.some((c) => c.type === coverageType);
      if (hasCoverage) {
        presentIn.push(getCarrierName(extraction, index));
      } else {
        missingIn.push(index);
      }
    });

    // Gap exists if some have it and some don't
    if (missingIn.length > 0 && presentIn.length > 0) {
      missingCoverages.push({
        coverageType,
        importance: getCoverageImportance(coverageType),
        reason: COVERAGE_REASONS[coverageType] || `${getCoverageLabel(coverageType)} coverage is missing from some quotes`,
        presentIn,
      });
    }
  }

  // Sort by importance: critical → recommended → optional
  const importanceOrder: Record<GapImportance, number> = { critical: 0, recommended: 1, optional: 2 };
  return missingCoverages.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
}

/**
 * Detect limit concerns across quotes.
 * AC-10.7.2: Compare limits against industry minimum thresholds.
 *
 * @param extractions - Array of quote extractions
 * @returns Array of limit concern findings
 */
export function detectLimitConcerns(extractions: QuoteExtraction[]): LimitConcern[] {
  const limitConcerns: LimitConcern[] = [];

  extractions.forEach((extraction, index) => {
    for (const coverage of extraction.coverages) {
      const minimumLimit = MINIMUM_LIMITS[coverage.type];

      // Only check coverages with defined minimums
      if (minimumLimit && coverage.limit !== null && coverage.limit < minimumLimit) {
        limitConcerns.push({
          coverage: getCoverageLabel(coverage.type),
          currentLimit: coverage.limit,
          recommendedMinimum: minimumLimit,
          reason: `${getCoverageLabel(coverage.type)} limit of $${coverage.limit.toLocaleString()} is below the recommended minimum of $${minimumLimit.toLocaleString()}`,
          documentIndex: index,
          carrierName: getCarrierName(extraction, index),
        });
      }
    }
  });

  // Sort by coverage importance (based on minimum limits - higher minimums typically more critical)
  return limitConcerns.sort((a, b) => b.recommendedMinimum - a.recommendedMinimum);
}

/**
 * Detect endorsement gaps across quotes.
 * AC-10.7.3: Compare quotes against CRITICAL_ENDORSEMENTS list.
 *
 * @param extractions - Array of quote extractions
 * @returns Array of endorsement gap findings
 */
export function detectEndorsementGaps(extractions: QuoteExtraction[]): EndorsementGap[] {
  if (extractions.length < 2) {
    return [];
  }

  const endorsementGaps: EndorsementGap[] = [];

  // Check each critical endorsement
  for (const criticalEndorsement of CRITICAL_ENDORSEMENTS) {
    const presentIn: string[] = [];
    const missingIn: number[] = [];

    extractions.forEach((extraction, index) => {
      // Check if this endorsement is present in the extraction
      const hasEndorsement = extraction.endorsements?.some((e: Endorsement) => {
        // Match by form number (normalize spacing)
        const normalizedForm = e.formNumber.replace(/\s+/g, ' ').trim().toUpperCase();
        const criticalForm = criticalEndorsement.formNumber.replace(/\s+/g, ' ').trim().toUpperCase();
        return normalizedForm === criticalForm ||
               normalizedForm.replace(/\s/g, '').includes(criticalForm.replace(/\s/g, ''));
      });

      if (hasEndorsement) {
        presentIn.push(getCarrierName(extraction, index));
      } else {
        missingIn.push(index);
      }
    });

    // Gap exists if some have it and some don't
    if (missingIn.length > 0 && presentIn.length > 0) {
      endorsementGaps.push({
        endorsement: criticalEndorsement.name,
        formNumber: criticalEndorsement.formNumber,
        importance: criticalEndorsement.importance === 'critical' ? 'critical' : 'recommended',
        reason: ENDORSEMENT_REASONS[criticalEndorsement.formNumber] ||
                `${criticalEndorsement.name} is commonly required in commercial contracts`,
        presentIn,
      });
    }
  }

  // Sort by importance: critical → recommended
  const importanceOrder: Record<GapImportance, number> = { critical: 0, recommended: 1, optional: 2 };
  return endorsementGaps.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
}

/**
 * Calculate overall risk score.
 * AC-10.7.4: Weighted sum of all concerns, capped at 100.
 *
 * @param missingCoverages - Array of missing coverage findings
 * @param limitConcerns - Array of limit concern findings
 * @param endorsementGaps - Array of endorsement gap findings
 * @returns Risk score 0-100 (higher = more gaps/risk)
 */
export function calculateRiskScore(
  missingCoverages: MissingCoverage[],
  limitConcerns: LimitConcern[],
  endorsementGaps: EndorsementGap[]
): number {
  let score = 0;

  // Add points for missing coverages based on importance
  for (const mc of missingCoverages) {
    switch (mc.importance) {
      case 'critical':
        score += RISK_WEIGHTS.criticalCoverage;
        break;
      case 'recommended':
        score += RISK_WEIGHTS.recommendedCoverage;
        break;
      case 'optional':
        score += RISK_WEIGHTS.optionalCoverage;
        break;
    }
  }

  // Add points for limit concerns
  score += limitConcerns.length * RISK_WEIGHTS.limitConcern;

  // Add points for endorsement gaps based on importance
  for (const eg of endorsementGaps) {
    switch (eg.importance) {
      case 'critical':
        score += RISK_WEIGHTS.criticalEndorsement;
        break;
      case 'recommended':
        score += RISK_WEIGHTS.recommendedEndorsement;
        break;
      default:
        score += RISK_WEIGHTS.recommendedEndorsement;
        break;
    }
  }

  // Cap at 100
  return Math.min(100, score);
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Perform comprehensive gap analysis on quote extractions.
 * AC-10.7.5: Main entry point for gap analysis.
 *
 * @param extractions - Array of quote extractions to analyze
 * @returns Complete gap analysis result
 */
export function analyzeGaps(extractions: QuoteExtraction[]): GapAnalysis {
  // Detect all types of gaps
  const missingCoverages = detectMissingCoverages(extractions);
  const limitConcerns = detectLimitConcerns(extractions);
  const endorsementGaps = detectEndorsementGaps(extractions);

  // Calculate overall risk score
  const overallRiskScore = calculateRiskScore(missingCoverages, limitConcerns, endorsementGaps);

  return {
    missingCoverages,
    limitConcerns,
    endorsementGaps,
    overallRiskScore,
  };
}

/**
 * Get risk level from score.
 * AC-10.7.6: For UI badge coloring.
 *
 * @param score - Risk score 0-100
 * @returns Risk level for styling
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}
