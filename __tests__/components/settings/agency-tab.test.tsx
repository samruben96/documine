/**
 * @vitest-environment happy-dom
 * Tests for AgencyTab component
 * Tests AC-3.1.1, AC-3.1.3, AC-3.1.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgencyTab } from '@/components/settings/agency-tab';

// Mock the server action
vi.mock('@/app/(dashboard)/settings/actions', () => ({
  updateAgency: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdminUser = {
  id: 'user-123',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
  agency: {
    id: 'agency-1',
    name: 'Test Agency',
    subscription_tier: 'professional',
    seat_limit: 10,
    created_at: '2025-01-15T00:00:00.000Z',
  },
};

const mockMemberUser = {
  id: 'user-456',
  email: 'member@example.com',
  full_name: 'Member User',
  role: 'member',
  agency: {
    id: 'agency-1',
    name: 'Test Agency',
    subscription_tier: 'starter',
    seat_limit: 5,
    created_at: '2025-01-15T00:00:00.000Z',
  },
};

describe('AgencyTab component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-3.1.1: Agency tab displays required fields', () => {
    it('displays agency name for admin user as editable input', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      const nameInput = screen.getByLabelText(/agency name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Agency');
      expect(nameInput.disabled).toBe(false);
    });

    it('displays subscription tier badge', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      expect(screen.getByText('Professional')).toBeInTheDocument();
    });

    it('displays seat limit and current usage', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      expect(screen.getByText('3 of 10 seats used')).toBeInTheDocument();
    });

    it('displays formatted created date', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      // Check that a formatted date is displayed (timezone may vary)
      expect(screen.getByText(/January \d+, 2025/)).toBeInTheDocument();
    });

    it('displays starter tier with correct styling', () => {
      render(<AgencyTab user={mockMemberUser} currentSeats={2} />);

      expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    it('displays agency tier for agency subscription', () => {
      const agencyTierUser = {
        ...mockAdminUser,
        agency: {
          ...mockAdminUser.agency!,
          subscription_tier: 'agency',
        },
      };
      render(<AgencyTab user={agencyTierUser} currentSeats={5} />);

      expect(screen.getByText('Agency')).toBeInTheDocument();
    });
  });

  describe('AC-3.1.4: Non-admin users see view-only mode', () => {
    it('displays agency name as text (not input) for member', () => {
      render(<AgencyTab user={mockMemberUser} currentSeats={2} />);

      // Should not have an input field for agency name
      const nameInput = screen.queryByRole('textbox', { name: /agency name/i });
      expect(nameInput).toBeNull();

      // Should show agency name as text
      expect(screen.getByText('Test Agency')).toBeInTheDocument();
    });

    it('does not show Save Changes button for member', () => {
      render(<AgencyTab user={mockMemberUser} currentSeats={2} />);

      const saveButton = screen.queryByRole('button', { name: /save changes/i });
      expect(saveButton).toBeNull();
    });

    it('still shows all display fields for member', () => {
      render(<AgencyTab user={mockMemberUser} currentSeats={2} />);

      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('2 of 5 seats used')).toBeInTheDocument();
      expect(screen.getByText(/January \d+, 2025/)).toBeInTheDocument();
    });
  });

  describe('AC-3.1.3: Admin user form behavior', () => {
    it('shows Save Changes button for admin', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeInTheDocument();
    });

    it('disables save button when no changes made', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('renders form with all required fields', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      expect(screen.getByLabelText(/agency name/i)).toBeInTheDocument();
      expect(screen.getByText('Subscription Tier')).toBeInTheDocument();
      expect(screen.getByText('Seat Usage')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles null agency gracefully', () => {
      const userWithoutAgency = {
        ...mockAdminUser,
        agency: null,
      };
      render(<AgencyTab user={userWithoutAgency} currentSeats={0} />);

      expect(screen.getByText('No agency associated with this account.')).toBeInTheDocument();
    });

    it('handles unknown subscription tier gracefully', () => {
      const unknownTierUser = {
        ...mockAdminUser,
        agency: {
          ...mockAdminUser.agency!,
          subscription_tier: 'unknown-tier',
        },
      };
      render(<AgencyTab user={unknownTierUser} currentSeats={1} />);

      // Should fall back to Starter display
      expect(screen.getByText('Starter')).toBeInTheDocument();
    });
  });

  describe('Card structure', () => {
    it('renders card with proper title and description', () => {
      render(<AgencyTab user={mockAdminUser} currentSeats={3} />);

      expect(screen.getByText('Agency Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your agency details and subscription')).toBeInTheDocument();
    });
  });
});
