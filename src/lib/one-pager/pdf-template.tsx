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
import type { QuoteExtraction } from '@/types/compare';
import type { AgencyBranding } from '@/hooks/use-agency-branding';
import { formatCurrency, formatDate, COVERAGE_TYPE_LABELS } from '@/lib/compare/diff';

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
  });

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

  // Get coverage highlights (top 6 with limits)
  const coverageHighlights =
    primaryExtraction?.coverages
      .filter((c) => c.limit !== null)
      .slice(0, 6)
      .map((c) => ({
        name: COVERAGE_TYPE_LABELS[c.type] || c.name,
        limit: formatCurrency(c.limit),
        deductible: c.deductible ? formatCurrency(c.deductible) : null,
      })) || [];

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
              <Text style={styles.agencySubtitle}>Quote Summary</Text>
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

        {/* Quote Overview */}
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

        {/* Coverage Highlights */}
        {coverageHighlights.length > 0 && (
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

        {/* Exclusions */}
        {primaryExtraction && primaryExtraction.exclusions.length > 0 && (
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
