/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparisonHistory } from '@/components/compare/comparison-history';
import type { ListComparisonResponse } from '@/app/api/compare/route';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/**
 * Tests for ComparisonHistory component
 *
 * Story 7.7: AC-7.7.1 through AC-7.7.8
 */
describe('ComparisonHistory', () => {
  const mockOnNewComparison = vi.fn();

  const mockComparisonResponse: ListComparisonResponse = {
    comparisons: [
      {
        id: 'comp-1',
        createdAt: new Date().toISOString(),
        status: 'complete',
        documentCount: 2,
        documentNames: ['progressive-quote.pdf', 'state-farm.pdf'],
      },
      {
        id: 'comp-2',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'partial',
        documentCount: 3,
        documentNames: ['allstate.pdf', 'geico.pdf', 'liberty.pdf'],
      },
      {
        id: 'comp-3',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'failed',
        documentCount: 2,
        documentNames: ['test1.pdf', 'test2.pdf'],
      },
    ],
    totalCount: 3,
    page: 1,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockComparisonResponse,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-7.7.1: History Table Display', () => {
    it('renders history table with comparison data', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-history')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      // Check comparison data is displayed
      expect(screen.getByText(/progressive-quote.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/allstate.pdf/)).toBeInTheDocument();
    });

    it('displays status badges correctly', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByText('Complete')).toBeInTheDocument();
        expect(screen.getByText('Partial')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });

    it('shows relative dates with tooltip', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        // Relative dates like "less than a minute ago", "1 day ago"
        // Use getAllByText since there are multiple rows with dates
        const datesWithAgo = screen.getAllByText(/ago/i);
        expect(datesWithAgo.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AC-7.7.5: Empty State', () => {
    it('shows empty state when no comparisons exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comparisons: [],
          totalCount: 0,
          page: 1,
          totalPages: 0,
        }),
      });

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-empty-state')).toBeInTheDocument();
        expect(screen.getByText('No comparisons yet')).toBeInTheDocument();
        expect(
          screen.getByText('Compare quotes side-by-side to see coverage differences at a glance.')
        ).toBeInTheDocument();
      });
    });

    it('CTA button triggers new comparison', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comparisons: [],
          totalCount: 0,
          page: 1,
          totalPages: 0,
        }),
      });

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        const ctaButton = screen.getByText('Create Your First Comparison');
        fireEvent.click(ctaButton);
        expect(mockOnNewComparison).toHaveBeenCalled();
      });
    });
  });

  describe('AC-7.7.8: Select All', () => {
    it('selects all visible rows when header checkbox clicked', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-history')).toBeInTheDocument();
      });

      // Find and click the header checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0]; // First checkbox is the header

      fireEvent.click(headerCheckbox);

      // All row checkboxes should be checked
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
      });
    });

    it('deselects all when header checkbox clicked again', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-history')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];

      // Select all
      fireEvent.click(headerCheckbox);
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
      });

      // Deselect all
      fireEvent.click(headerCheckbox);
      await waitFor(() => {
        expect(screen.queryByText('3 selected')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC-7.7.3 & AC-7.7.7: Delete Functionality', () => {
    it('shows confirmation dialog on individual delete', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-history')).toBeInTheDocument();
      });

      // Find and click a delete button
      const deleteButtons = screen.getAllByLabelText('Delete comparison');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Comparison')).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to delete this comparison/)
        ).toBeInTheDocument();
      });
    });

    it('shows bulk delete button when items selected', async () => {
      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-history')).toBeInTheDocument();
      });

      // Select first checkbox (not header)
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First row checkbox

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeInTheDocument();
        expect(screen.getByText('Delete Selected (1)')).toBeInTheDocument();
      });
    });

    it('deletes comparison on confirm', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComparisonResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-history')).toBeInTheDocument();
      });

      // Click delete on first row
      const deleteButtons = screen.getAllByLabelText('Delete comparison');
      fireEvent.click(deleteButtons[0]);

      // Confirm delete
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
      });

      // Check that DELETE was called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/compare/comp-1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading spinner initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      // Should show loading state (Loader2 icon)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows error state on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });
    });
  });

  describe('AC-7.7.6: Pagination', () => {
    it('shows pagination controls when totalPages > 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockComparisonResponse,
          totalCount: 45,
          totalPages: 3,
        }),
      });

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('Previous button is disabled on first page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockComparisonResponse,
          totalCount: 45,
          totalPages: 3,
        }),
      });

      render(<ComparisonHistory onNewComparison={mockOnNewComparison} />);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });
  });
});
