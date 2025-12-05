/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessingQueueSummary } from '@/components/documents/processing-queue-summary';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock Supabase instance
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      gte: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockQueueData, error: null })),
      })),
    })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
  removeChannel: vi.fn(),
};

// Default mock data
let mockQueueData: { status: string }[] = [];

describe('ProcessingQueueSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueData = [];

    // Reset from mock chain
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: mockQueueData, error: null })),
        })),
      })),
    });

    // Reset channel mock
    mockSupabase.channel.mockReturnValue({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when queue is empty', async () => {
    mockQueueData = [];

    const { container } = render(<ProcessingQueueSummary agencyId="test-agency" />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(container.querySelector('[data-testid="queue-summary"]')).toBeNull();
    });
  });

  it('renders nothing when only completed jobs exist', async () => {
    mockQueueData = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'completed' },
    ];

    const { container } = render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="queue-summary"]')).toBeNull();
    });
  });

  it('renders summary when pending jobs exist', async () => {
    mockQueueData = [
      { status: 'pending' },
      { status: 'pending' },
      { status: 'processing' },
    ];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    expect(screen.getByTestId('queue-pending-count')).toHaveTextContent('2');
    expect(screen.getByTestId('queue-processing-count')).toHaveTextContent('1');
  });

  it('renders summary when failed jobs exist', async () => {
    mockQueueData = [
      { status: 'completed' },
      { status: 'failed' },
    ];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    expect(screen.getByTestId('queue-failed-count')).toHaveTextContent('1');
  });

  it('expands to show details on click', async () => {
    mockQueueData = [
      { status: 'pending' },
      { status: 'processing' },
      { status: 'completed' },
      { status: 'failed' },
    ];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    // Should not show details initially
    expect(screen.queryByTestId('queue-details')).not.toBeInTheDocument();

    // Click to expand
    const button = screen.getByRole('button', { name: /processing queue/i });
    fireEvent.click(button);

    // Should now show details
    expect(screen.getByTestId('queue-details')).toBeInTheDocument();
  });

  it('collapses on second click', async () => {
    mockQueueData = [
      { status: 'pending' },
    ];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');

    // First click - expand
    fireEvent.click(button);
    expect(screen.getByTestId('queue-details')).toBeInTheDocument();

    // Second click - collapse
    fireEvent.click(button);
    expect(screen.queryByTestId('queue-details')).not.toBeInTheDocument();
  });

  it('shows estimated wait time for pending jobs when expanded', async () => {
    mockQueueData = [
      { status: 'pending' },
      { status: 'pending' },
      { status: 'pending' },
    ];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    // Expand details
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show estimated time (3 pending * 2 min = 6 min)
    expect(screen.getByTestId('estimated-wait')).toHaveTextContent('~6 min');
    expect(screen.getByTestId('estimated-wait')).toHaveTextContent('3 documents');
  });

  it('sets up realtime subscription', async () => {
    mockQueueData = [{ status: 'pending' }];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('queue-summary');
    });
  });

  it('handles all status types in breakdown', async () => {
    mockQueueData = [
      { status: 'pending' },
      { status: 'pending' },
      { status: 'processing' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'failed' },
    ];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    // Check header counts
    expect(screen.getByTestId('queue-pending-count')).toHaveTextContent('2');
    expect(screen.getByTestId('queue-processing-count')).toHaveTextContent('1');
    expect(screen.getByTestId('queue-failed-count')).toHaveTextContent('1');

    // Expand and check details
    fireEvent.click(screen.getByRole('button'));
    const details = screen.getByTestId('queue-details');
    expect(details).toHaveTextContent('Waiting:');
    expect(details).toHaveTextContent('Processing:');
    expect(details).toHaveTextContent('Completed (24h):');
    expect(details).toHaveTextContent('Failed:');
  });

  it('applies custom className', async () => {
    mockQueueData = [{ status: 'pending' }];

    render(<ProcessingQueueSummary agencyId="test-agency" className="custom-class" />);

    await waitFor(() => {
      const summary = screen.getByTestId('queue-summary');
      expect(summary).toHaveClass('custom-class');
    });
  });

  it('handles fetch error gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB error') })),
        })),
      })),
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch queue summary:', expect.any(Error));
    });

    // Should render nothing on error
    expect(container.querySelector('[data-testid="queue-summary"]')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('uses singular form for 1 document', async () => {
    mockQueueData = [{ status: 'pending' }];

    render(<ProcessingQueueSummary agencyId="test-agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('estimated-wait')).toHaveTextContent('1 document');
    expect(screen.getByTestId('estimated-wait')).not.toHaveTextContent('documents');
  });
});
