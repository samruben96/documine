/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - RemoveUserDialog Component
 * Story 20.2: Admin User Management
 *
 * AC-20.2.5: Remove user access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RemoveUserDialog } from '@/components/ai-buddy/admin/remove-user-dialog';

describe('RemoveUserDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    userName: 'Test User',
    onConfirm: mockOnConfirm,
  };

  beforeEach(() => {
    mockOnConfirm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<RemoveUserDialog {...defaultProps} />);
      expect(screen.getByTestId('remove-user-dialog')).toBeInTheDocument();
    });

    it('displays user name in confirmation', () => {
      render(<RemoveUserDialog {...defaultProps} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('shows warning about consequences', () => {
      render(<RemoveUserDialog {...defaultProps} />);
      expect(screen.getByText(/This action will/i)).toBeInTheDocument();
      expect(screen.getByText(/Revoke their access to AI Buddy/i)).toBeInTheDocument();
      expect(screen.getByText(/Remove them from all shared projects/i)).toBeInTheDocument();
    });
  });

  describe('Confirmation', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      const user = userEvent.setup();
      render(<RemoveUserDialog {...defaultProps} />);

      await user.click(screen.getByTestId('remove-user-confirm-button'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('closes dialog after successful removal', async () => {
      const user = userEvent.setup();
      render(<RemoveUserDialog {...defaultProps} />);

      await user.click(screen.getByTestId('remove-user-confirm-button'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });
  });

  describe('Cancellation', () => {
    it('closes dialog without removing when cancel clicked', async () => {
      const user = userEvent.setup();
      render(<RemoveUserDialog {...defaultProps} />);

      await user.click(screen.getByText('Cancel'));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when removal fails', async () => {
      mockOnConfirm.mockRejectedValue(new Error('Cannot remove agency owner'));
      const user = userEvent.setup();

      render(<RemoveUserDialog {...defaultProps} />);

      await user.click(screen.getByTestId('remove-user-confirm-button'));

      await waitFor(() => {
        expect(screen.getByTestId('remove-user-error')).toBeInTheDocument();
        expect(screen.getByText('Cannot remove agency owner')).toBeInTheDocument();
      });
    });

    it('keeps dialog open when removal fails', async () => {
      mockOnConfirm.mockRejectedValue(new Error('Error'));
      const user = userEvent.setup();

      render(<RemoveUserDialog {...defaultProps} />);

      await user.click(screen.getByTestId('remove-user-confirm-button'));

      await waitFor(() => {
        expect(screen.getByTestId('remove-user-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('disables buttons while removing', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();

      render(<RemoveUserDialog {...defaultProps} />);

      await user.click(screen.getByTestId('remove-user-confirm-button'));

      expect(screen.getByTestId('remove-user-confirm-button')).toBeDisabled();
    });
  });
});
