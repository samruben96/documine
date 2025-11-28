'use server';

import { createClient } from '@/lib/supabase/server';
import { profileSchema, agencySchema } from '@/lib/validations/auth';

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
