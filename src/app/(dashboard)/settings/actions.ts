'use server';

import { createClient } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/validations/auth';

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
