/**
 * AI Buddy Preferences Reset API Route
 * Story 18.2: Preferences Management
 *
 * POST /api/ai-buddy/preferences/reset - Reset preferences to defaults
 *
 * AC-18.2.9: Reset confirmation endpoint
 * AC-18.2.10: Resets all preferences to defaults
 * AC-18.2.11: Sets onboardingCompleted=false to trigger onboarding re-display
 *
 * Uses verify-then-service pattern per architecture.md
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserPreferences } from '@/types/ai-buddy';
import type { Json } from '@/types/database.types';

// Default preferences for reset (matches DEFAULT_USER_PREFERENCES)
const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: undefined,
  role: undefined,
  linesOfBusiness: [],
  favoriteCarriers: [],
  agencyName: undefined,
  licensedStates: [],
  communicationStyle: 'professional',
  onboardingCompleted: false,
  onboardingCompletedAt: undefined,
  onboardingSkipped: false,
  onboardingSkippedAt: undefined,
};

/**
 * POST /api/ai-buddy/preferences/reset
 * Reset user's AI Buddy preferences to defaults
 *
 * Response:
 * {
 *   data: {
 *     preferences: UserPreferences;
 *   }
 * }
 */
export async function POST(): Promise<Response> {
  try {
    // Step 1: Verify user with anon client (respects RLS)
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Step 2: Use service client for UPDATE (bypasses RLS per verify-then-service pattern)
    const serviceClient = createServiceClient();

    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        ai_buddy_preferences: DEFAULT_PREFERENCES as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to reset preferences:', updateError);
      return NextResponse.json(
        { error: { code: 'RESET_ERROR', message: 'Failed to reset preferences' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { preferences: DEFAULT_PREFERENCES } });
  } catch (error) {
    console.error('Preferences reset error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
