/**
 * @vitest-environment happy-dom
 */
/**
 * AI Buddy Preferences Tab Tests
 * Story 18.2: Preferences Management
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
});
