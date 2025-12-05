'use client';

/**
 * PolicyMetadataSection - Policy details display
 *
 * Story 10.9: AC-10.9.1
 * Displays policy metadata in the one-pager.
 *
 * @module @/components/one-pager/policy-metadata-section
 */

import { FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/compare/diff';
import {
  formatPolicyType,
  formatAdmittedStatus,
  getPolicyTypeExplanation,
  getAdmittedStatusColorClass,
} from '@/lib/compare/carrier-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { QuoteExtraction } from '@/types/compare';

// ============================================================================
// Props
// ============================================================================

export interface PolicyMetadataSectionProps {
  /** Quote extraction with policy metadata */
  extraction: QuoteExtraction;
  /** Primary color for styling */
  primaryColor: string;
  /** Whether this is in comparison mode (multiple quotes) */
  isComparison?: boolean;
  /** All extractions for comparison mode */
  extractions?: QuoteExtraction[];
}

// ============================================================================
// Sub-components
// ============================================================================

interface InfoRowProps {
  label: string;
  value: string;
  tooltip?: string;
  colorClass?: string;
}

function InfoRow({ label, value, tooltip, colorClass }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-1">
        <p className={cn('font-medium text-slate-900 dark:text-slate-100', colorClass)}>
          {value}
        </p>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Comparison Mode Component
// ============================================================================

interface PolicyMetadataComparisonProps {
  extractions: QuoteExtraction[];
  primaryColor: string;
}

function PolicyMetadataComparison({ extractions, primaryColor }: PolicyMetadataComparisonProps) {
  // Build comparison rows for policy metadata
  const policyTypes = extractions.map((e) => e.policyMetadata?.policyType ?? null);
  const hasPolicyTypeDiff = policyTypes.some((t, i, arr) => t !== arr[0]);

  const admittedStatuses = extractions.map((e) => e.carrierInfo?.admittedStatus ?? null);
  const hasAdmittedDiff = admittedStatuses.some((s, i, arr) => s !== arr[0]);

  const formNumbers = extractions.map((e) => e.policyMetadata?.formNumbers ?? []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">
              Detail
            </th>
            {extractions.map((e, i) => (
              <th key={i} className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">
                {e.carrierName || `Quote ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Policy Type row */}
          <tr className={hasPolicyTypeDiff ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
            <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
              Policy Type
            </td>
            {policyTypes.map((type, i) => (
              <td key={i} className="p-2 text-slate-700 dark:text-slate-300">
                {formatPolicyType(type)}
              </td>
            ))}
          </tr>

          {/* Admitted Status row */}
          <tr className={hasAdmittedDiff ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
            <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
              Carrier Status
            </td>
            {admittedStatuses.map((status, i) => (
              <td key={i} className={cn('p-2', getAdmittedStatusColorClass(status))}>
                {formatAdmittedStatus(status)}
              </td>
            ))}
          </tr>

          {/* ISO Forms row */}
          <tr>
            <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
              ISO Forms
            </td>
            {formNumbers.map((forms, i) => (
              <td key={i} className="p-2 text-slate-700 dark:text-slate-300">
                {forms.length > 0 ? forms.join(', ') : '—'}
              </td>
            ))}
          </tr>

          {/* Retroactive Date row (for claims-made) */}
          {policyTypes.some((t) => t === 'claims-made') && (
            <tr>
              <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
                Retroactive Date
              </td>
              {extractions.map((e, i) => (
                <td key={i} className="p-2 text-slate-700 dark:text-slate-300">
                  {e.policyMetadata?.policyType === 'claims-made' && e.policyMetadata?.retroactiveDate
                    ? formatDate(e.policyMetadata.retroactiveDate)
                    : '—'}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PolicyMetadataSection Component
 * AC-10.9.1: Display policy metadata.
 * - Policy type (Occurrence/Claims-Made) with explanation
 * - ISO form numbers
 * - Retroactive date for claims-made
 * - Admitted status
 * - Comparison mode: table with differences highlighted
 */
export function PolicyMetadataSection({
  extraction,
  primaryColor,
  isComparison = false,
  extractions = [],
}: PolicyMetadataSectionProps) {
  // In comparison mode, render comparison table
  if (isComparison && extractions.length > 1) {
    return (
      <div className="p-6 border-b" data-testid="policy-metadata-section">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: primaryColor }} />
            Policy Details
          </h2>
        </div>
        <PolicyMetadataComparison extractions={extractions} primaryColor={primaryColor} />
      </div>
    );
  }

  // Single quote mode
  const metadata = extraction.policyMetadata;
  const carrierInfo = extraction.carrierInfo;

  // Don't render if no metadata available
  if (!metadata && !carrierInfo) {
    return null;
  }

  const policyTypeExplanation = getPolicyTypeExplanation(metadata?.policyType ?? null);

  return (
    <div className="p-6 border-b" data-testid="policy-metadata-section">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: primaryColor }} />
          Policy Details
        </h2>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Policy Type */}
        {metadata?.policyType && (
          <InfoRow
            label="Policy Type"
            value={formatPolicyType(metadata.policyType)}
            tooltip={policyTypeExplanation}
          />
        )}

        {/* ISO Forms */}
        {metadata?.formNumbers && metadata.formNumbers.length > 0 && (
          <InfoRow
            label="ISO Forms"
            value={metadata.formNumbers.join(', ')}
          />
        )}

        {/* Retroactive Date (claims-made only) */}
        {metadata?.policyType === 'claims-made' && metadata?.retroactiveDate && (
          <InfoRow
            label="Retroactive Date"
            value={formatDate(metadata.retroactiveDate)}
            tooltip="Coverage applies to claims arising from incidents after this date"
          />
        )}

        {/* Admitted Status */}
        {carrierInfo?.admittedStatus && (
          <InfoRow
            label="Carrier Status"
            value={formatAdmittedStatus(carrierInfo.admittedStatus)}
            colorClass={getAdmittedStatusColorClass(carrierInfo.admittedStatus)}
            tooltip={
              carrierInfo.admittedStatus === 'admitted'
                ? 'Covered by state guaranty fund if carrier becomes insolvent'
                : 'Not covered by state guaranty fund - consider carrier financial strength'
            }
          />
        )}

        {/* Audit Type */}
        {metadata?.auditType && metadata.auditType !== 'none' && (
          <InfoRow
            label="Premium Audit"
            value={metadata.auditType.charAt(0).toUpperCase() + metadata.auditType.slice(1)}
          />
        )}

        {/* Extended Reporting Period */}
        {metadata?.extendedReportingPeriod && (
          <InfoRow
            label="Tail Coverage"
            value={metadata.extendedReportingPeriod}
            tooltip="Extended reporting period for claims-made policies"
          />
        )}
      </div>
    </div>
  );
}
