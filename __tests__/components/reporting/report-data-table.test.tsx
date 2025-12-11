/**
 * @vitest-environment happy-dom
 *
 * ReportDataTable Component Tests
 * Epic 23: Flexible AI Reports - Story 23.6
 *
 * Tests for the interactive data table component.
 * AC-23.6.1: Data table displays all rows from uploaded file
 * AC-23.6.2: Columns are sortable (click header to toggle)
 * AC-23.6.3: Global filter/search with debounced input
 * AC-23.6.4: Pagination for large datasets
 * AC-23.6.5: Column-specific filters (numeric range, date range, text)
 * AC-23.6.6: "No results found" when filter matches zero rows
 * AC-23.6.7: Proper ARIA labels and keyboard navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportDataTable } from '@/components/reporting/report-data-table';

// Helper to wait for debounce
const waitForDebounce = () => new Promise((resolve) => setTimeout(resolve, 350));

// Sample data for testing
const createSampleData = (rowCount: number = 5) => {
  const columns = ['Name', 'Amount', 'Date', 'Status'];
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    Name: `Item ${i + 1}`,
    Amount: (i + 1) * 100,
    Date: `2024-0${(i % 9) + 1}-15`,
    Status: i % 2 === 0 ? 'Active' : 'Inactive',
  }));
  return { columns, rows };
};

const createLargeDataset = () => {
  const columns = ['ID', 'Product', 'Price', 'Quantity'];
  const rows = Array.from({ length: 150 }, (_, i) => ({
    ID: i + 1,
    Product: `Product ${i + 1}`,
    Price: Math.round(Math.random() * 1000),
    Quantity: Math.floor(Math.random() * 100),
  }));
  return { columns, rows };
};

describe('ReportDataTable Component', () => {
  describe('basic rendering (AC-23.6.1)', () => {
    it('renders table with correct row count', () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} />);

      const dataRows = screen.getAllByTestId('data-row');
      expect(dataRows).toHaveLength(5);
    });

    it('renders column headers from columns array', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} />);

      columns.forEach((col) => {
        expect(screen.getByText(col)).toBeInTheDocument();
      });
    });

    it('renders cell values correctly', () => {
      const { columns, rows } = createSampleData(3);
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('displays row count in header', () => {
      const { columns, rows } = createSampleData(10);
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByText(/10 rows/)).toBeInTheDocument();
    });

    it('handles empty data array', () => {
      render(<ReportDataTable columns={['A', 'B']} rows={[]} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('formats null/undefined values as N/A (AC-23.9.7)', () => {
      const columns = ['Name', 'Value'];
      const rows = [
        { Name: 'Test', Value: null },
        { Name: 'Test2', Value: undefined },
      ];
      render(<ReportDataTable columns={columns} rows={rows} />);

      // AC-23.9.7: null/undefined show "N/A" not "—"
      const naCells = screen.getAllByText('N/A');
      expect(naCells.length).toBeGreaterThanOrEqual(2);
    });

    it('formats numbers with locale formatting', () => {
      const columns = ['Amount'];
      const rows = [{ Amount: 1234567.89 }];
      render(<ReportDataTable columns={columns} rows={rows} />);

      // Number should be formatted with thousand separators
      expect(screen.getByText('1,234,567.89')).toBeInTheDocument();
    });
  });

  describe('column sorting (AC-23.6.2)', () => {
    it('makes column headers clickable when sortable', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable />);

      const nameHeader = screen.getByRole('button', { name: /Sort by Name/ });
      expect(nameHeader).toBeInTheDocument();
    });

    it('toggles sort direction on click', async () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable />);

      const nameHeader = screen.getByRole('button', { name: /Sort by Name/ });

      // First click: ascending
      fireEvent.click(nameHeader);
      await waitFor(() => {
        const th = nameHeader.closest('th');
        expect(th).toHaveAttribute('aria-sort', 'ascending');
      });

      // Second click: descending
      fireEvent.click(nameHeader);
      await waitFor(() => {
        const th = nameHeader.closest('th');
        expect(th).toHaveAttribute('aria-sort', 'descending');
      });
    });

    it('shows sort indicator icons', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable />);

      // Initial state: unsorted icon (ArrowUpDown)
      const nameHeader = screen.getByRole('button', { name: /Sort by Name/ });
      expect(nameHeader.querySelector('svg')).toBeInTheDocument();
    });

    it('supports keyboard navigation for sorting', async () => {
      const user = userEvent.setup();
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable />);

      const nameHeader = screen.getByRole('button', { name: /Sort by Name/ });
      nameHeader.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const th = nameHeader.closest('th');
        expect(th).toHaveAttribute('aria-sort', 'ascending');
      });
    });

    it('does not show sort buttons when sortable=false', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable={false} />);

      const sortButtons = screen.queryAllByRole('button', { name: /Sort by/ });
      expect(sortButtons).toHaveLength(0);
    });
  });

  describe('global search filter (AC-23.6.3)', () => {
    it('renders search input when filterable', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      expect(screen.getByTestId('global-search-input')).toBeInTheDocument();
    });

    it('filters rows based on search input', async () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });

      // Wait for debounce
      await waitForDebounce();

      await waitFor(() => {
        const dataRows = screen.getAllByTestId('data-row');
        expect(dataRows).toHaveLength(1);
      });
    });

    it('shows clear button when search has value', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('clear button resets filter', async () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });
      await waitForDebounce();

      await waitFor(() => {
        expect(screen.getAllByTestId('data-row')).toHaveLength(1);
      });

      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('data-row')).toHaveLength(5);
      });
    });

    it('search is case-insensitive', async () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'ITEM 1' } });
      await waitForDebounce();

      await waitFor(() => {
        expect(screen.getAllByTestId('data-row')).toHaveLength(1);
      });
    });

    it('does not render search when filterable=false', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable={false} />);

      expect(screen.queryByTestId('global-search-input')).not.toBeInTheDocument();
    });
  });

  describe('pagination (AC-23.6.4)', () => {
    it('shows pagination controls when rows > page size', () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByTestId('page-size-select')).toBeInTheDocument();
      expect(screen.getByTestId('next-page-button')).toBeInTheDocument();
    });

    it('does not show pagination for small datasets', () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.queryByTestId('page-size-select')).not.toBeInTheDocument();
    });

    it('shows correct page indicator', () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      // Default 10 per page, 150 rows = 15 pages
      expect(screen.getByText(/Page 1 of 15/)).toBeInTheDocument();
    });

    it('next button navigates to next page', async () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of 15/)).toBeInTheDocument();
      });
    });

    it('previous button navigates to previous page', async () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      // Go to page 2 first
      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2/)).toBeInTheDocument();
      });

      // Go back
      const prevButton = screen.getByTestId('previous-page-button');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 15/)).toBeInTheDocument();
      });
    });

    it('first/last page buttons work', async () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      const lastButton = screen.getByTestId('last-page-button');
      fireEvent.click(lastButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 15 of 15/)).toBeInTheDocument();
      });

      const firstButton = screen.getByTestId('first-page-button');
      fireEvent.click(firstButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 15/)).toBeInTheDocument();
      });
    });

    it('disables previous buttons on first page', () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      const prevButton = screen.getByTestId('previous-page-button');
      const firstButton = screen.getByTestId('first-page-button');

      expect(prevButton).toBeDisabled();
      expect(firstButton).toBeDisabled();
    });

    it('page size selector changes rows per page', async () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      // Initial: 10 rows
      expect(screen.getAllByTestId('data-row')).toHaveLength(10);

      // Change to 25 rows per page
      const pageSizeSelect = screen.getByTestId('page-size-select');
      fireEvent.click(pageSizeSelect);

      const option25 = screen.getByRole('option', { name: '25' });
      fireEvent.click(option25);

      await waitFor(() => {
        expect(screen.getAllByTestId('data-row')).toHaveLength(25);
      });
    });
  });

  describe('no results state (AC-23.6.6)', () => {
    it('displays "No results found" when filter matches zero rows', async () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      await waitForDebounce();

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    it('shows "Clear all filters" button when no results', async () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      await waitForDebounce();

      await waitFor(() => {
        expect(screen.getByTestId('clear-all-filters-button')).toBeInTheDocument();
      });
    });

    it('clear all filters button resets filters', async () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      await waitForDebounce();

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });

      const clearButton = screen.getByTestId('clear-all-filters-button');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getAllByTestId('data-row')).toHaveLength(5);
      });
    });

    it('maintains table structure (headers) even with no data', async () => {
      const { columns, rows } = createSampleData(5);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      await waitForDebounce();

      await waitFor(() => {
        // Headers should still be visible
        columns.forEach((col) => {
          expect(screen.getByText(col)).toBeInTheDocument();
        });
      });
    });
  });

  describe('accessibility (AC-23.6.7)', () => {
    it('table has role="grid" attribute', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('table has aria-label', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} />);

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'Report data table');
    });

    it('sortable headers have aria-sort attribute', async () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable />);

      const nameHeader = screen.getByRole('button', { name: /Sort by Name/ });
      fireEvent.click(nameHeader);

      await waitFor(() => {
        const th = nameHeader.closest('th');
        expect(th).toHaveAttribute('aria-sort');
      });
    });

    it('search input has aria-label', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      expect(searchInput).toHaveAttribute('aria-label', 'Search all columns');
    });

    it('pagination buttons have aria-labels', () => {
      const { columns, rows } = createLargeDataset();
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
    });

    it('focus indicators on interactive elements', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} sortable />);

      const nameHeader = screen.getByRole('button', { name: /Sort by Name/ });
      // Check class includes focus-visible styling
      expect(nameHeader.className).toContain('focus-visible');
    });
  });

  describe('column filters (AC-23.6.5)', () => {
    it('shows filter icons on column headers when filterable', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      // Filter buttons should be present for each column
      columns.forEach((col) => {
        expect(screen.getByLabelText(`Filter ${col}`)).toBeInTheDocument();
      });
    });

    it('does not show filter icons when filterable=false', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} filterable={false} />);

      expect(screen.queryByLabelText(/Filter/)).not.toBeInTheDocument();
    });
  });

  describe('row count display', () => {
    it('shows filtered count when filters active', async () => {
      const { columns, rows } = createSampleData(10);
      render(<ReportDataTable columns={columns} rows={rows} filterable />);

      const searchInput = screen.getByTestId('global-search-input');
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });
      await waitForDebounce();

      await waitFor(() => {
        expect(screen.getByText(/2 of 10 rows/)).toBeInTheDocument();
      });
    });

    it('shows total count when no filters', () => {
      const { columns, rows } = createSampleData(10);
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByText(/10 rows/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles single column', () => {
      const columns = ['Value'];
      const rows = [{ Value: 100 }, { Value: 200 }];
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('handles single row', () => {
      const columns = ['A', 'B', 'C'];
      const rows = [{ A: 1, B: 2, C: 3 }];
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getAllByTestId('data-row')).toHaveLength(1);
    });

    it('handles boolean values', () => {
      const columns = ['Active'];
      const rows = [{ Active: true }, { Active: false }];
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('handles date strings', () => {
      const columns = ['Date'];
      const rows = [{ Date: '2024-01-15' }];
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
  });

  describe('props defaults', () => {
    it('sortable defaults to true', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByRole('button', { name: /Sort by Name/ })).toBeInTheDocument();
    });

    it('filterable defaults to true', () => {
      const { columns, rows } = createSampleData();
      render(<ReportDataTable columns={columns} rows={rows} />);

      expect(screen.getByTestId('global-search-input')).toBeInTheDocument();
    });
  });
});
