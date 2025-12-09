/**
 * Unit Tests - GuardrailEnforcementLog Component
 * Story 19.2: Enforcement Logging
 *
 * Tests for the main enforcement log table component
 *
 * AC-19.2.3: Enforcement Log section in Guardrails admin
 * AC-19.2.4: Table with columns: User, Triggered Topic, Message Preview, Date/Time
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuardrailEnforcementLog } from '@/components/ai-buddy/admin/guardrail-enforcement-log';

// Mock the useGuardrailLogs hook
vi.mock('@/hooks/ai-buddy', () => ({
  useGuardrailLogs: vi.fn(),
}));

import { useGuardrailLogs } from '@/hooks/ai-buddy';

const mockUseGuardrailLogs = useGuardrailLogs as ReturnType<typeof vi.fn>;

describe('GuardrailEnforcementLog', () => {
  const mockLoadMore = vi.fn();
  const mockRefetch = vi.fn();

  const mockLogs = [
    {
      id: 'log-1',
      agencyId: 'agency-123',
      userId: 'user-456',
      userEmail: 'test@example.com',
      conversationId: 'conv-789',
      triggeredTopic: 'legal advice',
      messagePreview: 'Can you help me sue my neighbor?',
      redirectApplied: 'Please consult an attorney',
      loggedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'log-2',
      agencyId: 'agency-123',
      userId: 'user-789',
      userEmail: 'other@example.com',
      conversationId: 'conv-012',
      triggeredTopic: 'claims filing',
      messagePreview: 'I want to file a claim...',
      redirectApplied: 'Contact your carrier directly',
      loggedAt: '2024-01-14T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: [],
        isLoading: true,
        error: null,
        totalCount: 0,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      // Should show loading state text
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message and retry button', () => {
      const mockError = new Error('Failed to fetch logs');
      mockUseGuardrailLogs.mockReturnValue({
        logs: [],
        isLoading: false,
        error: mockError,
        totalCount: 0,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByTestId('enforcement-log-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load logs')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch logs')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', () => {
      const mockError = new Error('Failed to fetch logs');
      mockUseGuardrailLogs.mockReturnValue({
        logs: [],
        isLoading: false,
        error: mockError,
        totalCount: 0,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no logs exist', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: [],
        isLoading: false,
        error: null,
        totalCount: 0,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByTestId('enforcement-log-empty')).toBeInTheDocument();
      expect(screen.getByText('No enforcement events')).toBeInTheDocument();
      expect(screen.getByText(/will appear here when triggered/)).toBeInTheDocument();
    });
  });

  describe('table display (AC-19.2.4)', () => {
    it('renders table with correct column headers', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Triggered Topic')).toBeInTheDocument();
      expect(screen.getByText('Message Preview')).toBeInTheDocument();
      expect(screen.getByText('Date/Time')).toBeInTheDocument();
    });

    it('renders log entries in the table', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      // Check first log entry
      expect(screen.getByTestId('log-row-log-1')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('legal advice')).toBeInTheDocument();

      // Check second log entry
      expect(screen.getByTestId('log-row-log-2')).toBeInTheDocument();
      expect(screen.getByText('other@example.com')).toBeInTheDocument();
      expect(screen.getByText('claims filing')).toBeInTheDocument();
    });

    it('displays total count', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByText('2 events found')).toBeInTheDocument();
    });

    it('handles singular event count', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: [mockLogs[0]],
        isLoading: false,
        error: null,
        totalCount: 1,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByText('1 event found')).toBeInTheDocument();
    });
  });

  describe('row click to view details (AC-19.2.5)', () => {
    it('opens detail dialog when row is clicked', async () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      // Click the first row
      fireEvent.click(screen.getByTestId('log-row-log-1'));

      // Detail dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Guardrail Event Details')).toBeInTheDocument();
      });
    });
  });

  describe('pagination', () => {
    it('shows load more button when hasMore is true', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 50,
        hasMore: true,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    });

    it('hides load more button when hasMore is false', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });

    it('calls loadMore when button is clicked', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 50,
        hasMore: true,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      fireEvent.click(screen.getByTestId('load-more-button'));

      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('disables load more button while loading', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: true,
        error: null,
        totalCount: 50,
        hasMore: true,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      const loadMoreBtn = screen.getByTestId('load-more-button');
      expect(loadMoreBtn).toBeDisabled();
    });
  });

  describe('date range filter (AC-19.2.6)', () => {
    it('renders date range filter component', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog />);

      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      mockUseGuardrailLogs.mockReturnValue({
        logs: mockLogs,
        isLoading: false,
        error: null,
        totalCount: 2,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<GuardrailEnforcementLog className="custom-class" />);

      expect(screen.getByTestId('guardrail-enforcement-log')).toHaveClass('custom-class');
    });
  });
});
