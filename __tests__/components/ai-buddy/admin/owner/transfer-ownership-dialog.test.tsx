/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - TransferOwnershipDialog Component
 * Story 20.5: Owner Management
 *
 * AC-20.5.4: Owner sees "Transfer Ownership" option
 * AC-20.5.5: Only admins listed as transfer targets
 * AC-20.5.6: Password confirmation required
 * AC-20.5.10: Empty state when no admins available
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransferOwnershipDialog } from '@/components/ai-buddy/admin/owner/transfer-ownership-dialog';

describe('TransferOwnershipDialog', () => {
  const mockAdmins = [
    { id: 'admin-1', email: 'admin1@example.com', name: 'Admin One' },
    { id: 'admin-2', email: 'admin2@example.com', name: null },
  ];

  const defaultProps = {
    admins: mockAdmins,
    isLoadingAdmins: false,
    adminsError: null,
    onTransfer: vi.fn().mockResolvedValue({}),
    isTransferring: false,
    onRefreshAdmins: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Trigger Button (AC-20.5.4)', () => {
    it('renders transfer ownership button', () => {
      render(<TransferOwnershipDialog {...defaultProps} />);
      expect(screen.getByTestId('transfer-ownership-button')).toBeInTheDocument();
    });

    it('opens dialog when button clicked', async () => {
      const user = userEvent.setup();
      render(<TransferOwnershipDialog {...defaultProps} />);

      await user.click(screen.getByTestId('transfer-ownership-button'));
      // Dialog title is different from button text
      expect(screen.getByText('Transfer your agency ownership to another administrator.')).toBeInTheDocument();
    });
  });

  describe('Admin List Loading State', () => {
    it('shows skeleton when loading admins', async () => {
      const user = userEvent.setup();
      render(
        <TransferOwnershipDialog {...defaultProps} isLoadingAdmins={true} admins={[]} />
      );

      await user.click(screen.getByTestId('transfer-ownership-button'));
      // Loading skeleton should be visible
      expect(screen.queryByTestId('admin-select')).not.toBeInTheDocument();
    });
  });

  describe('Admin List Error State', () => {
    it('shows error when admins fetch fails', async () => {
      const user = userEvent.setup();
      render(
        <TransferOwnershipDialog
          {...defaultProps}
          admins={[]}
          adminsError={new Error('Failed to load')}
        />
      );

      await user.click(screen.getByTestId('transfer-ownership-button'));
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });

  describe('Empty State (AC-20.5.10)', () => {
    it('shows message when no admins available', async () => {
      const user = userEvent.setup();
      render(<TransferOwnershipDialog {...defaultProps} admins={[]} />);

      await user.click(screen.getByTestId('transfer-ownership-button'));
      expect(screen.getByTestId('no-admins-message')).toBeInTheDocument();
      expect(screen.getByText(/Promote a user to admin first/i)).toBeInTheDocument();
    });
  });

  describe('Admin Selection (AC-20.5.5)', () => {
    it('displays admin selector when admins available', async () => {
      const user = userEvent.setup();
      render(<TransferOwnershipDialog {...defaultProps} />);

      await user.click(screen.getByTestId('transfer-ownership-button'));
      expect(screen.getByTestId('admin-select')).toBeInTheDocument();
    });

    it('shows warning message about consequences', async () => {
      const user = userEvent.setup();
      render(<TransferOwnershipDialog {...defaultProps} />);

      await user.click(screen.getByTestId('transfer-ownership-button'));
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });
  });

  describe('Two-Step Confirmation', () => {
    it('has proceed button to advance to confirmation step', async () => {
      const user = userEvent.setup();
      render(<TransferOwnershipDialog {...defaultProps} />);

      await user.click(screen.getByTestId('transfer-ownership-button'));
      expect(screen.getByTestId('proceed-to-confirm-button')).toBeInTheDocument();
    });
  });

  // Note: Full flow tests involving Radix Select dropdown and multi-step interactions
  // are covered in E2E tests. Unit tests focus on component rendering and basic patterns.
});
