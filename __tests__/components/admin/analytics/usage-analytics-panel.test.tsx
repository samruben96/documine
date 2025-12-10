/**
 * @vitest-environment happy-dom
 */
/**
 * Tests for UsageAnalyticsPanel Component
 * Story 20.3: Usage Analytics Dashboard
 * Story 21.5: Extended for multi-feature usage tracking
 *
 * Tests:
 * - AC-20.3.1: Summary cards displayed
 * - AC-20.3.7: Permission denied state for non-admins
 * - AC-20.3.8: Empty state for new teams
 * - AC-21.5.1-21.5.6: Multi-feature stat cards
 * - Error and loading states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UsageAnalyticsPanel } from '@/components/admin/analytics/usage-analytics-panel';
import * as useUsageAnalyticsHook from '@/hooks/admin/use-usage-analytics';

// Mock the hook
vi.mock('@/hooks/admin/use-usage-analytics', () => ({
  useUsageAnalytics: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UsageAnalyticsPanel', () => {
  const mockUseUsageAnalytics = useUsageAnalyticsHook.useUsageAnalytics as ReturnType<typeof vi.fn>;

  const defaultHookReturn = {
    summary: {
      totalConversations: 150,
      activeUsers: 12,
      documentsUploaded: 45,
      messagesSent: 890,
      comparisonsCreated: 28,
      onePagersGenerated: 15,
      documentChatSessions: 62,
      comparisonPeriod: {
        conversations: 10.5,
        users: -5.2,
        documents: 20.0,
        messages: 15.3,
        comparisons: 12.0,
        onePagers: 8.5,
        documentChats: 25.0,
      },
    },
    byUser: [
      {
        userId: 'user-1',
        userName: 'Test User',
        userEmail: 'test@example.com',
        conversations: 50,
        messages: 200,
        documents: 10,
        comparisons: 8,
        onePagers: 5,
        documentChats: 12,
        lastActiveAt: '2024-01-15T10:30:00Z',
      },
    ],
    trends: [
      { date: '2024-01-14', activeUsers: 8, conversations: 20, messages: 100, documents: 5, comparisons: 3, onePagers: 2, documentChats: 8 },
      { date: '2024-01-15', activeUsers: 10, conversations: 25, messages: 120, documents: 7, comparisons: 4, onePagers: 3, documentChats: 10 },
    ],
    isLoading: false,
    error: null,
    isEmpty: false,
    dateRange: {
      period: '7d' as const,
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-01-15'),
    },
    setDateRange: vi.fn(),
    refetch: vi.fn(),
    exportCsv: vi.fn(),
  };

  beforeEach(() => {
    mockUseUsageAnalytics.mockReturnValue(defaultHookReturn);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission Handling (AC-20.3.7)', () => {
    it('shows forbidden message when hasPermission is false', () => {
      render(<UsageAnalyticsPanel hasPermission={false} />);

      expect(screen.getByTestId('analytics-panel-forbidden')).toBeInTheDocument();
      expect(screen.getByText(/don't have permission/)).toBeInTheDocument();
    });

    it('shows full dashboard when hasPermission is true', () => {
      render(<UsageAnalyticsPanel hasPermission={true} />);

      expect(screen.getByTestId('analytics-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('analytics-panel-forbidden')).not.toBeInTheDocument();
    });
  });

  describe('Summary Cards (AC-20.3.1)', () => {
    it('renders all four primary summary cards', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('stat-conversations')).toBeInTheDocument();
      expect(screen.getByTestId('stat-users')).toBeInTheDocument();
      expect(screen.getByTestId('stat-documents')).toBeInTheDocument();
      expect(screen.getByTestId('stat-messages')).toBeInTheDocument();
    });

    it('displays correct values in summary cards', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByText('150')).toBeInTheDocument(); // conversations
      // Use getAllByText since '12' may appear multiple times (comparisons percentage is +12%)
      expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1); // active users
      expect(screen.getByText('45')).toBeInTheDocument(); // documents
      expect(screen.getByText('890')).toBeInTheDocument(); // messages
    });

    it('displays trend percentages', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByText('+10.5%')).toBeInTheDocument();
      expect(screen.getByText('-5.2%')).toBeInTheDocument();
      expect(screen.getByText('+20%')).toBeInTheDocument();
      expect(screen.getByText('+15.3%')).toBeInTheDocument();
    });
  });

  describe('Multi-Feature Summary Cards (AC-21.5.1-21.5.4)', () => {
    it('renders feature stat cards for comparisons, one-pagers, and doc chats', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('stat-comparisons')).toBeInTheDocument();
      expect(screen.getByTestId('stat-onepagers')).toBeInTheDocument();
      expect(screen.getByTestId('stat-docchats')).toBeInTheDocument();
    });

    it('displays correct values in feature stat cards', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByText('28')).toBeInTheDocument(); // comparisons
      expect(screen.getByText('15')).toBeInTheDocument(); // one-pagers
      expect(screen.getByText('62')).toBeInTheDocument(); // doc chats
    });

    it('displays trend percentages for feature cards', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByText('+12%')).toBeInTheDocument(); // comparisons
      expect(screen.getByText('+8.5%')).toBeInTheDocument(); // one-pagers
      expect(screen.getByText('+25%')).toBeInTheDocument(); // doc chats
    });
  });

  describe('Loading State', () => {
    it('shows loading state for all components', () => {
      mockUseUsageAnalytics.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<UsageAnalyticsPanel />);

      // Should show loading skeletons (testId includes -loading)
      expect(screen.getByTestId('stat-conversations-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when error occurs', () => {
      mockUseUsageAnalytics.mockReturnValue({
        ...defaultHookReturn,
        error: new Error('Failed to fetch analytics'),
      });

      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('analytics-panel-error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
    });

    it('provides retry button on error', () => {
      const refetch = vi.fn();
      mockUseUsageAnalytics.mockReturnValue({
        ...defaultHookReturn,
        error: new Error('Failed to fetch'),
        refetch,
      });

      render(<UsageAnalyticsPanel />);

      fireEvent.click(screen.getByText('Try again'));
      expect(refetch).toHaveBeenCalled();
    });
  });

  describe('Empty State (AC-20.3.8)', () => {
    it('shows empty state when no data', () => {
      mockUseUsageAnalytics.mockReturnValue({
        ...defaultHookReturn,
        isEmpty: true,
        summary: null,
        byUser: [],
        trends: [],
      });

      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('analytics-panel-empty')).toBeInTheDocument();
      expect(screen.getByText(/No usage data yet/)).toBeInTheDocument();
    });
  });

  describe('Date Range Picker', () => {
    it('renders date range picker', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('analytics-date-range-picker')).toBeInTheDocument();
    });
  });

  describe('CSV Export (AC-20.3.6)', () => {
    it('renders export button', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
    });

    it('calls exportCsv when export button clicked', async () => {
      const exportCsv = vi.fn().mockResolvedValue(undefined);
      mockUseUsageAnalytics.mockReturnValue({
        ...defaultHookReturn,
        exportCsv,
      });

      render(<UsageAnalyticsPanel />);

      fireEvent.click(screen.getByTestId('export-csv-btn'));

      await waitFor(() => {
        expect(exportCsv).toHaveBeenCalled();
      });
    });

    it('disables export button when loading', () => {
      mockUseUsageAnalytics.mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('export-csv-btn')).toBeDisabled();
    });

  });

  describe('User Breakdown Table', () => {
    it('renders user breakdown table', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('user-breakdown-table')).toBeInTheDocument();
    });

    it('displays user data in table', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Trend Chart', () => {
    it('renders trend chart', () => {
      render(<UsageAnalyticsPanel />);

      expect(screen.getByTestId('usage-trend-chart')).toBeInTheDocument();
    });
  });
});
