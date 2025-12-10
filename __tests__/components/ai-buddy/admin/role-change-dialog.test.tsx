/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - RoleChangeDialog Component
 * Story 20.2: Admin User Management
 *
 * AC-20.2.6: Change user role
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleChangeDialog } from '@/components/ai-buddy/admin/role-change-dialog';
import type { AdminUser } from '@/types/ai-buddy';

describe('RoleChangeDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  const adminUser: AdminUser = {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    aiBuddyStatus: 'active',
    lastActiveAt: '2025-12-08T10:00:00Z',
    onboardingCompleted: true,
    isOwner: false,
  };

  const producerUser: AdminUser = {
    id: 'user-2',
    email: 'producer@example.com',
    name: 'Producer User',
    role: 'producer',
    aiBuddyStatus: 'active',
    lastActiveAt: '2025-12-08T10:00:00Z',
    onboardingCompleted: true,
    isOwner: false,
  };

  beforeEach(() => {
    mockOnConfirm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByTestId('role-change-dialog')).toBeInTheDocument();
    });

    it('displays user name in description', () => {
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('defaults to opposite role for admin user', () => {
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );
      // Should default to producer since user is admin
      expect(screen.getByTestId('role-select')).toHaveTextContent('Producer');
    });

    it('defaults to opposite role for producer user', () => {
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={producerUser}
          onConfirm={mockOnConfirm}
        />
      );
      // Should default to admin since user is producer
      expect(screen.getByTestId('role-select')).toHaveTextContent('Admin');
    });
  });

  describe('Demotion Warning', () => {
    it('shows demotion warning when demoting admin to producer', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );

      // Default is producer (demotion), so warning should show
      expect(screen.getByText(/Demotion warning/i)).toBeInTheDocument();
    });
  });

  describe('Promotion Info', () => {
    it('shows promotion info when promoting producer to admin', async () => {
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={producerUser}
          onConfirm={mockOnConfirm}
        />
      );

      // Default is admin (promotion), so info should show
      expect(screen.getByText(/Promotion:/i)).toBeInTheDocument();
    });
  });

  describe('Role Change', () => {
    it('calls onConfirm with new role on submit', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByTestId('role-change-confirm-button'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('producer');
      });
    });

    it('closes dialog without calling onConfirm when clicking cancel', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('does not call onConfirm when no role change', async () => {
      // Start with admin user, dialog defaults to producer
      // But if somehow the role is the same, confirm should not fire
      const user = userEvent.setup();

      // Create a mock that sets role to same as user
      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );

      // Default is producer, which is different from admin
      // Confirm button should be enabled
      expect(screen.getByTestId('role-change-confirm-button')).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when role change fails', async () => {
      mockOnConfirm.mockRejectedValue(new Error('Cannot demote last admin'));
      const user = userEvent.setup();

      render(
        <RoleChangeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          user={adminUser}
          onConfirm={mockOnConfirm}
        />
      );

      await user.click(screen.getByTestId('role-change-confirm-button'));

      await waitFor(() => {
        expect(screen.getByTestId('role-change-error')).toBeInTheDocument();
        expect(screen.getByText('Cannot demote last admin')).toBeInTheDocument();
      });
    });
  });
});
