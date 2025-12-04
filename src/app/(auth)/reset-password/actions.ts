'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { passwordSchema } from '@/lib/validations/auth';
import { log } from '@/lib/utils/logger';

/**
 * Request password reset - sends email with reset link
 * Per AC-2.5.1:
 * - Always return success (security: don't reveal if email exists)
 * - Supabase handles email sending and token generation
 *
 * Per AC-2.5.2:
 * - Redirect URL points to /reset-password/update for callback handling
 * - Reset link valid for 1 hour (Supabase default)
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  const supabase = await createClient();

  // Redirect to auth callback which handles code exchange server-side
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`;

  // Always return success regardless of whether email exists
  // This prevents email enumeration attacks
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  // Log reset request (no PII)
  log.info('Password reset requested');

  return { success: true };
}

/**
 * Update password after clicking reset link
 * Per AC-2.5.4: Validate password strength server-side
 * Per AC-2.5.6: Redirect to /login?reset=success on success
 */
export async function updatePassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Validate password strength
  const validation = passwordSchema.safeParse(newPassword);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid password',
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('[Auth] Password update failed:', error.message);

    // Handle specific error cases
    if (error.message.includes('expired') || error.message.includes('invalid')) {
      return {
        success: false,
        error: 'This reset link has expired. Please request a new one.',
      };
    }

    return {
      success: false,
      error: 'Failed to update password. Please try again.',
    };
  }

  // Log success
  log.info('Password updated successfully');

  redirect('/login?reset=success');
}
