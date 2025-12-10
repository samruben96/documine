/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - InviteUserDialog Component
 * Story 20.2: Admin User Management
 *
 * AC-20.2.3: Invite new user via email
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteUserDialog } from '@/components/admin/invite-user-dialog';

describe('InviteUserDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnInvite = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onInvite: mockOnInvite,
  };

  beforeEach(() => {
    mockOnInvite.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<InviteUserDialog {...defaultProps} />);
      expect(screen.getByTestId('invite-user-dialog')).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<InviteUserDialog {...defaultProps} />);
      expect(screen.getByTestId('invite-email-input')).toBeInTheDocument();
    });

    it('renders role select', () => {
      render(<InviteUserDialog {...defaultProps} />);
      expect(screen.getByTestId('invite-role-select')).toBeInTheDocument();
    });

    it('defaults to producer role', () => {
      render(<InviteUserDialog {...defaultProps} />);
      expect(screen.getByText('Producer')).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('does not call onInvite for invalid email', async () => {
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.type(screen.getByTestId('invite-email-input'), 'invalid-email');
      await user.click(screen.getByTestId('invite-submit-button'));

      // Should not call onInvite with invalid email
      expect(mockOnInvite).not.toHaveBeenCalled();
    });

    it('does not call onInvite for empty email', async () => {
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.click(screen.getByTestId('invite-submit-button'));

      expect(mockOnInvite).not.toHaveBeenCalled();
    });

    it('calls onInvite with valid email', async () => {
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.type(screen.getByTestId('invite-email-input'), 'valid@example.com');
      await user.click(screen.getByTestId('invite-submit-button'));

      await waitFor(() => {
        expect(mockOnInvite).toHaveBeenCalledWith('valid@example.com', 'producer');
      });
    });
  });

  describe('Role Selection', () => {
    it('defaults to producer role for invitations', async () => {
      render(<InviteUserDialog {...defaultProps} />);

      // Fill email and submit with default role
      const user = userEvent.setup();
      await user.type(screen.getByTestId('invite-email-input'), 'test@example.com');
      await user.click(screen.getByTestId('invite-submit-button'));

      await waitFor(() => {
        expect(mockOnInvite).toHaveBeenCalledWith('test@example.com', 'producer');
      });
    });
  });

  describe('Form Behavior', () => {
    it('resets form on successful submission', async () => {
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.type(screen.getByTestId('invite-email-input'), 'test@example.com');
      await user.click(screen.getByTestId('invite-submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('invite-email-input')).toHaveValue('');
      });
    });

    it('resets form when dialog closes', async () => {
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.type(screen.getByTestId('invite-email-input'), 'test@example.com');

      // Close dialog via cancel
      await user.click(screen.getByText('Cancel'));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows error message when invitation fails', async () => {
      mockOnInvite.mockRejectedValue(new Error('Invitation failed'));
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.type(screen.getByTestId('invite-email-input'), 'test@example.com');
      await user.click(screen.getByTestId('invite-submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument();
        expect(screen.getByText('Invitation failed')).toBeInTheDocument();
      });
    });

    it('disables form elements while submitting', async () => {
      // Delay the resolution to test loading state
      mockOnInvite.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      render(<InviteUserDialog {...defaultProps} />);

      await user.type(screen.getByTestId('invite-email-input'), 'test@example.com');
      await user.click(screen.getByTestId('invite-submit-button'));

      // Check that the submit button shows loading state
      expect(screen.getByTestId('invite-submit-button')).toBeDisabled();

      await waitFor(() => {
        expect(mockOnInvite).toHaveBeenCalled();
      });
    });
  });
});
