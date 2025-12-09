/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - OnboardingStatusTable Component
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.2: Display table with user status
 * AC-18.4.3: Show Name, Email, Status, Date
 * AC-18.4.4: Filter buttons
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingStatusTable } from '@/components/ai-buddy/admin/onboarding-status-table';
import type { OnboardingStatusEntry } from '@/types/ai-buddy';

describe('OnboardingStatusTable', () => {
  const mockUsers: OnboardingStatusEntry[] = [
    {
      userId: 'user-1',
      email: 'alice@example.com',
      fullName: 'Alice Smith',
      onboardingCompleted: true,
      onboardingCompletedAt: '2025-12-08T10:00:00Z',
      onboardingSkipped: false,
    },
    {
      userId: 'user-2',
      email: 'bob@example.com',
      fullName: 'Bob Jones',
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: true,
    },
    {
      userId: 'user-3',
      email: 'carol@example.com',
      fullName: null,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingSkipped: false,
    },
  ];

  const defaultProps = {
    users: mockUsers,
    isLoading: false,
    filterStatus: 'all' as const,
    onFilterChange: vi.fn(),
  };

  it('renders loading skeleton when isLoading is true', () => {
    render(<OnboardingStatusTable {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('onboarding-status-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-status-table')).not.toBeInTheDocument();
  });

  it('renders table with user rows', () => {
    render(<OnboardingStatusTable {...defaultProps} />);

    expect(screen.getByTestId('onboarding-status-table')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-user-3')).toBeInTheDocument();
  });

  it('displays user name, email, and status', () => {
    render(<OnboardingStatusTable {...defaultProps} />);

    // Check names
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('No name set')).toBeInTheDocument(); // Carol has null name

    // Check emails
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByTestId('onboarding-status-badge-completed')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-status-badge-skipped')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-status-badge-not_started')).toBeInTheDocument();
  });

  it('displays completion date for completed users', () => {
    render(<OnboardingStatusTable {...defaultProps} />);

    // Alice has completion date
    expect(screen.getByText('Dec 8, 2025')).toBeInTheDocument();
    // Others show dash
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders filter buttons', () => {
    render(<OnboardingStatusTable {...defaultProps} />);

    expect(screen.getByTestId('filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-completed')).toBeInTheDocument();
    expect(screen.getByTestId('filter-skipped')).toBeInTheDocument();
    expect(screen.getByTestId('filter-not_started')).toBeInTheDocument();
  });

  it('highlights the active filter button', () => {
    render(<OnboardingStatusTable {...defaultProps} filterStatus="completed" />);

    const completedButton = screen.getByTestId('filter-completed');
    const allButton = screen.getByTestId('filter-all');

    // Completed should be 'default' variant (darker), all should be 'outline'
    // We check by looking at the button's styling - 'default' has different bg
    expect(completedButton).not.toHaveClass('border');
    // The "All" button should be outline variant
    expect(allButton.className).toMatch(/border/);
  });

  it('calls onFilterChange when filter button is clicked', () => {
    const onFilterChange = vi.fn();
    render(<OnboardingStatusTable {...defaultProps} onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByTestId('filter-completed'));
    expect(onFilterChange).toHaveBeenCalledWith('completed');

    fireEvent.click(screen.getByTestId('filter-skipped'));
    expect(onFilterChange).toHaveBeenCalledWith('skipped');

    fireEvent.click(screen.getByTestId('filter-not_started'));
    expect(onFilterChange).toHaveBeenCalledWith('not_started');

    fireEvent.click(screen.getByTestId('filter-all'));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  it('renders empty state when users array is empty', () => {
    render(<OnboardingStatusTable {...defaultProps} users={[]} />);

    expect(screen.getByTestId('onboarding-status-empty')).toBeInTheDocument();
    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-status-table')).not.toBeInTheDocument();
  });

  it('shows appropriate empty message when filtered results are empty', () => {
    render(
      <OnboardingStatusTable {...defaultProps} users={[]} filterStatus="completed" />
    );

    expect(screen.getByText(/No users with "Completed" status/)).toBeInTheDocument();
    expect(screen.getByText('Clear filter')).toBeInTheDocument();
  });

  it('calls onFilterChange to clear filter from empty state', () => {
    const onFilterChange = vi.fn();
    render(
      <OnboardingStatusTable
        {...defaultProps}
        users={[]}
        filterStatus="completed"
        onFilterChange={onFilterChange}
      />
    );

    fireEvent.click(screen.getByText('Clear filter'));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  it('has correct table headers', () => {
    render(<OnboardingStatusTable {...defaultProps} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Completion Date')).toBeInTheDocument();
  });

  it('has accessible filter group', () => {
    render(<OnboardingStatusTable {...defaultProps} />);

    const filterGroup = screen.getByRole('group', { name: /filter by onboarding status/i });
    expect(filterGroup).toBeInTheDocument();
  });
});
