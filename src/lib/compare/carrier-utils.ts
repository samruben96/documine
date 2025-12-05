/**
 * Carrier Utilities - Helper functions for carrier information display
 *
 * Stories 10.8, 10.9: AC-10.8.3, AC-10.9.2
 * Shared utilities for AM Best ratings and carrier display.
 *
 * @module @/lib/compare/carrier-utils
 */

// ============================================================================
// AM Best Rating Helpers
// ============================================================================

/**
 * AM Best rating description labels.
 * Source: AM Best Rating Guide.
 */
export const AM_BEST_DESCRIPTIONS: Record<string, string> = {
  'A++': 'Superior',
  'A+': 'Superior',
  'A': 'Excellent',
  'A-': 'Excellent',
  'B++': 'Good',
  'B+': 'Good',
  'B': 'Fair',
  'B-': 'Fair',
  'C++': 'Marginal',
  'C+': 'Marginal',
  'C': 'Weak',
  'C-': 'Weak',
  'D': 'Poor',
  'E': 'Under Regulatory Supervision',
  'F': 'In Liquidation',
  'S': 'Rating Suspended',
};

/**
 * Get the description for an AM Best rating.
 * AC-10.9.2: Format as "A+ (Superior)".
 */
export function getRatingDescription(rating: string | null): string {
  if (!rating) return '';
  const normalized = rating.trim().toUpperCase();
  return AM_BEST_DESCRIPTIONS[normalized] || '';
}

/**
 * Get color classes for AM Best rating display.
 * AC-10.8.3, AC-10.9.2: Color coding for ratings.
 * - A++/A+ = green (Superior)
 * - A/A- = blue (Excellent)
 * - B+ and below = amber (warning)
 */
export function getRatingColorClass(rating: string | null): string {
  if (!rating) return 'text-slate-400';
  const normalized = rating.trim().toUpperCase();

  if (normalized === 'A++' || normalized === 'A+') {
    return 'text-green-600 dark:text-green-400';
  }
  if (normalized === 'A' || normalized === 'A-') {
    return 'text-blue-600 dark:text-blue-400';
  }
  // B+, B, B-, C++, C+, C, C-, D, E, F, S
  return 'text-amber-600 dark:text-amber-400';
}

/**
 * Get background color classes for AM Best rating badge.
 */
export function getRatingBgClass(rating: string | null): string {
  if (!rating) return 'bg-slate-100 text-slate-600';
  const normalized = rating.trim().toUpperCase();

  if (normalized === 'A++' || normalized === 'A+') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
  if (normalized === 'A' || normalized === 'A-') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
}

/**
 * Format AM Best rating with description.
 * AC-10.9.2: "A+ (Superior)" format.
 */
export function formatRating(rating: string | null): string {
  if (!rating) return '—';
  const description = getRatingDescription(rating);
  return description ? `${rating} (${description})` : rating;
}

// ============================================================================
// Admitted Status Helpers
// ============================================================================

/**
 * Format admitted status for display.
 */
export function formatAdmittedStatus(status: string | null): string {
  if (!status) return '—';
  switch (status) {
    case 'admitted':
      return 'Admitted';
    case 'non-admitted':
      return 'Non-Admitted';
    case 'surplus':
      return 'Surplus Lines';
    default:
      return status;
  }
}

/**
 * Get color classes for admitted status.
 * Admitted = green, Non-Admitted/Surplus = amber (requires more attention).
 */
export function getAdmittedStatusColorClass(status: string | null): string {
  if (!status) return 'text-slate-400';
  if (status === 'admitted') {
    return 'text-green-600 dark:text-green-400';
  }
  return 'text-amber-600 dark:text-amber-400';
}

// ============================================================================
// Policy Type Helpers
// ============================================================================

/**
 * Format policy type for display.
 */
export function formatPolicyType(policyType: string | null): string {
  if (!policyType) return '—';
  switch (policyType) {
    case 'occurrence':
      return 'Occurrence';
    case 'claims-made':
      return 'Claims-Made';
    default:
      return policyType;
  }
}

/**
 * Get policy type explanation.
 * AC-10.9.1: Display policy type with explanation.
 */
export function getPolicyTypeExplanation(policyType: string | null): string {
  if (!policyType) return '';
  switch (policyType) {
    case 'occurrence':
      return 'Covers claims for incidents occurring during the policy period, regardless of when the claim is filed.';
    case 'claims-made':
      return 'Covers claims filed during the policy period, for incidents after the retroactive date.';
    default:
      return '';
  }
}
