'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw, X, UserPlus, Trash2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InviteUserModal } from './invite-user-modal';
import { RemoveUserModal } from './remove-user-modal';
import { resendInvitation, cancelInvitation, changeUserRole } from '@/app/(dashboard)/settings/actions';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface TeamTabProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
  members: TeamMember[];
  invitations: Invitation[];
  agencyName: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const roleDisplay = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  member: { label: 'Member', color: 'bg-gray-100 text-gray-800' },
} as const;

const defaultRole = roleDisplay.member;

/**
 * Team Tab Component
 * Per AC-3.2.7: Displays pending invitations with email, role, invited date, status
 * Per AC-3.2.8, AC-3.2.9: Resend and Cancel actions
 * Per AC-3.3.1-8: Team member management with role toggle and remove functionality
 */
export function TeamTab({ user, members: initialMembers, invitations: initialInvitations, agencyName }: TeamTabProps) {
  const router = useRouter();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<TeamMember | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAdmin = user.role === 'admin';

  // AC-3.6.1: Optimistic updates for role changes
  const [optimisticMembers, setOptimisticMember] = useOptimistic(
    initialMembers,
    (state, { memberId, newRole }: { memberId: string; newRole: string }) =>
      state.map(m => m.id === memberId ? { ...m, role: newRole } : m)
  );

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  // AC-3.6.1: Optimistic role change with error rollback
  const handleRoleChange = (memberId: string, newRole: 'admin' | 'member') => {
    const member = optimisticMembers.find(m => m.id === memberId);
    const previousRole = member?.role || 'member';

    setPendingAction(`role-${memberId}`);

    startTransition(async () => {
      // Optimistic update - UI updates immediately
      setOptimisticMember({ memberId, newRole });

      const result = await changeUserRole(memberId, newRole);
      setPendingAction(null);

      if (result.success) {
        toast.success(`Role updated to ${newRole}`);
        // AC-3.6.6: Brief highlight animation on success
        setHighlightedMemberId(memberId);
        setTimeout(() => setHighlightedMemberId(null), 300);
        // Refresh to sync server state
        router.refresh();
      } else {
        // Revert on error - useOptimistic handles this automatically on re-render
        toast.error(result.error || 'Failed to update role');
        router.refresh(); // Force re-render to revert optimistic update
      }
    });
  };

  const handleRemoveClick = (member: TeamMember) => {
    setUserToRemove(member);
    setRemoveModalOpen(true);
  };

  // AC-3.6.6: Fade-out animation on member removal
  const handleRemoveSuccess = () => {
    if (userToRemove) {
      // Start fade-out animation
      setRemovingMemberId(userToRemove.id);
      // After animation completes, refresh to get updated data
      setTimeout(() => {
        setRemovingMemberId(null);
        setUserToRemove(null);
        router.refresh();
      }, 300);
    }
  };

  const handleResend = (invitationId: string, email: string) => {
    setPendingAction(`resend-${invitationId}`);
    startTransition(async () => {
      const result = await resendInvitation(invitationId);
      setPendingAction(null);

      if (result.success) {
        toast.success(`Invitation resent to ${email}`);
      } else {
        toast.error(result.error || 'Failed to resend invitation');
      }
    });
  };

  const handleCancel = (invitationId: string) => {
    setPendingAction(`cancel-${invitationId}`);
    startTransition(async () => {
      const result = await cancelInvitation(invitationId);
      setPendingAction(null);

      if (result.success) {
        toast.success('Invitation cancelled');
        // Remove from local state
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        toast.error(result.error || 'Failed to cancel invitation');
      }
    });
  };

  // AC-3.6.2: Use router.refresh() instead of full page reload
  const handleInviteSuccess = () => {
    // Refresh server components without losing client state or scroll position
    router.refresh();
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Team Members
              {/* AC-3.6.7: View-only mode indicator for non-admin users */}
              {!isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  <Eye className="h-3 w-3" />
                  View only
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {optimisticMembers.length} {optimisticMembers.length === 1 ? 'member' : 'members'} in your agency
              {/* AC-3.6.7: Explanation for non-admin users */}
              {!isAdmin && (
                <span className="block text-xs text-slate-500 mt-1">
                  Contact an admin to manage team members
                </span>
              )}
            </CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticMembers.map((member) => {
                const role = roleDisplay[member.role as keyof typeof roleDisplay] ?? defaultRole;
                const isCurrentUser = member.id === user.id;
                const isChangingRole = pendingAction === `role-${member.id}`;
                const isBeingRemoved = removingMemberId === member.id;
                const isHighlighted = highlightedMemberId === member.id;

                return (
                  <TableRow
                    key={member.id}
                    className={`
                      group transition-all duration-300
                      ${isBeingRemoved ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                      ${isHighlighted ? 'bg-green-50' : ''}
                    `}
                  >
                    <TableCell className="font-medium">
                      {member.full_name || 'No name set'}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-slate-500">(You)</span>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {isAdmin && !isCurrentUser ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                            disabled={isPending}
                            className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          {/* AC-3.6.1: Inline loading indicator */}
                          {isChangingRole && (
                            <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                          )}
                        </div>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
                          {role.label}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(member.created_at)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {/* AC-3.6.3: Hover-reveal remove button (desktop) / Always visible (mobile) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(member)}
                          disabled={isCurrentUser || isPending}
                          className={`
                            text-red-600 hover:text-red-700 hover:bg-red-50
                            transition-opacity duration-200
                            ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}
                            [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100
                          `}
                          title={isCurrentUser ? 'You cannot remove yourself' : 'Remove member'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations Section - Admin Only */}
      {isAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {pendingInvitations.length === 0
                ? 'No pending invitations'
                : `${pendingInvitations.length} pending ${pendingInvitations.length === 1 ? 'invitation' : 'invitations'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* AC-3.6.4: Helpful empty state for invitations */}
            {pendingInvitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-slate-100 p-3 mb-3">
                  <UserPlus className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 font-medium">No pending invitations</p>
                <p className="text-xs text-slate-500 mt-1">Invite team members to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => {
                    const role = roleDisplay[invitation.role as keyof typeof roleDisplay] ?? defaultRole;
                    const isExpired = new Date(invitation.expires_at) < new Date();
                    const isResending = pendingAction === `resend-${invitation.id}`;
                    const isCancelling = pendingAction === `cancel-${invitation.id}`;

                    return (
                      <TableRow
                        key={invitation.id}
                        className="transition-opacity duration-300"
                      >
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
                            {role.label}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(invitation.created_at)}</TableCell>
                        <TableCell>
                          {isExpired ? (
                            <span className="text-red-600 text-sm">Expired</span>
                          ) : (
                            formatDate(invitation.expires_at)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(invitation.id, invitation.email)}
                              disabled={isPending}
                            >
                              {isResending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              <span className="ml-1.5">Resend</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(invitation.id)}
                              disabled={isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isCancelling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span className="ml-1.5">Cancel</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={handleInviteSuccess}
      />

      {userToRemove && (
        <RemoveUserModal
          open={removeModalOpen}
          onOpenChange={setRemoveModalOpen}
          user={userToRemove}
          agencyName={agencyName}
          onSuccess={handleRemoveSuccess}
        />
      )}
    </>
  );
}
