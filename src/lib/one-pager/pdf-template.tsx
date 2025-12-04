/**
 * One-Pager PDF Template
 *
 * Story 9.3: AC-9.3.8 - PDF generation with agency branding.
 * Uses @react-pdf/renderer to create downloadable PDF.
 *
 * @module @/lib/one-pager/pdf-template
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import type { QuoteExtraction, CoverageType } from '@/types/compare';
import type { AgencyBranding } from '@/hooks/use-agency-branding';
import {
  formatCurrency,
  formatDate,
  COVERAGE_TYPE_LABELS,
  detectGaps,
  type GapWarning,
} from '@/lib/compare/diff';

// ============================================================================
// Styles
// ============================================================================

const createStyles = (primaryColor: string, secondaryColor: string) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 10,
      backgroundColor: '#ffffff',
    },
    // Header section
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: primaryColor,
      marginHorizontal: -40,
      marginTop: -40,
      padding: 24,
      marginBottom: 20,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logo: {
      width: 48,
      height: 48,
      backgroundColor: '#ffffff',
      borderRadius: 4,
    },
    logoPlaceholder: {
      width: 48,
      height: 48,
      backgroundColor: secondaryColor,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoPlaceholderText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    agencyName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    agencySubtitle: {
      fontSize: 10,
      color: '#ffffff',
      opacity: 0.9,
    },
    headerDate: {
      fontSize: 10,
      color: '#ffffff',
      opacity: 0.9,
    },
    // Section styles
    section: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    sectionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: primaryColor,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1e293b',
    },
    // Client section
    clientName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1e293b',
    },
    clientSubtext: {
      fontSize: 9,
      color: '#64748b',
      marginTop: 4,
    },
    // Overview grid
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    overviewItem: {
      width: '23%',
    },
    overviewLabel: {
      fontSize: 8,
      color: '#64748b',
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    overviewValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1e293b',
    },
    premiumValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: primaryColor,
    },
    // Coverage grid
    coverageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    coverageItem: {
      width: '48%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: 8,
      borderRadius: 4,
    },
    coverageName: {
      fontSize: 9,
      color: '#475569',
    },
    coverageValues: {
      alignItems: 'flex-end',
    },
    coverageLimit: {
      fontSize: 10,
      fontWeight: 'bold',
      color: primaryColor,
    },
    coverageDeductible: {
      fontSize: 7,
      color: '#64748b',
    },
    // Exclusions
    exclusionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    exclusionBadge: {
      backgroundColor: '#fef3c7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    exclusionText: {
      fontSize: 8,
      color: '#92400e',
    },
    // Notes section
    notesText: {
      fontSize: 10,
      color: '#475569',
      lineHeight: 1.5,
    },
    // Footer
    footer: {
      backgroundColor: secondaryColor,
      marginHorizontal: -40,
      marginBottom: -40,
      marginTop: 'auto',
      padding: 20,
    },
    footerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerAgencyName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    footerAddress: {
      fontSize: 8,
      color: '#ffffff',
      opacity: 0.9,
      marginTop: 4,
    },
    footerContact: {
      alignItems: 'flex-end',
    },
    footerContactText: {
      fontSize: 9,
      color: '#ffffff',
      opacity: 0.9,
    },
    footerDivider: {
      height: 1,
      backgroundColor: '#ffffff',
      opacity: 0.3,
      marginVertical: 12,
    },
    footerDisclaimer: {
      fontSize: 7,
      color: '#ffffff',
      opacity: 0.75,
      textAlign: 'center',
    },
    // AC-9.4.3: Comparison table styles
    comparisonTable: {
      marginTop: 8,
    },
    comparisonHeaderRow: {
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    comparisonRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    comparisonRowAlt: {
      backgroundColor: '#f8fafc',
    },
    comparisonCellHeader: {
      padding: 6,
      flex: 1,
      fontWeight: 'bold',
      fontSize: 8,
      color: '#475569',
    },
    comparisonCellLabel: {
      padding: 6,
      flex: 1.2,
      fontSize: 8,
      color: '#334155',
      fontWeight: 'bold',
    },
    comparisonCell: {
      padding: 6,
      flex: 1,
      fontSize: 8,
      color: '#475569',
    },
    comparisonCellBest: {
      color: '#16a34a',
      fontWeight: 'bold',
    },
    comparisonCellNotFound: {
      color: '#9ca3af',
      fontStyle: 'italic',
    },
    // AC-9.4.5: Gaps section styles
    gapsSection: {
      marginTop: 12,
      padding: 10,
      backgroundColor: '#fffbeb',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#fcd34d',
    },
    gapsSectionTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#92400e',
      marginBottom: 6,
    },
    gapItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    gapBullet: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginRight: 6,
    },
    gapBulletHigh: {
      backgroundColor: '#dc2626',
    },
    gapBulletMedium: {
      backgroundColor: '#f59e0b',
    },
    gapBulletLow: {
      backgroundColor: '#6b7280',
    },
    gapText: {
      fontSize: 8,
      color: '#78350f',
      flex: 1,
    },
  });

// ============================================================================
// Helper Types
// ============================================================================

interface ComparisonRowData {
  label: string;
  values: (string | number | null)[];
  fieldType: 'currency' | 'text' | 'date';
  higherIsBetter?: boolean;
}

// ============================================================================
// AC-9.4.3: Comparison Table Component
// ============================================================================

interface ComparisonTableProps {
  extractions: QuoteExtraction[];
  styles: ReturnType<typeof createStyles>;
  primaryColor: string;
}

/**
 * ComparisonTable Component
 * AC-9.4.3: Shows coverage comparison across all carriers.
 */
function ComparisonTable({ extractions, styles, primaryColor }: ComparisonTableProps) {
  // Build carrier headers
  const headers = extractions.map((e, i) => e.carrierName || `Quote ${i + 1}`);

  // Collect all unique coverage types
  const allCoverageTypes = new Set<CoverageType>();
  for (const extraction of extractions) {
    for (const coverage of extraction.coverages) {
      allCoverageTypes.add(coverage.type);
    }
  }

  // Build comparison rows
  const rows: ComparisonRowData[] = [];

  // Premium row
  rows.push({
    label: 'Annual Premium',
    values: extractions.map((e) => e.annualPremium),
    fieldType: 'currency',
    higherIsBetter: false, // Lower premium is better
  });

  // Coverage rows
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

  for (const coverageType of orderedTypes) {
    if (!allCoverageTypes.has(coverageType)) continue;

    const label = COVERAGE_TYPE_LABELS[coverageType];
    rows.push({
      label: `${label} Limit`,
      values: extractions.map((e) => {
        const coverage = e.coverages.find((c) => c.type === coverageType);
        return coverage?.limit ?? null;
      }),
      fieldType: 'currency',
      higherIsBetter: true, // Higher limit is better
    });
  }

  // Find best value index for each row
  const findBestIndex = (values: (string | number | null)[], higherIsBetter: boolean): number | null => {
    const numericValues = values
      .map((v, i) => ({ value: v, index: i }))
      .filter((e): e is { value: number; index: number } => typeof e.value === 'number');

    if (numericValues.length < 2) return null;

    const firstVal = numericValues[0]!.value;
    if (numericValues.every((e) => e.value === firstVal)) return null;

    let best = numericValues[0]!;
    for (const entry of numericValues) {
      if (higherIsBetter ? entry.value > best.value : entry.value < best.value) {
        best = entry;
      }
    }
    return best.index;
  };

  const formatCellValue = (value: string | number | null, fieldType: string): string => {
    if (value === null || value === undefined) return '—';
    if (fieldType === 'currency') return formatCurrency(value as number);
    if (fieldType === 'date') return formatDate(value as string);
    return String(value);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: primaryColor }]} />
        <Text style={styles.sectionTitle}>Coverage Comparison</Text>
      </View>

      <View style={styles.comparisonTable}>
        {/* Header row */}
        <View style={styles.comparisonHeaderRow}>
          <Text style={styles.comparisonCellLabel}>Coverage</Text>
          {headers.map((header, i) => (
            <Text key={i} style={styles.comparisonCellHeader}>
              {header}
            </Text>
          ))}
        </View>

        {/* Data rows */}
        {rows.map((row, rowIndex) => {
          const bestIndex = row.higherIsBetter !== undefined
            ? findBestIndex(row.values, row.higherIsBetter)
            : null;

          return (
            <View
              key={rowIndex}
              style={[
                styles.comparisonRow,
                rowIndex % 2 === 1 ? styles.comparisonRowAlt : undefined,
              ].filter(Boolean) as typeof styles.comparisonRow[]}
            >
              <Text style={styles.comparisonCellLabel}>{row.label}</Text>
              {row.values.map((value, colIndex) => {
                const displayValue = formatCellValue(value, row.fieldType);
                const isBest = bestIndex === colIndex;
                const isNotFound = value === null;

                return (
                  <Text
                    key={colIndex}
                    style={[
                      styles.comparisonCell,
                      isBest ? styles.comparisonCellBest : undefined,
                      isNotFound ? styles.comparisonCellNotFound : undefined,
                    ].filter(Boolean) as typeof styles.comparisonCell[]}
                  >
                    {displayValue}
                  </Text>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// AC-9.4.5: Gaps Section Component
// ============================================================================

interface GapsSectionProps {
  gaps: GapWarning[];
  headers: string[];
  styles: ReturnType<typeof createStyles>;
}

/**
 * GapsSection Component
 * AC-9.4.5: Displays coverage gaps between quotes.
 */
function GapsSection({ gaps, headers, styles }: GapsSectionProps) {
  if (gaps.length === 0) return null;

  return (
    <View style={styles.gapsSection}>
      <Text style={styles.gapsSectionTitle}>
        ⚠ Coverage Gaps ({gaps.length})
      </Text>
      {gaps.slice(0, 5).map((gap, index) => {
        const missingIn = gap.documentsMissing
          .map((idx) => headers[idx] || `Quote ${idx + 1}`)
          .join(', ');

        const bulletStyle = [
          styles.gapBullet,
          gap.severity === 'high'
            ? styles.gapBulletHigh
            : gap.severity === 'medium'
              ? styles.gapBulletMedium
              : styles.gapBulletLow,
        ];

        return (
          <View key={index} style={styles.gapItem}>
            <View style={bulletStyle as typeof styles.gapBullet[]} />
            <Text style={styles.gapText}>
              {gap.field}: Missing in {missingIn}
            </Text>
          </View>
        );
      })}
      {gaps.length > 5 && (
        <Text style={[styles.gapText, { marginTop: 4, fontStyle: 'italic' }]}>
          + {gaps.length - 5} more gaps
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// PDF Document Component
// ============================================================================

interface OnePagerPDFProps {
  clientName: string;
  agentNotes: string;
  extractions: QuoteExtraction[];
  branding: AgencyBranding | null;
  generatedAt: Date;
}

/**
 * OnePagerPDFDocument Component
 * Generates the PDF content using @react-pdf/renderer.
 */
function OnePagerPDFDocument({
  clientName,
  agentNotes,
  extractions,
  branding,
  generatedAt,
}: OnePagerPDFProps) {
  const primaryColor = branding?.primaryColor || '#2563eb';
  const secondaryColor = branding?.secondaryColor || '#1e40af';
  const styles = createStyles(primaryColor, secondaryColor);

  const primaryExtraction = extractions[0];
  const isComparison = extractions.length > 1;

  // AC-9.4.5: Detect gaps for multi-quote comparisons
  const gaps = isComparison ? detectGaps(extractions) : [];
  const carrierHeaders = extractions.map((e, i) => e.carrierName || `Quote ${i + 1}`);

  // Get coverage highlights for single-quote mode (top 6 with limits)
  const coverageHighlights =
    !isComparison && primaryExtraction?.coverages
      ? primaryExtraction.coverages
          .filter((c) => c.limit !== null)
          .slice(0, 6)
          .map((c) => ({
            name: COVERAGE_TYPE_LABELS[c.type] || c.name,
            limit: formatCurrency(c.limit),
            deductible: c.deductible ? formatCurrency(c.deductible) : null,
          }))
      : [];

  // Format date
  const formattedDate = generatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {branding?.logoUrl ? (
              <Image src={branding.logoUrl} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>
                  {branding?.name?.charAt(0) || 'A'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.agencyName}>
                {branding?.name || 'Insurance Agency'}
              </Text>
              <Text style={styles.agencySubtitle}>
                {isComparison ? 'Quote Comparison' : 'Quote Summary'}
              </Text>
            </View>
          </View>
          <Text style={styles.headerDate}>{formattedDate}</Text>
        </View>

        {/* Client Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Prepared For</Text>
          </View>
          <Text style={styles.clientName}>{clientName || 'Client Name'}</Text>
          {primaryExtraction?.namedInsured &&
            clientName !== primaryExtraction.namedInsured && (
              <Text style={styles.clientSubtext}>
                Named Insured: {primaryExtraction.namedInsured}
              </Text>
            )}
        </View>

        {/* AC-9.4.3: Comparison Table for multi-quote mode */}
        {isComparison && (
          <ComparisonTable
            extractions={extractions}
            styles={styles}
            primaryColor={primaryColor}
          />
        )}

        {/* AC-9.4.5: Gaps Section for multi-quote mode */}
        {isComparison && gaps.length > 0 && (
          <GapsSection
            gaps={gaps}
            headers={carrierHeaders}
            styles={styles}
          />
        )}

        {/* Single-quote mode: Quote Overview */}
        {!isComparison && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Quote Overview</Text>
            </View>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Carrier</Text>
                <Text style={styles.overviewValue}>
                  {primaryExtraction?.carrierName || '—'}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Annual Premium</Text>
                <Text style={styles.premiumValue}>
                  {formatCurrency(primaryExtraction?.annualPremium ?? null)}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Effective</Text>
                <Text style={styles.overviewValue}>
                  {formatDate(primaryExtraction?.effectiveDate ?? null)}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Expires</Text>
                <Text style={styles.overviewValue}>
                  {formatDate(primaryExtraction?.expirationDate ?? null)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Single-quote mode: Coverage Highlights */}
        {!isComparison && coverageHighlights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Coverage Highlights</Text>
            </View>
            <View style={styles.coverageGrid}>
              {coverageHighlights.map((coverage, index) => (
                <View key={index} style={styles.coverageItem}>
                  <Text style={styles.coverageName}>{coverage.name}</Text>
                  <View style={styles.coverageValues}>
                    <Text style={styles.coverageLimit}>{coverage.limit}</Text>
                    {coverage.deductible && (
                      <Text style={styles.coverageDeductible}>
                        Ded: {coverage.deductible}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exclusions - show for single quote or primary quote in comparison */}
        {primaryExtraction && primaryExtraction.exclusions.length > 0 && !isComparison && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.sectionTitle}>Key Exclusions</Text>
            </View>
            <View style={styles.exclusionsRow}>
              {primaryExtraction.exclusions.slice(0, 8).map((exclusion, index) => (
                <View key={index} style={styles.exclusionBadge}>
                  <Text style={styles.exclusionText}>{exclusion.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Agent Notes */}
        {agentNotes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Agent Notes</Text>
            </View>
            <Text style={styles.notesText}>{agentNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerAgencyName}>
                {branding?.name || 'Insurance Agency'}
              </Text>
              {branding?.address && (
                <Text style={styles.footerAddress}>{branding.address}</Text>
              )}
            </View>
            <View style={styles.footerContact}>
              {branding?.phone && (
                <Text style={styles.footerContactText}>{branding.phone}</Text>
              )}
              {branding?.email && (
                <Text style={styles.footerContactText}>{branding.email}</Text>
              )}
              {branding?.website && (
                <Text style={styles.footerContactText}>{branding.website}</Text>
              )}
            </View>
          </View>
          <View style={styles.footerDivider} />
          <Text style={styles.footerDisclaimer}>
            Generated by docuMINE • This is a summary only. Please review your full
            policy for complete terms.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================================
// Export Function
// ============================================================================

/**
 * Generate and download one-pager PDF.
 * AC-9.3.8: Downloads with filename docuMINE-one-pager-YYYY-MM-DD.pdf
 */
export async function downloadOnePagerPdf(
  clientName: string,
  agentNotes: string,
  extractions: QuoteExtraction[],
  branding: AgencyBranding | null
): Promise<void> {
  const generatedAt = new Date();
  const doc = (
    <OnePagerPDFDocument
      clientName={clientName}
      agentNotes={agentNotes}
      extractions={extractions}
      branding={branding}
      generatedAt={generatedAt}
    />
  );

  const blob = await pdf(doc).toBlob();

  // Format date for filename: YYYY-MM-DD
  const dateStr = generatedAt.toISOString().split('T')[0];
  const filename = `docuMINE-one-pager-${dateStr}.pdf`;

  saveAs(blob, filename);
}
