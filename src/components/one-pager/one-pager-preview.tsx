'use client';

import { useMemo } from 'react';
import { FileText, Calendar, DollarSign, Shield, AlertTriangle, Table } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { QuoteExtraction, CoverageType } from '@/types/compare';
import type { AgencyBranding } from '@/hooks/use-agency-branding';
import {
  formatCurrency,
  formatDate,
  COVERAGE_TYPE_LABELS,
  detectGaps,
  type GapWarning,
} from '@/lib/compare/diff';

/**
 * OnePagerPreview Props
 * AC-9.3.7: Live preview of one-pager content.
 */
interface OnePagerPreviewProps {
  /** Client name from form */
  clientName: string;
  /** Agent notes from form */
  agentNotes: string;
  /** Quote extractions to display */
  extractions: QuoteExtraction[];
  /** Agency branding for styling */
  branding: AgencyBranding | null;
  /** Whether preview is updating (debounce in progress) */
  isUpdating?: boolean;
}

/**
 * OnePagerPreview Component
 * Story 9.3: AC-9.3.7 - Live HTML preview matching PDF output.
 * Uses agency branding colors and displays quote summary.
 */
export function OnePagerPreview({
  clientName,
  agentNotes,
  extractions,
  branding,
  isUpdating = false,
}: OnePagerPreviewProps) {
  const primaryColor = branding?.primaryColor || '#2563eb';
  const secondaryColor = branding?.secondaryColor || '#1e40af';

  // Determine if this is a comparison (multiple quotes)
  const isComparison = extractions.length > 1;

  // Generate current date for header
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Get first extraction for primary quote data
  const primaryExtraction = extractions[0];

  // AC-9.4.5: Detect gaps for comparison mode
  const gaps = useMemo(() => {
    return isComparison ? detectGaps(extractions) : [];
  }, [extractions, isComparison]);

  // Carrier headers for comparison table
  const carrierHeaders = useMemo(() => {
    return extractions.map((e, i) => e.carrierName || `Quote ${i + 1}`);
  }, [extractions]);

  // Build comparison rows for table
  const comparisonRows = useMemo(() => {
    if (!isComparison) return [];

    // Collect all coverage types
    const allCoverageTypes = new Set<CoverageType>();
    for (const extraction of extractions) {
      for (const coverage of extraction.coverages) {
        allCoverageTypes.add(coverage.type);
      }
    }

    const orderedTypes: CoverageType[] = [
      'general_liability',
      'property',
      'auto_liability',
      'workers_comp',
      'professional_liability',
      'umbrella',
      'cyber',
      'auto_physical_damage',
      'other',
    ];

    const rows: { label: string; values: (number | null)[]; higherIsBetter: boolean }[] = [];

    // Premium row
    rows.push({
      label: 'Annual Premium',
      values: extractions.map((e) => e.annualPremium),
      higherIsBetter: false,
    });

    // Coverage rows
    for (const coverageType of orderedTypes) {
      if (!allCoverageTypes.has(coverageType)) continue;
      rows.push({
        label: `${COVERAGE_TYPE_LABELS[coverageType]} Limit`,
        values: extractions.map((e) => {
          const coverage = e.coverages.find((c) => c.type === coverageType);
          return coverage?.limit ?? null;
        }),
        higherIsBetter: true,
      });
    }

    return rows;
  }, [extractions, isComparison]);

  // Find best value index
  const findBestIndex = (values: (number | null)[], higherIsBetter: boolean): number | null => {
    const numericValues = values
      .map((v, i) => ({ value: v, index: i }))
      .filter((e): e is { value: number; index: number } => e.value !== null);

    if (numericValues.length < 2) return null;
    if (numericValues.every((e) => e.value === numericValues[0]!.value)) return null;

    let best = numericValues[0]!;
    for (const entry of numericValues) {
      if (higherIsBetter ? entry.value > best.value : entry.value < best.value) {
        best = entry;
      }
    }
    return best.index;
  };

  // Collect key coverage highlights (single-quote mode only)
  const coverageHighlights = useMemo(() => {
    if (isComparison || !primaryExtraction) return [];

    return primaryExtraction.coverages
      .filter((c) => c.limit !== null)
      .slice(0, 6)
      .map((c) => ({
        name: COVERAGE_TYPE_LABELS[c.type] || c.name,
        limit: formatCurrency(c.limit),
        deductible: c.deductible ? formatCurrency(c.deductible) : null,
      }));
  }, [primaryExtraction, isComparison]);

  if (extractions.length === 0) {
    return (
      <Card className="border-dashed h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            Select documents or load a comparison to see the preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-slate-950 rounded-lg shadow-lg border transition-opacity ${
        isUpdating ? 'opacity-75' : 'opacity-100'
      }`}
      style={{ minHeight: '600px' }}
      data-testid="one-pager-preview"
    >
      {/* Header with branding */}
      <div
        className="p-6 rounded-t-lg text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-start justify-between">
          {/* Agency logo and name */}
          <div className="flex items-center gap-4">
            {branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={`${branding.name} logo`}
                className="h-12 w-auto bg-white rounded p-1"
              />
            ) : (
              <div
                className="h-12 w-12 rounded flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: secondaryColor }}
              >
                {branding?.name?.charAt(0) || 'A'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">
                {branding?.name || 'Insurance Agency'}
              </h1>
              <p className="text-sm opacity-90">
                {isComparison ? 'Quote Comparison' : 'Quote Summary'}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="text-right text-sm opacity-90">
            <p>{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Client info section */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Prepared For
          </h2>
        </div>
        <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
          {clientName || 'Client Name'}
        </p>
        {primaryExtraction?.namedInsured && clientName !== primaryExtraction.namedInsured && (
          <p className="text-sm text-slate-500 mt-1">
            Named Insured: {primaryExtraction.namedInsured}
          </p>
        )}
      </div>

      {/* AC-9.4.3: Comparison Table for multi-quote mode */}
      {isComparison && comparisonRows.length > 0 && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Table className="h-4 w-4" style={{ color: primaryColor }} />
              Coverage Comparison
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">
                    Coverage
                  </th>
                  {carrierHeaders.map((header, i) => (
                    <th key={i} className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, rowIndex) => {
                  const bestIndex = findBestIndex(row.values, row.higherIsBetter);
                  return (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/50' : ''}
                    >
                      <td className="p-2 font-medium text-slate-700 dark:text-slate-300">
                        {row.label}
                      </td>
                      {row.values.map((value, colIndex) => (
                        <td
                          key={colIndex}
                          className={`p-2 ${
                            bestIndex === colIndex
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : value === null
                                ? 'text-slate-400 italic'
                                : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {value !== null ? formatCurrency(value) : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AC-9.4.5: Gaps Section for multi-quote mode */}
      {isComparison && gaps.length > 0 && (
        <div className="p-6 border-b">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Coverage Gaps ({gaps.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {gaps.slice(0, 5).map((gap, index) => {
                const missingIn = gap.documentsMissing
                  .map((idx) => carrierHeaders[idx] || `Quote ${idx + 1}`)
                  .join(', ');
                return (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        gap.severity === 'high'
                          ? 'bg-red-500'
                          : gap.severity === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-amber-900 dark:text-amber-100">
                      <span className="font-medium">{gap.field}:</span> Missing in {missingIn}
                    </span>
                  </li>
                );
              })}
              {gaps.length > 5 && (
                <li className="text-sm text-amber-700 dark:text-amber-300 italic pl-4">
                  + {gaps.length - 5} more gaps
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Quote overview - single quote mode only */}
      {!isComparison && (
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Quote Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Carrier */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Carrier</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {primaryExtraction?.carrierName || '—'}
            </p>
          </div>

          {/* Premium */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Annual Premium
            </p>
            <p
              className="font-medium text-lg"
              style={{ color: primaryColor }}
            >
              {formatCurrency(primaryExtraction?.annualPremium ?? null)}
            </p>
          </div>

          {/* Effective Date */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Effective
            </p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {formatDate(primaryExtraction?.effectiveDate ?? null)}
            </p>
          </div>

          {/* Expiration Date */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Expires</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {formatDate(primaryExtraction?.expirationDate ?? null)}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Coverage highlights - single quote mode only (coverageHighlights is empty for comparison) */}
      {coverageHighlights.length > 0 && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: primaryColor }} />
              Coverage Highlights
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {coverageHighlights.map((coverage, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {coverage.name}
                </span>
                <div className="text-right">
                  <span
                    className="font-medium"
                    style={{ color: primaryColor }}
                  >
                    {coverage.limit}
                  </span>
                  {coverage.deductible && (
                    <span className="text-xs text-slate-500 block">
                      Ded: {coverage.deductible}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exclusions warning - single quote mode only */}
      {!isComparison && primaryExtraction && primaryExtraction.exclusions.length > 0 && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Key Exclusions
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {primaryExtraction.exclusions.slice(0, 6).map((exclusion, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              >
                {exclusion.name}
              </Badge>
            ))}
            {primaryExtraction.exclusions.length > 6 && (
              <Badge variant="outline">
                +{primaryExtraction.exclusions.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Agent notes section */}
      {agentNotes && (
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Agent Notes
            </h2>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {agentNotes}
            </p>
          </div>
        </div>
      )}

      {/* Footer with contact info */}
      <div
        className="p-6 text-sm text-white rounded-b-lg"
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="font-medium">{branding?.name || 'Insurance Agency'}</p>
            {branding?.address && (
              <p className="opacity-90 text-xs mt-1">{branding.address}</p>
            )}
          </div>
          <div className="text-right">
            {branding?.phone && <p className="opacity-90">{branding.phone}</p>}
            {branding?.email && <p className="opacity-90">{branding.email}</p>}
            {branding?.website && (
              <p className="opacity-90 text-xs mt-1">{branding.website}</p>
            )}
          </div>
        </div>
        <Separator className="my-4 opacity-30" />
        <p className="text-center text-xs opacity-75">
          Generated by docuMINE • This is a summary only. Please review your full policy for complete terms.
        </p>
      </div>
    </div>
  );
}
