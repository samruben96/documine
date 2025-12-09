/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy Preferences Tab Tests
 * Story 18.2: Preferences Management
 * Story 18.4: Admin Onboarding Status
 *
 * Tests for the Settings page AI Buddy preferences tab.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiBuddyPreferencesTab } from '@/components/settings/ai-buddy-preferences-tab';

// Mock the usePreferences hook
vi.mock('@/hooks/ai-buddy/use-preferences', () => ({
  usePreferences: vi.fn(),
}));

// Mock the OnboardingStatusSection
vi.mock('@/components/ai-buddy/admin/onboarding-status-section', () => ({
  OnboardingStatusSection: vi.fn(({ isAdmin }) =>
    isAdmin ? <div data-testid="onboarding-status-section">Admin Section</div> : null
  ),
}));

// Mock the GuardrailAdminPanel
vi.mock('@/components/ai-buddy/admin/guardrail-admin-panel', () => ({
  GuardrailAdminPanel: vi.fn(({ isAdmin }) =>
    isAdmin ? <div data-testid="guardrail-admin-panel">Guardrails Panel</div> : null
  ),
}));

import { usePreferences } from '@/hooks/ai-buddy/use-preferences';

const mockPreferences = {
  displayName: 'John Doe',
  role: 'producer' as const,
  linesOfBusiness: ['Personal Auto', 'Homeowners'],
  favoriteCarriers: ['Progressive', 'Travelers'],
  licensedStates: ['CA', 'TX'],
  communicationStyle: 'professional' as const,
  onboardingCompleted: true,
};

describe('AiBuddyPreferencesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-18.2.1: AI Buddy Settings Tab
  it('renders loading skeleton when loading', () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: null,
      isLoading: true,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" />);

    expect(screen.getByTestId('preferences-loading')).toBeInTheDocument();
  });

  // AC-18.2.2: Preferences Form Load
  it('renders preferences form when loaded', async () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('preferences-tab')).toBeInTheDocument();
    });

    expect(screen.getByTestId('preferences-form')).toBeInTheDocument();
  });

  it('shows error state with retry option', () => {
    const mockRefetch = vi.fn();
    (usePreferences as Mock).mockReturnValue({
      preferences: null,
      isLoading: false,
      error: new Error('Failed to load'),
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: mockRefetch,
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" />);

    expect(screen.getByTestId('preferences-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
  });

  it('passes agency name to preferences form', async () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="ABC Insurance" />);

    await waitFor(() => {
      expect(screen.getByTestId('agency-name-display')).toHaveValue('ABC Insurance');
    });
  });

  // AC-18.4.1: OnboardingStatusSection renders for admin (in admin sub-tab)
  it('renders OnboardingStatusSection when isAdmin is true and admin tab is active', async () => {
    const user = userEvent.setup();

    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('preferences-tab')).toBeInTheDocument();
    });

    // Admin sub-tab should be visible for admins
    expect(screen.getByTestId('subtab-admin')).toBeInTheDocument();

    // Click on the admin sub-tab to see admin content
    await user.click(screen.getByTestId('subtab-admin'));

    // Now the onboarding status section should be visible
    expect(screen.getByTestId('onboarding-status-section')).toBeInTheDocument();
    expect(screen.getByTestId('guardrail-admin-panel')).toBeInTheDocument();
  });

  // AC-18.4.5: Admin sub-tab hidden for non-admin
  it('does not render admin sub-tab when isAdmin is false', async () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" isAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('preferences-tab')).toBeInTheDocument();
    });

    // Admin sub-tab should not be visible for non-admins
    expect(screen.queryByTestId('subtab-admin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-status-section')).not.toBeInTheDocument();
  });

  // AC-18.4.5: Admin sub-tab hidden by default (isAdmin undefined)
  it('does not render admin sub-tab when isAdmin is not provided', async () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('preferences-tab')).toBeInTheDocument();
    });

    // Admin sub-tab should not be visible by default
    expect(screen.queryByTestId('subtab-admin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-status-section')).not.toBeInTheDocument();
  });

  // New test: Sub-tabs layout
  it('renders sub-tabs navigation with My AI Buddy tab active by default', async () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('ai-buddy-sub-tabs')).toBeInTheDocument();
    });

    // Personal tab should be present
    expect(screen.getByTestId('subtab-personal')).toBeInTheDocument();

    // Personal settings content should be visible by default
    expect(screen.getByTestId('personal-settings-content')).toBeInTheDocument();

    // Admin content should not be visible until tab is clicked
    expect(screen.queryByTestId('admin-settings-content')).not.toBeInTheDocument();
  });

  // New test: Reset personal settings card
  it('shows reset personal settings card with clear messaging', async () => {
    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" />);

    await waitFor(() => {
      expect(screen.getByTestId('reset-personal-card')).toBeInTheDocument();
    });

    // Should have clear messaging about personal settings
    expect(screen.getByText(/These are your personal AI Buddy settings/i)).toBeInTheDocument();
    expect(screen.getByText(/This only affects your account/i)).toBeInTheDocument();
    expect(screen.getByTestId('reset-personal-btn')).toBeInTheDocument();
  });

  // New test: Tab switching
  it('switches between personal and admin tabs', async () => {
    const user = userEvent.setup();

    (usePreferences as Mock).mockReturnValue({
      preferences: mockPreferences,
      isLoading: false,
      error: null,
      updatePreferences: vi.fn(),
      resetPreferences: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AiBuddyPreferencesTab agencyName="Test Agency" isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('preferences-tab')).toBeInTheDocument();
    });

    // Personal content is visible by default
    expect(screen.getByTestId('personal-settings-content')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-settings-content')).not.toBeInTheDocument();

    // Click admin tab
    await user.click(screen.getByTestId('subtab-admin'));

    // Admin content should now be visible
    expect(screen.getByTestId('admin-settings-content')).toBeInTheDocument();
    expect(screen.queryByTestId('personal-settings-content')).not.toBeInTheDocument();

    // Click personal tab
    await user.click(screen.getByTestId('subtab-personal'));

    // Personal content should be visible again
    expect(screen.getByTestId('personal-settings-content')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-settings-content')).not.toBeInTheDocument();
  });
});
