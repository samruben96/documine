/**
 * Admin Onboarding Status API Endpoint
 * Story 18.4: Admin Onboarding Status
 *
 * AC-18.4.2: Returns user list with onboarding completion status
 * AC-18.4.5: Returns 403 for non-admin users
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  OnboardingStatusEntry,
  OnboardingStatusResponse,
  UserPreferences,
} from '@/types/ai-buddy';

export async function GET(): Promise<NextResponse> {
  // AC-18.4.5: Admin-only access
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();

  // Query users in the same agency
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, ai_buddy_preferences')
    .eq('agency_id', auth.agencyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[onboarding-status] Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }

  // AC-18.4.2, AC-18.4.3: Map users to OnboardingStatusEntry
  const statusEntries: OnboardingStatusEntry[] = (users || []).map((user) => {
    const preferences = user.ai_buddy_preferences as UserPreferences | null;

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      onboardingCompleted: preferences?.onboardingCompleted ?? false,
      onboardingCompletedAt: preferences?.onboardingCompletedAt ?? null,
      onboardingSkipped: preferences?.onboardingSkipped ?? false,
    };
  });

  const response: OnboardingStatusResponse = {
    users: statusEntries,
  };

  return NextResponse.json({ data: response, error: null });
}
