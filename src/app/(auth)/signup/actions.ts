'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';

export interface SignupResult {
  success: boolean;
  error?: string;
}

/**
 * Signup server action
 * Per AC-2.1.5, AC-2.1.6, AC-2.2.1 through AC-2.2.5:
 * 1. Validate form data with Zod
 * 2. Call supabase.auth.signUp({ email, password })
 * 3. Create agency record (name, tier='starter', seat_limit=3)
 * 4. Create user record (id, agency_id, email, full_name, role='admin')
 * 5. Handle errors (duplicate email, generic)
 * 6. Atomic operation - both succeed or both fail
 */
export async function signup(formData: SignupFormData): Promise<SignupResult> {
  // 1. Server-side validation
  const validationResult = signupSchema.safeParse(formData);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError?.message || 'Validation failed' };
  }

  const { email, password, fullName, agencyName } = validationResult.data;

  // Use user client for auth signup (creates session via cookies)
  const supabase = await createClient();

  // 2. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    // Handle specific Supabase auth errors per AC-2.1.6
    if (authError.message.includes('User already registered')) {
      return { success: false, error: 'An account with this email already exists' };
    }
    return { success: false, error: 'Something went wrong. Please try again.' };
  }

  if (!authData.user) {
    return { success: false, error: 'Something went wrong. Please try again.' };
  }

  const authUserId = authData.user.id;

  // Use service client for admin operations (bypasses RLS for initial setup)
  const serviceClient = createServiceClient();

  // 3 & 4. Atomic agency and user creation
  // Per AC-2.2.4: Both succeed or both fail
  // Per AC-2.2.5: If record creation fails, clean up auth user

  try {
    // Create agency record
    // Per AC-2.2.1: tier='starter', seat_limit=3
    const { data: agency, error: agencyError } = await serviceClient
      .from('agencies')
      .insert({
        name: agencyName,
        subscription_tier: 'starter',
        seat_limit: 3,
      })
      .select('id')
      .single();

    if (agencyError || !agency) {
      // Rollback: Delete auth user
      await serviceClient.auth.admin.deleteUser(authUserId);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }

    // Create user record
    // Per AC-2.2.2: id matches auth.users.id
    // Per AC-2.2.3: First user gets role='admin'
    const { error: userError } = await serviceClient
      .from('users')
      .insert({
        id: authUserId,
        agency_id: agency.id,
        email,
        full_name: fullName,
        role: 'admin',
      });

    if (userError) {
      // Rollback: Delete agency and auth user
      await serviceClient.from('agencies').delete().eq('id', agency.id);
      await serviceClient.auth.admin.deleteUser(authUserId);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }

    // Success! Redirect to /documents per AC-2.1.5
    // Note: Session is already established via the signUp call
  } catch {
    // Unexpected error - attempt cleanup
    try {
      await serviceClient.auth.admin.deleteUser(authUserId);
    } catch {
      // Cleanup failed, log but don't expose to user
    }
    return { success: false, error: 'Something went wrong. Please try again.' };
  }

  redirect('/documents');
}
