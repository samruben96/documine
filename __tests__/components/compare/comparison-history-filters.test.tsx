/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ComparisonHistoryFilters,
  type HistoryFilters,
} from '@/components/compare/comparison-history-filters';

/**
 * Tests for ComparisonHistoryFilters component
 *
 * Story 7.7: AC-7.7.4
 */
describe('ComparisonHistoryFilters', () => {
  const defaultFilters: HistoryFilters = {
    search: '',
    fromDate: '',
    toDate: '',
    preset: 'all',
  };

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all filter controls', () => {
      render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );

      expect(screen.getByTestId('comparison-history-filters')).toBeInTheDocument();
      expect(screen.getByTestId('comparison-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('from-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('to-date-input')).toBeInTheDocument();
      expect(screen.getByText('All time')).toBeInTheDocument();
    });

    it('displays current filter values', () => {
      const filters: HistoryFilters = {
        search: 'progressive',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        preset: 'custom',
      };

      render(<ComparisonHistoryFilters filters={filters} onFilterChange={mockOnFilterChange} />);

      expect(screen.getByTestId('comparison-search-input')).toHaveValue('progressive');
      expect(screen.getByTestId('from-date-input')).toHaveValue('2024-01-01');
      expect(screen.getByTestId('to-date-input')).toHaveValue('2024-12-31');
    });
  });

  describe('Search Input', () => {
    it('updates search with debounce', async () => {
      // Test with real timers using waitFor
      render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );

      const searchInput = screen.getByTestId('comparison-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should not call immediately (debounced)
      expect(mockOnFilterChange).not.toHaveBeenCalled();

      // Wait for debounce to complete (200ms + buffer)
      await waitFor(
        () => {
          expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'test' })
          );
        },
        { timeout: 500 }
      );
    });

    it('shows clear button when search has value', async () => {
      render(
        <ComparisonHistoryFilters
          filters={{ ...defaultFilters, search: 'test' }}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Need to set local state by typing
      const searchInput = screen.getByTestId('comparison-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears search on clear button click', async () => {
      render(
        <ComparisonHistoryFilters
          filters={{ ...defaultFilters, search: 'test' }}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Set local state
      const searchInput = screen.getByTestId('comparison-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: '' })
      );
    });
  });

  describe('Date Range Inputs', () => {
    it('updates fromDate and sets preset to custom', async () => {
      render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );

      const fromInput = screen.getByTestId('from-date-input');
      fireEvent.change(fromInput, { target: { value: '2024-01-01' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        fromDate: '2024-01-01',
        preset: 'custom',
      });
    });

    it('updates toDate and sets preset to custom', async () => {
      render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );

      const toInput = screen.getByTestId('to-date-input');
      fireEvent.change(toInput, { target: { value: '2024-12-31' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        toDate: '2024-12-31',
        preset: 'custom',
      });
    });
  });

  describe('Preset Dropdown', () => {
    it('shows correct preset label based on filters', () => {
      // Test that preset labels render correctly
      const { rerender } = render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );
      expect(screen.getByText('All time')).toBeInTheDocument();

      rerender(
        <ComparisonHistoryFilters
          filters={{ ...defaultFilters, preset: '7days' }}
          onFilterChange={mockOnFilterChange}
        />
      );
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();

      rerender(
        <ComparisonHistoryFilters
          filters={{ ...defaultFilters, preset: '30days' }}
          onFilterChange={mockOnFilterChange}
        />
      );
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();

      rerender(
        <ComparisonHistoryFilters
          filters={{ ...defaultFilters, preset: 'custom' }}
          onFilterChange={mockOnFilterChange}
        />
      );
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('preset dropdown button is rendered', () => {
      render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );

      // The dropdown trigger shows the preset label
      const presetButton = screen.getByRole('button', { name: /all time/i });
      expect(presetButton).toBeInTheDocument();
    });

    it('date input changes set preset to custom', () => {
      render(
        <ComparisonHistoryFilters filters={defaultFilters} onFilterChange={mockOnFilterChange} />
      );

      // Changing fromDate should set preset to 'custom'
      const fromInput = screen.getByTestId('from-date-input');
      fireEvent.change(fromInput, { target: { value: '2024-01-01' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2024-01-01',
          preset: 'custom',
        })
      );
    });
  });

  describe('Clear All Filters', () => {
    it('shows Clear filters button when any filter is active', () => {
      const filters: HistoryFilters = {
        search: 'test',
        fromDate: '',
        toDate: '',
        preset: 'all',
      };

      render(<ComparisonHistoryFilters filters={filters} onFilterChange={mockOnFilterChange} />);

      // Set local search state
      const searchInput = screen.getByTestId('comparison-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('resets all filters when Clear filters is clicked', async () => {
      const filters: HistoryFilters = {
        search: 'test',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        preset: 'custom',
      };

      render(<ComparisonHistoryFilters filters={filters} onFilterChange={mockOnFilterChange} />);

      // Set local state
      const searchInput = screen.getByTestId('comparison-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByText('Clear filters');
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: '',
        fromDate: '',
        toDate: '',
        preset: 'all',
      });
    });
  });
});
