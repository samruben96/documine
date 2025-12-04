'use client';

/**
 * GapConflictBanner Component
 *
 * Story 7.4: AC-7.4.4, AC-7.4.5, AC-7.4.6
 * Displays summary of gaps and conflicts with click-to-scroll navigation.
 *
 * @module @/components/compare/gap-conflict-banner
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GapWarning, ConflictWarning, Severity } from '@/lib/compare/diff';

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
// Main Component
// ============================================================================

/**
 * GapConflictBanner displays a collapsible summary of gaps and conflicts.
 * AC-7.4.4: Summary banner with collapsible issue list.
 * AC-7.4.5: Click-to-scroll navigation.
 * AC-7.4.6: Sorted by severity (high → medium → low).
 */
export function GapConflictBanner({
  gaps,
  conflicts,
  onItemClick,
  className,
}: GapConflictBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalIssues = gaps.length + conflicts.length;

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
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-gray-900">
              {gaps.length} potential gap{gaps.length !== 1 ? 's' : ''},{' '}
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} identified
            </span>
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
        <CardContent className="pt-0 pb-3 px-4">
          {/* Gaps section */}
          {gaps.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600">
                <Info className="h-3.5 w-3.5" />
                <span>Coverage Gaps</span>
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

          {/* Conflicts section */}
          {conflicts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Conflicts</span>
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
