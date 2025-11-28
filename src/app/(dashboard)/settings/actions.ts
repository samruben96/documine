'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { profileSchema, agencySchema, inviteUserSchema } from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';
import { type PlanTier, getSeatLimit } from '@/lib/constants/plans';
import { type UsageMetrics } from '@/types';

/**
 * Update user profile
 * Per AC-2.6.2, AC-2.6.3: Validates name length and updates database
 */
export async function updateProfile(data: { fullName: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input server-side
  const result = profileSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error?.issues?.[0]?.message ?? 'Invalid input';
    return { success: false, error: firstError };
  }

  // 2. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Update users table
  const { error } = await supabase
    .from('users')
    .update({
      full_name: data.fullName,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Failed to update profile' };
  }

  return { success: true };
}

/**
 * Update agency settings
 * Per AC-3.1.2, AC-3.1.3: Validates name and updates agency
 * Per AC-3.1.4: Only admins can update
 */
export async function updateAgency(data: { name: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input server-side
  const result = agencySchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error?.issues?.[0]?.message ?? 'Invalid input';
    return { success: false, error: firstError };
  }

  // 2. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Get user's role and agency_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'Failed to get user data' };
  }

  // 4. Verify admin role
  if (userData.role !== 'admin') {
    return { success: false, error: 'Only admins can update agency settings' };
  }

  // 5. Update agencies table
  const { error: updateError } = await supabase
    .from('agencies')
    .update({
      name: data.name,
      updated_at: new Date().toISOString()
    })
    .eq('id', userData.agency_id);

  if (updateError) {
    return { success: false, error: 'Failed to update agency settings' };
  }

  return { success: true };
}

/**
 * Invite user to agency
 * Per AC-3.2.1 to AC-3.2.6: Validates, checks limits, creates invitation, sends email
 */
export async function inviteUser(data: { email: string; role: 'admin' | 'member' }): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Validate input server-side
  const result = inviteUserSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error?.issues?.[0]?.message ?? 'Invalid input';
    return { success: false, error: firstError };
  }

  // 2. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 3. Get user's role and agency_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'Failed to get user data' };
  }

  // 4. Verify admin role
  if (userData.role !== 'admin') {
    return { success: false, error: 'Only admins can invite users' };
  }

  const agencyId = userData.agency_id;

  // 5. Check seat limit (AC-3.2.2)
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  const { count: pendingCount } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('status', 'pending');

  const { data: agency } = await supabase
    .from('agencies')
    .select('seat_limit')
    .eq('id', agencyId)
    .single();

  if ((userCount ?? 0) + (pendingCount ?? 0) >= (agency?.seat_limit ?? 0)) {
    // AC-3.2.3: Seat limit error message
    return { success: false, error: 'Seat limit reached. Upgrade to add more users.' };
  }

  // 6. Check for duplicate email in users (AC-3.2.4)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('email', data.email)
    .maybeSingle();

  if (existingUser) {
    return { success: false, error: 'This email already has an account in your agency' };
  }

  // 7. Check for duplicate email in pending invitations (AC-3.2.4)
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('email', data.email)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInvite) {
    return { success: false, error: 'An invitation is already pending for this email' };
  }

  // 8. Create invitation record (AC-3.2.6)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      agency_id: agencyId,
      email: data.email,
      role: data.role,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (insertError || !invitation) {
    return { success: false, error: 'Failed to create invitation' };
  }

  // 9. Send invitation email via Supabase Auth admin API (AC-3.2.5)
  const serviceClient = createServiceClient();
  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    data: {
      agency_id: agencyId,
      role: data.role,
      invitation_id: invitation.id
    }
  });

  if (inviteError) {
    // Rollback invitation record on email failure
    await supabase.from('invitations').delete().eq('id', invitation.id);
    return { success: false, error: 'Failed to send invitation email' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Resend invitation email
 * Per AC-3.2.8: Re-sends email and extends expiry to 7 days
 */
export async function resendInvitation(invitationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 2. Get user's role and agency_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'Failed to get user data' };
  }

  // 3. Verify admin role
  if (userData.role !== 'admin') {
    return { success: false, error: 'Only admins can resend invitations' };
  }

  // 4. Get invitation and verify it belongs to this agency
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('id, email, role, agency_id, status')
    .eq('id', invitationId)
    .single();

  if (inviteError || !invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.agency_id !== userData.agency_id) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.status !== 'pending') {
    return { success: false, error: 'Invitation is no longer pending' };
  }

  // 5. Update expires_at to 7 days from now
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  const { error: updateError } = await supabase
    .from('invitations')
    .update({ expires_at: newExpiresAt.toISOString() })
    .eq('id', invitationId);

  if (updateError) {
    return { success: false, error: 'Failed to update invitation' };
  }

  // 6. Re-send email via Supabase Auth admin API
  const serviceClient = createServiceClient();
  const { error: emailError } = await serviceClient.auth.admin.inviteUserByEmail(invitation.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    data: {
      agency_id: invitation.agency_id,
      role: invitation.role,
      invitation_id: invitation.id
    }
  });

  if (emailError) {
    return { success: false, error: 'Failed to resend invitation email' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Cancel invitation
 * Per AC-3.2.9: Marks invitation as cancelled
 */
export async function cancelInvitation(invitationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 2. Get user's role and agency_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { success: false, error: 'Failed to get user data' };
  }

  // 3. Verify admin role
  if (userData.role !== 'admin') {
    return { success: false, error: 'Only admins can cancel invitations' };
  }

  // 4. Get invitation and verify it belongs to this agency
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('id, agency_id, status')
    .eq('id', invitationId)
    .single();

  if (inviteError || !invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.agency_id !== userData.agency_id) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.status !== 'pending') {
    return { success: false, error: 'Invitation is no longer pending' };
  }

  // 5. Update status to cancelled
  const { error: updateError } = await supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId);

  if (updateError) {
    return { success: false, error: 'Failed to cancel invitation' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Remove team member from agency
 * Per AC-3.3.2 to AC-3.3.5: Validates admin role, prevents self-removal, prevents removing last admin
 */
export async function removeTeamMember(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 2. Get current user's role and agency_id
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (currentUserError || !currentUser) {
    return { success: false, error: 'Failed to get user data' };
  }

  // 3. Verify admin role (AC-3.3.2)
  if (currentUser.role !== 'admin') {
    return { success: false, error: 'Only admins can remove team members' };
  }

  // 4. Prevent self-removal (AC-3.3.4)
  if (userId === user.id) {
    return { success: false, error: 'You cannot remove yourself from the agency' };
  }

  const agencyId = currentUser.agency_id;

  // 5. Get target user info and verify they belong to same agency
  const { data: targetUser, error: targetUserError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .eq('agency_id', agencyId)
    .single();

  if (targetUserError || !targetUser) {
    return { success: false, error: 'User not found in your agency' };
  }

  // 6. If removing an admin, check admin count (AC-3.3.5)
  if (targetUser.role === 'admin') {
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('role', 'admin');

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: 'Cannot remove the last admin. Promote another member to admin first.' };
    }
  }

  // 7. Delete user record from users table
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (deleteError) {
    return { success: false, error: 'Failed to remove user' };
  }

  // 8. Delete auth user via admin API
  const serviceClient = createServiceClient();
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    // Log error but don't fail - user record already deleted
    console.error('Failed to delete auth user:', authDeleteError);
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Change user role in agency
 * Per AC-3.3.5 to AC-3.3.7: Validates admin role, prevents self-role-change, prevents demoting last admin
 */
export async function changeUserRole(
  userId: string,
  newRole: 'admin' | 'member'
): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // 2. Get current user's role and agency_id
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (currentUserError || !currentUser) {
    return { success: false, error: 'Failed to get user data' };
  }

  // 3. Verify admin role (AC-3.3.6)
  if (currentUser.role !== 'admin') {
    return { success: false, error: 'Only admins can change user roles' };
  }

  // 4. Prevent self-role-change (AC-3.3.7)
  if (userId === user.id) {
    return { success: false, error: 'You cannot change your own role' };
  }

  const agencyId = currentUser.agency_id;

  // 5. Get target user's current role and verify they belong to same agency
  const { data: targetUser, error: targetUserError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .eq('agency_id', agencyId)
    .single();

  if (targetUserError || !targetUser) {
    return { success: false, error: 'User not found in your agency' };
  }

  // 6. If demoting admin to member, check admin count (AC-3.3.5)
  if (targetUser.role === 'admin' && newRole === 'member') {
    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('role', 'admin');

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: 'Cannot demote the last admin. Promote another member to admin first.' };
    }
  }

  // 7. Update role
  const { error: updateError } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to update role' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Get billing information for current user's agency
 * Per AC-3.4.1, AC-3.4.2: Returns tier, seat limit, current usage
 */
export async function getBillingInfo(): Promise<{
  tier: PlanTier;
  seatLimit: number;
  currentSeats: number;
  agencyName: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get user's agency
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.agency_id) {
    throw new Error('No agency found');
  }

  // Get agency details
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('name, subscription_tier, seat_limit')
    .eq('id', userData.agency_id)
    .single();

  if (agencyError || !agency) {
    throw new Error('Failed to load agency');
  }

  // Count current users
  const { count: currentSeats } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', userData.agency_id);

  return {
    tier: (agency.subscription_tier as PlanTier) || 'starter',
    seatLimit: agency.seat_limit ?? 3,
    currentSeats: currentSeats ?? 0,
    agencyName: agency.name ?? '',
  };
}

/**
 * Update agency subscription tier (internal/support use only for MVP)
 * Per AC-3.4.6: Admin can manually change tier, validates seat limits
 */
export async function updateSubscriptionTier(
  tier: PlanTier
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get current user's role and agency
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (currentUserError || !currentUser) {
    return { success: false, error: 'Failed to get user data' };
  }

  // Verify admin role
  if (currentUser.role !== 'admin') {
    return { success: false, error: 'Only admins can change subscription tier' };
  }

  const agencyId = currentUser.agency_id;

  // Get new seat limit from plan constants
  const newSeatLimit = getSeatLimit(tier);

  // Check current user count doesn't exceed new limit
  const { count: currentSeats } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  if ((currentSeats ?? 0) > newSeatLimit) {
    return {
      success: false,
      error: `Cannot downgrade to ${tier}. Current users (${currentSeats}) exceed the ${newSeatLimit} seat limit.`,
    };
  }

  // Update tier and seat limit
  const { error: updateError } = await supabase
    .from('agencies')
    .update({
      subscription_tier: tier,
      seat_limit: newSeatLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agencyId);

  if (updateError) {
    return { success: false, error: 'Failed to update subscription tier' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Get usage metrics for agency
 * Per AC-3.5.1 to AC-3.5.4: Returns documents, queries, active users, storage
 * Per AC-3.5.6: Returns null for non-admin users
 */
export async function getUsageMetrics(): Promise<UsageMetrics | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's agency and verify admin role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('agency_id, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.agency_id || userData.role !== 'admin') {
    return null;
  }

  const agencyId = userData.agency_id;

  // Calculate start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Calculate 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Documents all time (AC-3.5.1)
  const { count: docsAllTime } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);

  // Documents this month (AC-3.5.1)
  const { count: docsThisMonth } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gte('created_at', startOfMonth.toISOString());

  // Queries all time - count chat_messages with role='user' (AC-3.5.2)
  const { count: queriesAllTime } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('role', 'user');

  // Queries this month (AC-3.5.2)
  const { count: queriesThisMonth } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .eq('role', 'user')
    .gte('created_at', startOfMonth.toISOString());

  // Active users - distinct users with activity in last 7 days (AC-3.5.3)
  // Activity = uploaded document OR had conversation activity
  const { data: docUploaders } = await supabase
    .from('documents')
    .select('uploaded_by')
    .eq('agency_id', agencyId)
    .gte('created_at', sevenDaysAgo.toISOString());

  const { data: conversationUsers } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('agency_id', agencyId)
    .gte('updated_at', sevenDaysAgo.toISOString());

  const activeUserIds = new Set([
    ...(docUploaders?.map(d => d.uploaded_by) || []),
    ...(conversationUsers?.map(c => c.user_id) || []),
  ]);

  // Storage - sum from documents metadata (AC-3.5.4)
  const { data: storageData } = await supabase
    .from('documents')
    .select('metadata')
    .eq('agency_id', agencyId);

  let storageUsedBytes = 0;
  if (storageData) {
    for (const doc of storageData) {
      if (doc.metadata && typeof doc.metadata === 'object' && 'size' in doc.metadata) {
        storageUsedBytes += Number(doc.metadata.size) || 0;
      }
    }
  }

  return {
    documentsUploaded: {
      thisMonth: docsThisMonth ?? 0,
      allTime: docsAllTime ?? 0,
    },
    queriesAsked: {
      thisMonth: queriesThisMonth ?? 0,
      allTime: queriesAllTime ?? 0,
    },
    activeUsers: activeUserIds.size,
    storageUsedBytes,
  };
}
