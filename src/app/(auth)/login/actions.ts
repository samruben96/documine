'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Login server action
 * Per AC-2.3.3, AC-2.3.4:
 * 1. Validate form data with Zod
 * 2. Call supabase.auth.signInWithPassword({ email, password })
 * 3. Handle "Remember me" via session duration (Supabase default behavior)
 * 4. On success: redirect to ?redirect param or /documents
 * 5. On failure: return generic error (no field-specific errors for security)
 */
export async function login(
  formData: LoginFormData,
  redirectTo: string = '/documents'
): Promise<LoginResult> {
  // 1. Server-side validation
  const validationResult = loginSchema.safeParse(formData);
  if (!validationResult.success) {
    // Per AC-2.3.4: Generic error only
    return { success: false, error: 'Invalid email or password' };
  }

  const { email, password } = validationResult.data;

  // 2. Sign in with Supabase Auth
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Per AC-2.3.4: Generic error message only - never reveal if email exists
    // This prevents email enumeration attacks
    return { success: false, error: 'Invalid email or password' };
  }

  // 3. Success - redirect to specified path or /documents
  // Per AC-2.3.3: Use ?redirect query param if present
  redirect(redirectTo);
}

/**
 * Logout server action
 * Per AC-2.4.6: Clears session and redirects to /login
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
