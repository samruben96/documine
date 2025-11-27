/**
 * @vitest-environment happy-dom
 * Tests for ProfileTab component
 * Tests AC-2.6.1, AC-2.6.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileTab } from '@/components/settings/profile-tab';

// Mock the server action
vi.mock('@/app/(dashboard)/settings/actions', () => ({
  updateProfile: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'John Doe',
  role: 'admin',
  agency: {
    id: 'agency-1',
    name: 'Test Agency',
  },
};

describe('ProfileTab component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-2.6.1: Profile display', () => {
    it('displays user full name in editable input', () => {
      render(<ProfileTab user={mockUser} />);

      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('John Doe');
      expect(nameInput.disabled).toBe(false);
    });

    it('displays email as read-only', () => {
      render(<ProfileTab user={mockUser} />);

      const emailInput = screen.getByDisplayValue('test@example.com') as HTMLInputElement;
      expect(emailInput.disabled).toBe(true);
    });

    it('displays agency name as read-only', () => {
      render(<ProfileTab user={mockUser} />);

      const agencyInput = screen.getByDisplayValue('Test Agency') as HTMLInputElement;
      expect(agencyInput.disabled).toBe(true);
    });

    it('displays Admin role as badge', () => {
      render(<ProfileTab user={mockUser} />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('displays Member badge for member role', () => {
      render(<ProfileTab user={{ ...mockUser, role: 'member' }} />);

      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('handles null agency gracefully', () => {
      render(<ProfileTab user={{ ...mockUser, agency: null }} />);

      const agencyInput = screen.getByDisplayValue('No agency') as HTMLInputElement;
      expect(agencyInput).toBeTruthy();
    });

    it('handles null full_name gracefully', () => {
      render(<ProfileTab user={{ ...mockUser, full_name: null }} />);

      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });

  describe('AC-2.6.3: Save button initial state', () => {
    it('disables save button when no changes made', () => {
      render(<ProfileTab user={mockUser} />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('renders save button with correct text', () => {
      render(<ProfileTab user={mockUser} />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Form structure', () => {
    it('renders form with all required fields', () => {
      render(<ProfileTab user={mockUser} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Agency')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('shows email cannot be changed message', () => {
      render(<ProfileTab user={mockUser} />);

      expect(screen.getByText('Email cannot be changed')).toBeInTheDocument();
    });

    it('renders card with proper title and description', () => {
      render(<ProfileTab user={mockUser} />);

      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Update your personal details')).toBeInTheDocument();
    });
  });
});
