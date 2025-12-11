/**
 * UserTable Component
 * Story 20.2: Admin User Management
 *
 * Displays users and pending invitations in a sortable table
 * AC-20.2.1: Paginated user list with columns (name, email, role, status, last active)
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  UserMinus,
  Shield,
  Mail,
  Clock,
  X,
  RefreshCw,
  Crown,
} from 'lucide-react';
import type { AdminUser, AiBuddyInvitation, UserRole } from '@/types/ai-buddy';
import { RoleChangeDialog } from './role-change-dialog';
import { RemoveUserDialog } from './remove-user-dialog';

type SortColumn = 'name' | 'email' | 'role' | 'lastActiveAt';
type SortDirection = 'asc' | 'desc';

interface UserTableProps {
  users: AdminUser[];
  invitations: AiBuddyInvitation[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRemoveUser: (userId: string, userName: string) => Promise<void>;
  onChangeRole: (userId: string, newRole: 'producer' | 'admin') => Promise<void>;
  onCancelInvitation: (invitationId: string, email: string) => Promise<void>;
  onResendInvitation: (invitationId: string, email: string) => Promise<void>;
  isLoading?: boolean;
}

function formatLastActive(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * DR.7: Updated role badges to use status variants for consistency.
 * - owner → status-special (purple) - highest privilege
 * - admin → status-info (blue) - elevated privilege
 * - producer → status-default (slate) - standard user
 */
function getRoleBadge(role: UserRole) {
  switch (role) {
    case 'owner':
      return (
        <Badge variant="status-special">
          <Crown className="h-3 w-3 mr-1" />
          Owner
        </Badge>
      );
    case 'admin':
      return (
        <Badge variant="status-info">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    case 'producer':
      return <Badge variant="status-default">Producer</Badge>;
    default:
      return <Badge variant="status-default">{role}</Badge>;
  }
}

/**
 * DR.7: Updated status badges to use status variants for consistency.
 * - active → status-success (green)
 * - onboarding_pending → status-progress (amber)
 * - inactive → status-default (slate)
 */
function getStatusBadge(status: AdminUser['aiBuddyStatus']) {
  switch (status) {
    case 'active':
      return <Badge variant="status-success">Active</Badge>;
    case 'onboarding_pending':
      return <Badge variant="status-progress">Onboarding</Badge>;
    case 'inactive':
      return <Badge variant="status-default">Inactive</Badge>;
    default:
      return <Badge variant="status-default">{status}</Badge>;
  }
}

function SortIcon({ column, sortColumn, sortDirection }: {
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  if (column !== sortColumn) {
    return <span className="ml-1 opacity-0 group-hover:opacity-50"><ChevronUp className="h-4 w-4" /></span>;
  }
  return sortDirection === 'asc' ? (
    <ChevronUp className="ml-1 h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 h-4 w-4" />
  );
}

export function UserTable({
  users,
  invitations,
  sortColumn,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onRemoveUser,
  onChangeRole,
  onCancelInvitation,
  onResendInvitation,
  isLoading,
}: UserTableProps) {
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUser | null>(null);
  const [removeUserData, setRemoveUserData] = useState<{ userId: string; name: string } | null>(null);

  // Filter out expired invitations for display
  const pendingInvitations = invitations.filter((inv) => !inv.isExpired);
  const expiredInvitations = invitations.filter((inv) => inv.isExpired);

  const SortableHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer group select-none"
      onClick={() => onSort(column)}
      data-testid={`sort-${column}`}
    >
      <div className="flex items-center">
        {children}
        <SortIcon column={column} sortColumn={sortColumn} sortDirection={sortDirection} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="name">Name</SortableHeader>
              <SortableHeader column="email">Email</SortableHeader>
              <SortableHeader column="role">Role</SortableHeader>
              <TableHead>Status</TableHead>
              <SortableHeader column="lastActiveAt">Last Active</SortableHeader>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading skeleton */}
            {isLoading && users.length === 0 && (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
              </>
            )}

            {/* Active users */}
            {users.map((user) => (
              <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                <TableCell className="font-medium">
                  {user.name || <span className="text-muted-foreground italic">No name</span>}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.aiBuddyStatus)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatLastActive(user.lastActiveAt)}
                </TableCell>
                <TableCell>
                  {!user.isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`user-actions-${user.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setRoleChangeUser(user)}
                          data-testid={`change-role-${user.id}`}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setRemoveUserData({ userId: user.id, name: user.name || user.email })}
                          className="text-destructive focus:text-destructive"
                          data-testid={`remove-user-${user.id}`}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {/* Pending invitations */}
            {pendingInvitations.map((inv) => (
              <TableRow
                key={`inv-${inv.id}`}
                className="bg-muted/30"
                data-testid={`invitation-row-${inv.id}`}
              >
                <TableCell className="font-medium text-muted-foreground italic">
                  Pending
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {inv.email}
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(inv.role)}</TableCell>
                <TableCell>
                  {/* DR.7: Use status-progress for pending invitation state */}
                  <Badge variant="status-progress">
                    <Clock className="h-3 w-3 mr-1" />
                    Invited
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  Expires {new Date(inv.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`invitation-actions-${inv.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onResendInvitation(inv.id, inv.email)}
                        data-testid={`resend-invitation-${inv.id}`}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onCancelInvitation(inv.id, inv.email)}
                        className="text-destructive focus:text-destructive"
                        data-testid={`cancel-invitation-${inv.id}`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {/* Expired invitations (shown with warning) */}
            {expiredInvitations.map((inv) => (
              <TableRow
                key={`exp-${inv.id}`}
                className="bg-muted/30 opacity-60"
                data-testid={`expired-invitation-row-${inv.id}`}
              >
                <TableCell className="font-medium text-muted-foreground italic">
                  Expired
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {inv.email}
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(inv.role)}</TableCell>
                <TableCell>
                  {/* DR.7: Use status-error for expired invitation state */}
                  <Badge variant="status-error">
                    Expired
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  Expired {new Date(inv.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onResendInvitation(inv.id, inv.email)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onCancelInvitation(inv.id, inv.email)}
                        className="text-destructive focus:text-destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {/* Empty state */}
            {!isLoading && users.length === 0 && invitations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              data-testid="prev-page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              data-testid="next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Role change dialog (AC-20.2.6) */}
      {roleChangeUser && (
        <RoleChangeDialog
          open={!!roleChangeUser}
          onOpenChange={(open) => !open && setRoleChangeUser(null)}
          user={roleChangeUser}
          onConfirm={async (newRole) => {
            await onChangeRole(roleChangeUser.id, newRole);
            setRoleChangeUser(null);
          }}
        />
      )}

      {/* Remove user dialog (AC-20.2.5) */}
      {removeUserData && (
        <RemoveUserDialog
          open={!!removeUserData}
          onOpenChange={(open) => !open && setRemoveUserData(null)}
          userName={removeUserData.name}
          onConfirm={async () => {
            await onRemoveUser(removeUserData.userId, removeUserData.name);
            setRemoveUserData(null);
          }}
        />
      )}
    </div>
  );
}
