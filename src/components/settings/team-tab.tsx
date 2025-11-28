'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw, X, UserPlus } from 'lucide-react';

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
import { resendInvitation, cancelInvitation } from '@/app/(dashboard)/settings/actions';

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
 */
export function TeamTab({ user, members, invitations: initialInvitations }: TeamTabProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAdmin = user.role === 'admin';

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

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

  const handleInviteSuccess = () => {
    // Refresh page to get updated invitations
    window.location.reload();
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'member' : 'members'} in your agency
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const role = roleDisplay[member.role as keyof typeof roleDisplay] ?? defaultRole;
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name || 'No name set'}
                      {member.id === user.id && (
                        <span className="ml-2 text-xs text-slate-500">(You)</span>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
                        {role.label}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(member.created_at)}</TableCell>
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
          {pendingInvitations.length > 0 && (
            <CardContent>
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
                      <TableRow key={invitation.id}>
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
            </CardContent>
          )}
        </Card>
      )}

      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
}
