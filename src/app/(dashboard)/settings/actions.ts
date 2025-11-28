'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { profileSchema, agencySchema, inviteUserSchema } from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';

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
