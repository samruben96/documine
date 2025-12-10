/**
 * @vitest-environment happy-dom
 */
/**
 * Unit Tests - UserManagementPanel Component
 * Story 20.2: Admin User Management
 *
 * AC-20.2.1: Paginated user list with columns
 * AC-20.2.2: Search by name or email
 * AC-20.2.3: Invite new user via email
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementPanel } from '@/components/admin/user-management-panel';

// Mock the hook
vi.mock('@/hooks/admin/use-user-management', () => ({
  useUserManagement: vi.fn(),
}));

// Mock use-debounce
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: Function) => fn,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useUserManagement } from '@/hooks/admin/use-user-management';
import { toast } from 'sonner';

const mockUseUserManagement = vi.mocked(useUserManagement);

describe('UserManagementPanel', () => {
  const mockUsers = [
    {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      aiBuddyStatus: 'active' as const,
      lastActiveAt: '2025-12-08T10:00:00Z',
      onboardingCompleted: true,
      isOwner: false,
    },
    {
      id: 'user-2',
      email: 'producer@example.com',
      name: 'Producer User',
      role: 'producer' as const,
      aiBuddyStatus: 'onboarding_pending' as const,
      lastActiveAt: null,
      onboardingCompleted: false,
      isOwner: false,
    },
  ];

  const mockInvitations = [
    {
      id: 'inv-1',
      email: 'invited@example.com',
      role: 'producer' as const,
      invitedBy: 'user-1',
      invitedAt: '2025-12-08T10:00:00Z',
      expiresAt: '2025-12-15T10:00:00Z',
      isExpired: false,
    },
  ];

  const mockHookReturn = {
    users: mockUsers,
    invitations: mockInvitations,
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalCount: 2,
    pageSize: 20,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    sortColumn: 'name' as const,
    sortDirection: 'asc' as const,
    setSort: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    inviteUser: vi.fn(),
    removeUser: vi.fn(),
    changeRole: vi.fn(),
    cancelInvitation: vi.fn(),
    resendInvitation: vi.fn(),
    refetch: vi.fn(),
  };

  beforeEach(() => {
    mockUseUserManagement.mockReturnValue(mockHookReturn);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission Gating', () => {
    it('returns null when hasManageUsersPermission is false', () => {
      const { container } = render(
        <UserManagementPanel hasManageUsersPermission={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders panel when hasManageUsersPermission is true', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByTestId('user-management-panel')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton during initial load', () => {
      mockUseUserManagement.mockReturnValue({
        ...mockHookReturn,
        users: [],
        isLoading: true,
      });

      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByTestId('user-management-panel-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', () => {
      mockUseUserManagement.mockReturnValue({
        ...mockHookReturn,
        error: new Error('Failed to fetch'),
      });

      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByTestId('user-management-panel-error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });
  });

  describe('User List (AC-20.2.1)', () => {
    it('displays user list with correct columns', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);

      // Check column headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Active')).toBeInTheDocument();
    });

    it('displays user rows', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);

      expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Producer User')).toBeInTheDocument();
    });

    it('displays total count', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByText(/2 users total/)).toBeInTheDocument();
    });
  });

  describe('Search (AC-20.2.2)', () => {
    it('renders search input', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
    });

    it('calls setSearchQuery when typing', async () => {
      const user = userEvent.setup();
      render(<UserManagementPanel hasManageUsersPermission={true} />);

      const searchInput = screen.getByTestId('user-search-input');
      await user.type(searchInput, 'test');

      expect(mockHookReturn.setSearchQuery).toHaveBeenCalledWith('test');
    });
  });

  describe('Invite Button (AC-20.2.3)', () => {
    it('renders invite button', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByTestId('invite-user-button')).toBeInTheDocument();
    });

    it('opens invite dialog when clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagementPanel hasManageUsersPermission={true} />);

      await user.click(screen.getByTestId('invite-user-button'));
      expect(screen.getByTestId('invite-user-dialog')).toBeInTheDocument();
    });
  });

  describe('Pending Invitations (AC-20.2.4)', () => {
    it('displays pending invitations', () => {
      render(<UserManagementPanel hasManageUsersPermission={true} />);
      expect(screen.getByTestId('invitation-row-inv-1')).toBeInTheDocument();
      expect(screen.getByText('invited@example.com')).toBeInTheDocument();
    });
  });

  describe('Invitation Actions', () => {
    it('calls inviteUser and shows success toast on successful invite', async () => {
      mockHookReturn.inviteUser.mockResolvedValue();
      const user = userEvent.setup();

      render(<UserManagementPanel hasManageUsersPermission={true} />);

      // Open invite dialog
      await user.click(screen.getByTestId('invite-user-button'));

      // Fill email
      await user.type(screen.getByTestId('invite-email-input'), 'new@example.com');

      // Submit
      await user.click(screen.getByTestId('invite-submit-button'));

      await waitFor(() => {
        expect(mockHookReturn.inviteUser).toHaveBeenCalledWith('new@example.com', 'producer');
        expect(toast.success).toHaveBeenCalledWith('Invitation sent to new@example.com');
      });
    });
  });
});
