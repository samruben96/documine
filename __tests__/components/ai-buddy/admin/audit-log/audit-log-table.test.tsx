/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for AuditLogTable Component
 * Story 20.4: Audit Log Interface
 *
 * Tests:
 * - AC-20.4.1: Table with date/time, user, project, conversation title, message count, guardrail badge
 * - AC-20.4.3: Paginated at 25 per page with total count
 * - Loading, empty, and error states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogTable } from '@/components/ai-buddy/admin/audit-log/audit-log-table';
import type { AuditLogTableEntry } from '@/app/api/ai-buddy/admin/audit-logs/route';

// Mock entry data
const createMockEntry = (overrides: Partial<AuditLogTableEntry> = {}): AuditLogTableEntry => ({
  id: 'entry-1',
  agencyId: 'agency-1',
  userId: 'user-1',
  userName: 'Test User',
  userEmail: 'test@example.com',
  conversationId: 'conv-1',
  conversationTitle: 'Test Conversation',
  projectId: 'proj-1',
  projectName: 'Test Project',
  action: 'conversation_created',
  metadata: {},
  loggedAt: '2024-01-15T10:30:00Z',
  messageCount: 5,
  guardrailEventCount: 0,
  ...overrides,
});

describe('AuditLogTable', () => {
  const defaultProps = {
    entries: [createMockEntry()],
    total: 1,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    isLoading: false,
    error: null,
    onRowClick: vi.fn(),
    onPageChange: vi.fn(),
  };

  describe('Table Columns (AC-20.4.1)', () => {
    it('renders date/time column', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.getByText('Date/Time')).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('renders user column with name and email', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders project column', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('renders conversation title column', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });

    it('renders message count badge', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders guardrail badge when events exist', () => {
      const entry = createMockEntry({ guardrailEventCount: 3 });
      render(<AuditLogTable {...defaultProps} entries={[entry]} />);

      expect(screen.getByTestId('guardrail-badge')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not render guardrail badge when no events', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.queryByTestId('guardrail-badge')).not.toBeInTheDocument();
    });
  });

  describe('Row Click', () => {
    it('calls onRowClick when row is clicked', () => {
      const onRowClick = vi.fn();
      const entry = createMockEntry();
      render(<AuditLogTable {...defaultProps} entries={[entry]} onRowClick={onRowClick} />);

      fireEvent.click(screen.getByTestId(`audit-log-row-${entry.id}`));

      expect(onRowClick).toHaveBeenCalledWith(entry);
    });
  });

  describe('Pagination (AC-20.4.3)', () => {
    const paginatedProps = {
      ...defaultProps,
      entries: Array.from({ length: 25 }, (_, i) => createMockEntry({ id: `entry-${i}` })),
      total: 100,
      page: 2,
      totalPages: 4,
    };

    it('shows pagination controls when total > pageSize', () => {
      render(<AuditLogTable {...paginatedProps} />);

      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
    });

    it('displays correct page info', () => {
      render(<AuditLogTable {...paginatedProps} />);

      expect(screen.getByTestId('pagination-info')).toHaveTextContent('Showing 26 to 50 of 100 entries');
      expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 2 of 4');
    });

    it('disables previous button on first page', () => {
      render(<AuditLogTable {...paginatedProps} page={1} />);

      expect(screen.getByTestId('prev-page-btn')).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<AuditLogTable {...paginatedProps} page={4} />);

      expect(screen.getByTestId('next-page-btn')).toBeDisabled();
    });

    it('calls onPageChange when previous button clicked', () => {
      const onPageChange = vi.fn();
      render(<AuditLogTable {...paginatedProps} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByTestId('prev-page-btn'));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange when next button clicked', () => {
      const onPageChange = vi.fn();
      render(<AuditLogTable {...paginatedProps} onPageChange={onPageChange} />);

      fireEvent.click(screen.getByTestId('next-page-btn'));

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('hides pagination when total <= pageSize', () => {
      render(<AuditLogTable {...defaultProps} />);

      expect(screen.queryByTestId('pagination-controls')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading and no entries', () => {
      render(<AuditLogTable {...defaultProps} entries={[]} isLoading={true} />);

      expect(screen.getByTestId('audit-log-table-loading')).toBeInTheDocument();
    });

    it('shows table with data when loading with existing entries', () => {
      render(<AuditLogTable {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no entries', () => {
      render(<AuditLogTable {...defaultProps} entries={[]} />);

      expect(screen.getByTestId('audit-log-empty')).toBeInTheDocument();
      expect(screen.getByText('No audit log entries')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when error exists', () => {
      render(<AuditLogTable {...defaultProps} error={new Error('Failed to load')} />);

      expect(screen.getByTestId('audit-log-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('shows retry button on error', () => {
      const onRetry = vi.fn();
      render(<AuditLogTable {...defaultProps} error={new Error('Failed')} onRetry={onRetry} />);

      fireEvent.click(screen.getByText('Try Again'));

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Text Truncation', () => {
    it('truncates long conversation title', () => {
      const entry = createMockEntry({
        conversationTitle: 'This is a very long conversation title that should be truncated',
      });
      render(<AuditLogTable {...defaultProps} entries={[entry]} />);

      // The text gets truncated to 30 chars with ellipsis
      expect(screen.getByText(/This is a very long convers\.\.\./)).toBeInTheDocument();
    });

    it('shows dash for null values', () => {
      const entry = createMockEntry({
        conversationTitle: null,
        projectName: null,
      });
      render(<AuditLogTable {...defaultProps} entries={[entry]} />);

      // Should show dashes for null values
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });
});
