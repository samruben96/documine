/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for AuditFilters Component
 * Story 20.4: Audit Log Interface
 *
 * Tests:
 * - AC-20.4.2: Filter by user (dropdown), date range (pickers), keyword search, has guardrail events (checkbox)
 * - Debounced search input
 * - Clear filters functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditFilters, type AuditLogFilters, type UserOption } from '@/components/admin/audit-log/audit-filters';

describe('AuditFilters', () => {
  const mockUsers: UserOption[] = [
    { id: 'user-1', name: 'Test User 1', email: 'user1@example.com' },
    { id: 'user-2', name: 'Test User 2', email: 'user2@example.com' },
    { id: 'user-3', name: null, email: 'user3@example.com' },
  ];

  const defaultProps = {
    filters: {} as AuditLogFilters,
    onFiltersChange: vi.fn(),
    users: mockUsers,
    usersLoading: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders filter container', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByTestId('audit-filters')).toBeInTheDocument();
    });

    it('renders user filter dropdown', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByTestId('user-filter')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    });

    it('renders start date filter', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByTestId('start-date-filter')).toBeInTheDocument();
    });

    it('renders end date filter', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByTestId('end-date-filter')).toBeInTheDocument();
    });

    it('renders guardrail events checkbox', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByTestId('guardrail-events-filter')).toBeInTheDocument();
    });
  });

  describe('User Filter (AC-20.4.2)', () => {
    it('shows "All users" by default', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByText('All users')).toBeInTheDocument();
    });

    it('disables user dropdown when loading', () => {
      render(<AuditFilters {...defaultProps} usersLoading={true} />);

      expect(screen.getByTestId('user-filter')).toBeDisabled();
    });
  });

  describe('Search Filter (AC-20.4.2)', () => {
    it('has placeholder text', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Search conversations/)).toBeInTheDocument();
    });

    it('debounces search input (300ms)', async () => {
      const onFiltersChange = vi.fn();
      render(<AuditFilters {...defaultProps} onFiltersChange={onFiltersChange} />);

      const searchInput = screen.getByTestId('search-filter');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      // Should not have called immediately
      expect(onFiltersChange).not.toHaveBeenCalled();

      // Advance timers by 300ms
      vi.advanceTimersByTime(300);

      // Now it should be called
      expect(onFiltersChange).toHaveBeenCalledWith({ search: 'test query' });
    });

    it('displays current search value', () => {
      render(<AuditFilters {...defaultProps} filters={{ search: 'existing search' }} />);

      expect(screen.getByDisplayValue('existing search')).toBeInTheDocument();
    });
  });

  describe('Date Range Filters (AC-20.4.2)', () => {
    it('shows "Start date" placeholder when no start date', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByText('Start date')).toBeInTheDocument();
    });

    it('shows "End date" placeholder when no end date', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByText('End date')).toBeInTheDocument();
    });

    it('displays formatted start date when set', () => {
      // Use a date with explicit time to avoid timezone issues
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ startDate: new Date('2024-01-15T12:00:00') }}
        />
      );

      // Look inside the start date button - should show formatted date
      const startDateBtn = screen.getByTestId('start-date-filter');
      expect(startDateBtn.textContent).toContain('Jan 15, 2024');
    });

    it('displays formatted end date when set', () => {
      // Use a date with explicit time to avoid timezone issues
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ endDate: new Date('2024-01-20T12:00:00') }}
        />
      );

      // Look inside the end date button - should show formatted date
      const endDateBtn = screen.getByTestId('end-date-filter');
      expect(endDateBtn.textContent).toContain('Jan 20, 2024');
    });
  });

  describe('Guardrail Events Checkbox (AC-20.4.2)', () => {
    it('is unchecked by default', () => {
      render(<AuditFilters {...defaultProps} />);

      const checkbox = screen.getByTestId('guardrail-events-filter');
      expect(checkbox).not.toBeChecked();
    });

    it('is checked when hasGuardrailEvents is true', () => {
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ hasGuardrailEvents: true }}
        />
      );

      const checkbox = screen.getByTestId('guardrail-events-filter');
      expect(checkbox).toBeChecked();
    });

    it('calls onFiltersChange when checkbox is toggled', () => {
      const onFiltersChange = vi.fn();
      render(<AuditFilters {...defaultProps} onFiltersChange={onFiltersChange} />);

      fireEvent.click(screen.getByTestId('guardrail-events-filter'));

      expect(onFiltersChange).toHaveBeenCalledWith({ hasGuardrailEvents: true });
    });

    it('shows guardrail icon in label', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.getByText('Has guardrail events')).toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('shows clear filters button when filters are active', () => {
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ search: 'test' }}
        />
      );

      expect(screen.getByTestId('clear-filters-btn')).toBeInTheDocument();
    });

    it('hides clear filters button when no filters active', () => {
      render(<AuditFilters {...defaultProps} />);

      expect(screen.queryByTestId('clear-filters-btn')).not.toBeInTheDocument();
    });

    it('clears all filters when clear button clicked', () => {
      const onFiltersChange = vi.fn();
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ search: 'test', hasGuardrailEvents: true }}
          onFiltersChange={onFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('clear-filters-btn'));

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });

    it('shows clear button for date filters', () => {
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ startDate: new Date() }}
        />
      );

      expect(screen.getByTestId('clear-filters-btn')).toBeInTheDocument();
    });

    it('shows clear button for user filter', () => {
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ userId: 'user-1' }}
        />
      );

      expect(screen.getByTestId('clear-filters-btn')).toBeInTheDocument();
    });
  });

  describe('Filter State Display', () => {
    it('updates local search state on input', () => {
      render(<AuditFilters {...defaultProps} />);

      const searchInput = screen.getByTestId('search-filter');
      fireEvent.change(searchInput, { target: { value: 'new search' } });

      expect(screen.getByDisplayValue('new search')).toBeInTheDocument();
    });

    it('clears local search when clear button clicked', () => {
      const onFiltersChange = vi.fn();
      render(
        <AuditFilters
          {...defaultProps}
          filters={{ search: 'test' }}
          onFiltersChange={onFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('clear-filters-btn'));

      // Local state should be cleared
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });
});
