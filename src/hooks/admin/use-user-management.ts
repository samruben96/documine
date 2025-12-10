/**
 * User Management Hook
 * Story 20.2: Admin User Management
 *
 * Provides state management for user list, invitations, and CRUD operations
 * AC-20.2.1 through AC-20.2.6
 */

import { useState, useCallback, useEffect } from 'react';
import type { AdminUser, AiBuddyInvitation, UserRole } from '@/types/ai-buddy';

type SortColumn = 'name' | 'email' | 'role' | 'lastActiveAt';
type SortDirection = 'asc' | 'desc';

interface UseUserManagementOptions {
  initialPageSize?: number;
  initialSortColumn?: SortColumn;
  initialSortDirection?: SortDirection;
}

interface UserListState {
  users: AdminUser[];
  invitations: AiBuddyInvitation[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface UseUserManagementReturn {
  // State
  users: AdminUser[];
  invitations: AiBuddyInvitation[];
  isLoading: boolean;
  error: Error | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Sorting
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  setSort: (column: SortColumn, direction?: SortDirection) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  inviteUser: (email: string, role: 'producer' | 'admin') => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  changeRole: (userId: string, newRole: 'producer' | 'admin') => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useUserManagement(
  options: UseUserManagementOptions = {}
): UseUserManagementReturn {
  const {
    initialPageSize = 20,
    initialSortColumn = 'name',
    initialSortDirection = 'asc',
  } = options;

  // State
  const [state, setState] = useState<UserListState>({
    users: [],
    invitations: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Pagination state
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  // Search state
  const [searchQuery, setSearchQueryState] = useState('');

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: state.currentPage.toString(),
        pageSize: pageSize.toString(),
        sortColumn,
        sortDirection,
      });

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setState({
        users: data.users,
        invitations: data.invitations,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [state.currentPage, pageSize, sortColumn, sortDirection, searchQuery]);

  // Initial fetch and refetch on dependency change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Page setter
  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Sort setter with toggle
  const setSort = useCallback((column: SortColumn, direction?: SortDirection) => {
    setSortColumn(column);
    if (direction) {
      setSortDirection(direction);
    } else {
      // Toggle direction if same column
      setSortDirection((prev) =>
        sortColumn === column && prev === 'asc' ? 'desc' : 'asc'
      );
    }
    // Reset to page 1 when sort changes
    setState((prev) => ({ ...prev, currentPage: 1 }));
  }, [sortColumn]);

  // Search setter with debounce handling done in component
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    // Reset to page 1 when search changes
    setState((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  // Invite user
  const inviteUser = useCallback(async (email: string, role: 'producer' | 'admin') => {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to invite user');
    }

    // Refetch to update list
    await fetchUsers();
  }, [fetchUsers]);

  // Remove user
  const removeUser = useCallback(async (userId: string) => {
    const response = await fetch(`/api/admin/users?userId=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove user');
    }

    // Refetch to update list
    await fetchUsers();
  }, [fetchUsers]);

  // Change role
  const changeRole = useCallback(async (userId: string, newRole: 'producer' | 'admin') => {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to change role');
    }

    // Refetch to update list
    await fetchUsers();
  }, [fetchUsers]);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    const response = await fetch(`/api/admin/invitations/${invitationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel invitation');
    }

    // Refetch to update list
    await fetchUsers();
  }, [fetchUsers]);

  // Resend invitation
  const resendInvitation = useCallback(async (invitationId: string) => {
    const response = await fetch(`/api/admin/invitations/${invitationId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to resend invitation');
    }

    // Refetch to update list
    await fetchUsers();
  }, [fetchUsers]);

  return {
    // State
    users: state.users,
    invitations: state.invitations,
    isLoading,
    error,

    // Pagination
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalCount: state.totalCount,
    pageSize,
    setPage,
    setPageSize,

    // Sorting
    sortColumn,
    sortDirection,
    setSort,

    // Search
    searchQuery,
    setSearchQuery,

    // Actions
    inviteUser,
    removeUser,
    changeRole,
    cancelInvitation,
    resendInvitation,
    refetch: fetchUsers,
  };
}
