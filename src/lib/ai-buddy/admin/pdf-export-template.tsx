/**
 * PDF Export Template for Audit Logs
 * Story 20.4: Audit Log Interface
 *
 * React-PDF document template for audit log exports.
 * AC-20.4.8: PDF includes agency header, export date, compliance statement, entries, optional transcripts
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

/**
 * PDF Styles
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 15,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  exportInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  compliance: {
    backgroundColor: '#fef3c7',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  complianceText: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 15,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  filterText: {
    fontSize: 9,
    color: '#4b5563',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #f3f4f6',
    padding: 8,
    fontSize: 9,
  },
  tableRowAlternate: {
    backgroundColor: '#fafafa',
  },
  colTimestamp: {
    width: '18%',
  },
  colUser: {
    width: '22%',
  },
  colAction: {
    width: '15%',
  },
  colConversation: {
    width: '20%',
  },
  colDetails: {
    width: '25%',
  },
  transcriptSection: {
    marginTop: 20,
    pageBreakBefore: 'always',
  },
  transcriptTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  transcriptConversation: {
    marginBottom: 15,
  },
  transcriptHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#374151',
  },
  message: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  messageUser: {
    backgroundColor: '#eff6ff',
  },
  messageRole: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 2,
  },
  messageContent: {
    fontSize: 9,
    color: '#1f2937',
    lineHeight: 1.4,
  },
  messageTime: {
    fontSize: 7,
    color: '#9ca3af',
    marginTop: 4,
  },
  guardrailHighlight: {
    backgroundColor: '#fef3c7',
    padding: 5,
    marginTop: 4,
    borderRadius: 2,
  },
  guardrailText: {
    fontSize: 8,
    color: '#92400e',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9ca3af',
  },
  watermark: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 40,
    color: '#d1d5db',
  },
  emptyState: {
    padding: 20,
    textAlign: 'center',
    color: '#6b7280',
  },
});

/**
 * PDF Export data structure
 */
export interface AuditLogPdfData {
  agency: {
    name: string;
    logo?: string;
  };
  exportDate: string;
  exportedBy: string;
  filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    hasGuardrailEvents?: boolean;
  };
  entries: Array<{
    id: string;
    timestamp: string;
    userEmail: string;
    userName: string | null;
    action: string;
    conversationId: string | null;
    metadata: Record<string, unknown>;
  }>;
  transcripts: Array<{
    conversationId: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      created_at: string;
    }>;
  }> | null;
  complianceStatement: string;
}

/**
 * Format timestamp for PDF display
 */
function formatPdfTimestamp(isoString: string): string {
  try {
    return format(new Date(isoString), 'MMM d, yyyy HH:mm');
  } catch {
    return isoString;
  }
}

/**
 * Truncate text for table display
 */
function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format filters for display
 */
function formatFilters(filters: AuditLogPdfData['filters']): string {
  const parts: string[] = [];

  if (filters.userId) {
    parts.push(`User: ${filters.userId}`);
  }
  if (filters.startDate) {
    parts.push(`From: ${formatPdfTimestamp(filters.startDate)}`);
  }
  if (filters.endDate) {
    parts.push(`To: ${formatPdfTimestamp(filters.endDate)}`);
  }
  if (filters.search) {
    parts.push(`Search: "${filters.search}"`);
  }
  if (filters.hasGuardrailEvents) {
    parts.push('Has guardrail events only');
  }

  return parts.length > 0 ? parts.join(' | ') : 'No filters applied';
}

/**
 * Audit Log PDF Document component
 * AC-20.4.8: Agency header, export date, compliance statement, entries, optional transcripts
 */
export function AuditLogPdfDocument({ data }: { data: AuditLogPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header (AC-20.4.8) */}
        <View style={styles.header}>
          <Text style={styles.agencyName}>{data.agency.name}</Text>
          <Text style={styles.title}>AI Buddy Audit Log Report</Text>
          <Text style={styles.exportInfo}>
            Exported: {formatPdfTimestamp(data.exportDate)}
          </Text>
          <Text style={styles.exportInfo}>
            Total entries: {data.entries.length}
          </Text>
        </View>

        {/* Compliance Statement (AC-20.4.8) */}
        <View style={styles.compliance}>
          <Text style={styles.complianceText}>{data.complianceStatement}</Text>
        </View>

        {/* Filter Summary */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filter Criteria:</Text>
          <Text style={styles.filterText}>{formatFilters(data.filters)}</Text>
        </View>

        {/* Entries Table (AC-20.4.8) */}
        {data.entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text>No audit log entries found for the specified filters.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.colTimestamp}>Timestamp</Text>
              <Text style={styles.colUser}>User</Text>
              <Text style={styles.colAction}>Action</Text>
              <Text style={styles.colConversation}>Conversation</Text>
              <Text style={styles.colDetails}>Details</Text>
            </View>

            {/* Table Rows */}
            {data.entries.map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlternate : {},
                ]}
              >
                <Text style={styles.colTimestamp}>
                  {formatPdfTimestamp(entry.timestamp)}
                </Text>
                <Text style={styles.colUser}>
                  {truncate(entry.userName || entry.userEmail, 25)}
                </Text>
                <Text style={styles.colAction}>{entry.action}</Text>
                <Text style={styles.colConversation}>
                  {truncate(entry.conversationId, 15)}
                </Text>
                <Text style={styles.colDetails}>
                  {truncate(JSON.stringify(entry.metadata), 30)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Page number and watermark */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
        <Text style={styles.watermark} fixed>
          docuMINE AI Buddy
        </Text>
      </Page>

      {/* Transcripts Section (AC-20.4.8: Optional full transcripts) */}
      {data.transcripts && data.transcripts.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.transcriptSection}>
            <Text style={styles.transcriptTitle}>Full Conversation Transcripts</Text>

            {data.transcripts.map((transcript) => (
              <View key={transcript.conversationId} style={styles.transcriptConversation}>
                <Text style={styles.transcriptHeader}>
                  Conversation: {transcript.conversationId}
                </Text>

                {transcript.messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.message,
                      message.role === 'user' ? styles.messageUser : {},
                    ]}
                  >
                    <Text style={styles.messageRole}>
                      {message.role.toUpperCase()}
                    </Text>
                    <Text style={styles.messageContent}>
                      {truncate(message.content, 500)}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatPdfTimestamp(message.created_at)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Page number and watermark */}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
          <Text style={styles.watermark} fixed>
            docuMINE AI Buddy
          </Text>
        </Page>
      )}
    </Document>
  );
}
