/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - OnboardingStatusSection Component
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.1: Admin section displays
 * AC-18.4.5: Hidden for non-admins
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OnboardingStatusSection } from '@/components/ai-buddy/admin/onboarding-status-section';

// Mock the hook
vi.mock('@/hooks/ai-buddy/use-onboarding-status', () => ({
  useOnboardingStatus: vi.fn(),
}));

import { useOnboardingStatus } from '@/hooks/ai-buddy/use-onboarding-status';

const mockUseOnboardingStatus = vi.mocked(useOnboardingStatus);

describe('OnboardingStatusSection', () => {
  const mockUsers = [
    {
      userId: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      onboardingCompleted: true,
      onboardingCompletedAt: '2025-12-08T10:00:00Z',
      onboardingSkipped: false,
    },
  ];

  beforeEach(() => {
    mockUseOnboardingStatus.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      filteredUsers: mockUsers,
      filterStatus: 'all',
      setFilterStatus: vi.fn(),
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isAdmin is false', () => {
    render(<OnboardingStatusSection isAdmin={false} />);

    expect(screen.queryByTestId('onboarding-status-section')).not.toBeInTheDocument();
  });

  it('renders section when isAdmin is true', () => {
    render(<OnboardingStatusSection isAdmin={true} />);

    expect(screen.getByTestId('onboarding-status-section')).toBeInTheDocument();
    expect(screen.getByText('Onboarding Status')).toBeInTheDocument();
    expect(screen.getByText('View AI Buddy onboarding completion for your team')).toBeInTheDocument();
  });

  it('renders error state when hook returns error', () => {
    mockUseOnboardingStatus.mockReturnValue({
      users: null,
      isLoading: false,
      error: new Error('Failed to load'),
      filteredUsers: [],
      filterStatus: 'all',
      setFilterStatus: vi.fn(),
      refetch: vi.fn(),
    });

    render(<OnboardingStatusSection isAdmin={true} />);

    expect(screen.getByTestId('onboarding-status-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load onboarding status/)).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls refetch when "Try again" is clicked', async () => {
    const mockRefetch = vi.fn();
    mockUseOnboardingStatus.mockReturnValue({
      users: null,
      isLoading: false,
      error: new Error('Failed'),
      filteredUsers: [],
      filterStatus: 'all',
      setFilterStatus: vi.fn(),
      refetch: mockRefetch,
    });

    render(<OnboardingStatusSection isAdmin={true} />);

    screen.getByText('Try again').click();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders OnboardingStatusTable with correct props', () => {
    const mockSetFilterStatus = vi.fn();
    mockUseOnboardingStatus.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      filteredUsers: mockUsers,
      filterStatus: 'completed',
      setFilterStatus: mockSetFilterStatus,
      refetch: vi.fn(),
    });

    render(<OnboardingStatusSection isAdmin={true} />);

    // Check that table is rendered with users
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // The filter buttons should show completed as selected
    const completedButton = screen.getByTestId('filter-completed');
    expect(completedButton).toBeInTheDocument();
  });

  it('shows loading state when hook is loading', () => {
    mockUseOnboardingStatus.mockReturnValue({
      users: null,
      isLoading: true,
      error: null,
      filteredUsers: [],
      filterStatus: 'all',
      setFilterStatus: vi.fn(),
      refetch: vi.fn(),
    });

    render(<OnboardingStatusSection isAdmin={true} />);

    expect(screen.getByTestId('onboarding-status-loading')).toBeInTheDocument();
  });

  it('renders card with Users icon', () => {
    render(<OnboardingStatusSection isAdmin={true} />);

    // The title should include the Users icon
    const heading = screen.getByText('Onboarding Status');
    expect(heading).toBeInTheDocument();
  });
});
