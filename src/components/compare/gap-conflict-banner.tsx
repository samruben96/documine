'use client';

/**
 * GapConflictBanner Component
 *
 * Story 7.4: AC-7.4.4, AC-7.4.5, AC-7.4.6
 * Story 10.7: AC-10.7.6 - Enhanced with endorsement gaps and risk score badge
 * Displays summary of gaps and conflicts with click-to-scroll navigation.
 *
 * @module @/components/compare/gap-conflict-banner
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, AlertCircle, Info, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GapWarning, ConflictWarning, Severity } from '@/lib/compare/diff';
import type { GapAnalysis, LimitConcern, EndorsementGap, GapImportance } from '@/types/compare';
import { getRiskLevel } from '@/lib/compare/gap-analysis';

// ============================================================================
// Types
// ============================================================================

export interface GapConflictBannerProps {
  /** Coverage gaps detected */
  gaps: GapWarning[];
  /** Conflicts detected */
  conflicts: ConflictWarning[];
  /** Click handler for navigating to a row */
  onItemClick: (field: string, coverageType?: string) => void;
  /** Optional class name */
  className?: string;
  /** AC-10.7.6: Full gap analysis result for enhanced display */
  gapAnalysis?: GapAnalysis;
}

// ============================================================================
// Severity Badge Component
// ============================================================================

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

/**
 * Severity indicator badge.
 * AC-7.4.6: Visual distinction for high/medium/low severity.
 */
function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = {
    high: {
      bg: 'bg-red-100 text-red-700 border-red-200',
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'Medium',
    },
    low: {
      bg: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Low',
    },
  };

  const { bg, label } = config[severity];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
        bg,
        className
      )}
      aria-label={`${label} severity`}
    >
      {label}
    </span>
  );
}

// ============================================================================
// Risk Score Badge Component (AC-10.7.6)
// ============================================================================

interface RiskScoreBadgeProps {
  score: number;
  className?: string;
}

/**
 * Risk score indicator badge.
 * AC-10.7.6: Green <30, yellow 30-60, red >60.
 */
function RiskScoreBadge({ score, className }: RiskScoreBadgeProps) {
  const level = getRiskLevel(score);
  const config = {
    low: {
      bg: 'bg-green-100 text-green-700 border-green-200',
      label: 'Low Risk',
    },
    medium: {
      bg: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'Medium Risk',
    },
    high: {
      bg: 'bg-red-100 text-red-700 border-red-200',
      label: 'High Risk',
    },
  };

  const { bg, label } = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
        bg,
        className
      )}
      aria-label={`Risk score: ${score} - ${label}`}
      data-testid="risk-score-badge"
    >
      {score} - {label}
    </span>
  );
}

// ============================================================================
// Importance Badge Component (for endorsements)
// ============================================================================

interface ImportanceBadgeProps {
  importance: GapImportance;
  className?: string;
}

function ImportanceBadge({ importance, className }: ImportanceBadgeProps) {
  const config: Record<GapImportance, { bg: string; label: string }> = {
    critical: {
      bg: 'bg-red-100 text-red-700 border-red-200',
      label: 'Critical',
    },
    recommended: {
      bg: 'bg-amber-100 text-amber-700 border-amber-200',
      label: 'Recommended',
    },
    optional: {
      bg: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Optional',
    },
  };

  const { bg, label } = config[importance];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
        bg,
        className
      )}
      aria-label={`${label} importance`}
    >
      {label}
    </span>
  );
}

// ============================================================================
// Gap Item Component
// ============================================================================

interface GapItemProps {
  gap: GapWarning;
  documentNames: string[];
  onClick: () => void;
}

function GapItem({ gap, documentNames, onClick }: GapItemProps) {
  const missingNames = gap.documentsMissing
    .map((i) => documentNames[i] || `Quote ${i + 1}`)
    .join(', ');

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md',
        'hover:bg-amber-100 transition-colors'
      )}
      aria-label={`View ${gap.field} gap details`}
    >
      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-900">{gap.field}</span>
        <span className="text-gray-500 ml-2">— Missing in {missingNames}</span>
      </div>
      <SeverityBadge severity={gap.severity} />
    </button>
  );
}

// ============================================================================
// Conflict Item Component
// ============================================================================

interface ConflictItemProps {
  conflict: ConflictWarning;
  onClick: () => void;
}

function ConflictItem({ conflict, onClick }: ConflictItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full text-left px-3 py-2 rounded-md',
        'hover:bg-amber-100 transition-colors'
      )}
      aria-label={`View ${conflict.field} conflict details`}
    >
      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-gray-700">{conflict.description}</span>
      </div>
      <SeverityBadge severity={conflict.severity} />
    </button>
  );
}

// ============================================================================
// Endorsement Gap Item Component (AC-10.7.6)
// ============================================================================

interface EndorsementGapItemProps {
  gap: EndorsementGap;
}

function EndorsementGapItem({ gap }: EndorsementGapItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 w-full text-left px-3 py-2 rounded-md',
        'bg-gray-50/50'
      )}
      data-testid="endorsement-gap-item"
    >
      <FileText className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{gap.endorsement}</span>
          {gap.formNumber && (
            <span className="text-gray-500 text-sm">({gap.formNumber})</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{gap.reason}</p>
        {gap.presentIn.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Present in: {gap.presentIn.join(', ')}
          </p>
        )}
      </div>
      <ImportanceBadge importance={gap.importance} />
    </div>
  );
}

// ============================================================================
// Limit Concern Item Component (AC-10.7.6)
// ============================================================================

interface LimitConcernItemProps {
  concern: LimitConcern;
}

function LimitConcernItem({ concern }: LimitConcernItemProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-full text-left px-3 py-2 rounded-md',
        'bg-gray-50/50'
      )}
      data-testid="limit-concern-item"
    >
      <Shield className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{concern.coverage}</span>
          <span className="text-gray-500 text-sm">— {concern.carrierName}</span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">
          Current: {formatCurrency(concern.currentLimit)}
          <span className="mx-1">→</span>
          Recommended: {formatCurrency(concern.recommendedMinimum)}
        </p>
      </div>
      <SeverityBadge severity="medium" />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * GapConflictBanner displays a collapsible summary of gaps and conflicts.
 * AC-7.4.4: Summary banner with collapsible issue list.
 * AC-7.4.5: Click-to-scroll navigation.
 * AC-7.4.6: Sorted by severity (high → medium → low).
 * AC-10.7.6: Enhanced with endorsement gaps, limit concerns, and risk score.
 */
export function GapConflictBanner({
  gaps,
  conflicts,
  onItemClick,
  className,
  gapAnalysis,
}: GapConflictBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Count all issues including gap analysis findings
  const endorsementGapsCount = gapAnalysis?.endorsementGaps.length || 0;
  const limitConcernsCount = gapAnalysis?.limitConcerns.length || 0;
  const totalIssues = gaps.length + conflicts.length + endorsementGapsCount + limitConcernsCount;

  // Don't render if no issues
  if (totalIssues === 0) {
    return null;
  }

  // Build document names for gap display
  // Note: In production, we'd pass actual document names. Using placeholder for now.
  const documentNames: string[] = [];

  const handleGapClick = (gap: GapWarning) => {
    // Use coverage type for more precise row targeting
    onItemClick(gap.field, gap.coverageType);
  };

  const handleConflictClick = (conflict: ConflictWarning) => {
    onItemClick(conflict.field, conflict.coverageType);
  };

  return (
    <Card
      className={cn(
        'border-amber-200 bg-amber-50/50',
        className
      )}
      data-testid="gap-conflict-banner"
    >
      <CardHeader
        className="cursor-pointer py-3 px-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-gray-900">
              {totalIssues} issue{totalIssues !== 1 ? 's' : ''} identified
            </span>
            {/* AC-10.7.6: Risk score badge */}
            {gapAnalysis && gapAnalysis.overallRiskScore > 0 && (
              <RiskScoreBadge score={gapAnalysis.overallRiskScore} />
            )}
          </div>
          <button
            className="p-1 rounded hover:bg-amber-100 transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse issue list' : 'Expand issue list'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-4 space-y-3">
          {/* Coverage Gaps section */}
          {gaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600">
                <Info className="h-3.5 w-3.5" />
                <span>Coverage Gaps ({gaps.length})</span>
              </div>
              <div className="space-y-0.5">
                {gaps.map((gap) => (
                  <GapItem
                    key={`gap-${gap.coverageType}`}
                    gap={gap}
                    documentNames={documentNames}
                    onClick={() => handleGapClick(gap)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Limit Concerns section (AC-10.7.6) */}
          {gapAnalysis && gapAnalysis.limitConcerns.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600">
                <Shield className="h-3.5 w-3.5" />
                <span>Limit Concerns ({gapAnalysis.limitConcerns.length})</span>
              </div>
              <div className="space-y-1">
                {gapAnalysis.limitConcerns.map((concern, index) => (
                  <LimitConcernItem
                    key={`limit-${concern.coverage}-${concern.documentIndex}-${index}`}
                    concern={concern}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Endorsement Gaps section (AC-10.7.6) */}
          {gapAnalysis && gapAnalysis.endorsementGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600">
                <FileText className="h-3.5 w-3.5" />
                <span>Missing Endorsements ({gapAnalysis.endorsementGaps.length})</span>
              </div>
              <div className="space-y-1">
                {gapAnalysis.endorsementGaps.map((gap, index) => (
                  <EndorsementGapItem
                    key={`endorse-${gap.formNumber || gap.endorsement}-${index}`}
                    gap={gap}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conflicts section */}
          {conflicts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Conflicts ({conflicts.length})</span>
              </div>
              <div className="space-y-0.5">
                {conflicts.map((conflict, index) => (
                  <ConflictItem
                    key={`conflict-${conflict.field}-${conflict.conflictType}-${index}`}
                    conflict={conflict}
                    onClick={() => handleConflictClick(conflict)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default GapConflictBanner;
