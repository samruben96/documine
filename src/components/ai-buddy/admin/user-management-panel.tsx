/**
 * UserManagementPanel Component
 * Story 20.2: Admin User Management
 *
 * Main panel for viewing and managing agency users
 * AC-20.2.1: Paginated user list with columns
 * AC-20.2.2: Search by name or email
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Plus, AlertCircle } from 'lucide-react';
import { useUserManagement } from '@/hooks/ai-buddy/use-user-management';
import { UserTable } from './user-table';
import { InviteUserDialog } from './invite-user-dialog';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

interface UserManagementPanelProps {
  /** Whether the current user has manage_users permission */
  hasManageUsersPermission: boolean;
}

/**
 * Admin panel for managing agency users
 *
 * Only renders when hasManageUsersPermission is true.
 *
 * @example
 * ```tsx
 * <UserManagementPanel hasManageUsersPermission={isAdmin} />
 * ```
 */
export function UserManagementPanel({ hasManageUsersPermission }: UserManagementPanelProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const {
    users,
    invitations,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    setPage,
    sortColumn,
    sortDirection,
    setSort,
    setSearchQuery,
    inviteUser,
    removeUser,
    changeRole,
    cancelInvitation,
    resendInvitation,
    refetch,
  } = useUserManagement();

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleInvite = async (email: string, role: 'producer' | 'admin') => {
    try {
      await inviteUser(email, role);
      toast.success(`Invitation sent to ${email}`);
      setIsInviteDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
      throw err;
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    try {
      await removeUser(userId);
      toast.success(`${userName} has been removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'producer' | 'admin') => {
    try {
      await changeRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    try {
      await cancelInvitation(invitationId);
      toast.success(`Invitation to ${email} cancelled`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      await resendInvitation(invitationId);
      toast.success(`Invitation resent to ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  };

  // Don't render if user doesn't have permission
  if (!hasManageUsersPermission) {
    return null;
  }

  // Loading skeleton
  if (isLoading && users.length === 0) {
    return (
      <Card className="mt-6" data-testid="user-management-panel-loading">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="mt-6" data-testid="user-management-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage team members and their AI Buddy access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" data-testid="user-management-panel-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load users: {error.message}
              <button
                onClick={refetch}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6" data-testid="user-management-panel">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage team members and their AI Buddy access. {totalCount} user{totalCount !== 1 ? 's' : ''} total.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsInviteDialogOpen(true)}
            data-testid="invite-user-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input (AC-20.2.2) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10"
            data-testid="user-search-input"
          />
        </div>

        {/* User table (AC-20.2.1) */}
        <UserTable
          users={users}
          invitations={invitations}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={setSort}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onRemoveUser={handleRemoveUser}
          onChangeRole={handleChangeRole}
          onCancelInvitation={handleCancelInvitation}
          onResendInvitation={handleResendInvitation}
          isLoading={isLoading}
        />
      </CardContent>

      {/* Invite dialog (AC-20.2.3) */}
      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInvite}
      />
    </Card>
  );
}
