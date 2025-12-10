/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for UserBreakdownTable Component
 * Story 20.3: Usage Analytics Dashboard
 * Story 21.5: Extended for multi-feature per-user tracking
 *
 * Tests:
 * - AC-20.3.2: Per-user breakdown table with columns
 * - AC-21.5.1-21.5.4: Additional columns for comparisons, one-pagers, document chats
 * - Sorting by different columns
 * - Pagination
 * - Loading and empty states
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserBreakdownTable } from '@/components/admin/analytics/user-breakdown-table';
import type { UserUsageStats } from '@/types/ai-buddy';

describe('UserBreakdownTable', () => {
  const mockUsers: UserUsageStats[] = [
    {
      userId: 'user-1',
      userName: 'Alice Smith',
      userEmail: 'alice@example.com',
      conversations: 50,
      messages: 200,
      documents: 10,
      comparisons: 8,
      onePagers: 3,
      documentChats: 12,
      lastActiveAt: '2024-01-15T10:30:00Z',
    },
    {
      userId: 'user-2',
      userName: 'Bob Jones',
      userEmail: 'bob@example.com',
      conversations: 30,
      messages: 150,
      documents: 5,
      comparisons: 4,
      onePagers: 2,
      documentChats: 6,
      lastActiveAt: '2024-01-14T08:00:00Z',
    },
    {
      userId: 'user-3',
      userName: null,
      userEmail: 'unknown@example.com',
      conversations: 10,
      messages: 50,
      documents: 2,
      comparisons: 1,
      onePagers: 0,
      documentChats: 3,
      lastActiveAt: null,
    },
  ];

  describe('Rendering', () => {
    it('renders table with user data and all column headers', () => {
      render(<UserBreakdownTable data={mockUsers} testId="breakdown" />);

      // Check headers exist (abbreviated versions from Story 21.5)
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Chats')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('Compare')).toBeInTheDocument();
      expect(screen.getByText('1-Pagers')).toBeInTheDocument();
      expect(screen.getByText('Doc Chat')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Check all user rows exist
      expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-user-3')).toBeInTheDocument();
    });

    it('displays user names and emails', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shows "Unknown User" for null userName', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
      expect(screen.getByText('unknown@example.com')).toBeInTheDocument();
    });

    it('shows "Never" for null lastActiveAt', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      expect(screen.getByText('Never')).toBeInTheDocument();
    });

    it('shows user count in description', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      expect(screen.getByText(/3 users/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading=true', () => {
      render(<UserBreakdownTable data={[]} isLoading testId="breakdown" />);

      expect(screen.getByTestId('breakdown-loading')).toBeInTheDocument();
      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when data is empty', () => {
      render(<UserBreakdownTable data={[]} testId="breakdown" />);

      expect(screen.getByTestId('breakdown-empty')).toBeInTheDocument();
      expect(screen.getByText(/No user activity data/)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts by conversations descending by default (user-1 first)', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      // Alice (50) should be first
      const rows = screen.getAllByTestId(/user-row-/);
      expect(rows[0]).toHaveAttribute('data-testid', 'user-row-user-1');
    });

    it('toggles sort direction when clicking same column', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      // Click conversations to toggle to ascending
      fireEvent.click(screen.getByTestId('sort-conversations'));

      // Now user-3 (10 conversations) should be first
      const rows = screen.getAllByTestId(/user-row-/);
      expect(rows[0]).toHaveAttribute('data-testid', 'user-row-user-3');
    });

    it('sorts by name when clicking name column', () => {
      render(<UserBreakdownTable data={mockUsers} />);

      fireEvent.click(screen.getByTestId('sort-name'));

      // Descending alphabetical by name (or email if null): 'unknown@...' > 'Bob Jones' > 'Alice Smith'
      const rows = screen.getAllByTestId(/user-row-/);
      // Check first row - 'unknown@example.com' should be first (sorts by email since name is null)
      expect(rows[0]).toHaveAttribute('data-testid', 'user-row-user-3');
    });
  });

  describe('Pagination', () => {
    it('paginates data when pageSize is smaller than data length', () => {
      render(<UserBreakdownTable data={mockUsers} pageSize={2} />);

      // Should show only 2 rows
      const rows = screen.getAllByTestId(/user-row-/);
      expect(rows).toHaveLength(2);

      // Should show pagination
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('navigates to next page when clicking next button', () => {
      render(<UserBreakdownTable data={mockUsers} pageSize={2} />);

      fireEvent.click(screen.getByTestId('next-page'));

      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      // Should show remaining 1 row
      const rows = screen.getAllByTestId(/user-row-/);
      expect(rows).toHaveLength(1);
    });

    it('does not show pagination when all data fits on one page', () => {
      render(<UserBreakdownTable data={mockUsers} pageSize={10} />);

      expect(screen.queryByTestId('prev-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('next-page')).not.toBeInTheDocument();
    });
  });
});
