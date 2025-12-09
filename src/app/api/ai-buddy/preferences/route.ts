/**
 * AI Buddy User Preferences API Route
 * Story 18.1: Onboarding Flow & Guided Start
 *
 * GET /api/ai-buddy/preferences - Get user preferences
 * PATCH /api/ai-buddy/preferences - Update user preferences (partial update)
 *
 * Uses verify-then-service pattern for PATCH per architecture.md:
 * 1. Verify user auth with anon client (respects RLS)
 * 2. Perform UPDATE with service client (bypasses RLS)
 *
 * Data stored in users.ai_buddy_preferences JSONB column.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserPreferences } from '@/types/ai-buddy';
import type { Json } from '@/types/database.types';

/**
 * GET /api/ai-buddy/preferences
 * Get user's AI Buddy preferences merged with defaults
 *
 * Response:
 * {
 *   data: {
 *     preferences: UserPreferences;
 *   }
 * }
 */
export async function GET(): Promise<Response> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Fetch user record with preferences
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('ai_buddy_preferences')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch preferences:', fetchError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch preferences' } },
        { status: 500 }
      );
    }

    // Merge stored preferences with defaults
    const storedPreferences = (userData?.ai_buddy_preferences as UserPreferences) || {};
    const preferences: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES_OBJ,
      ...storedPreferences,
    };

    return NextResponse.json({ data: { preferences } });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai-buddy/preferences
 * Update user's AI Buddy preferences (partial update)
 * Uses verify-then-service pattern per architecture.md
 *
 * Request body (any subset of UserPreferences):
 * {
 *   displayName?: string;
 *   role?: 'producer' | 'csr' | 'manager' | 'other';
 *   linesOfBusiness?: string[];
 *   favoriteCarriers?: string[];
 *   communicationStyle?: 'professional' | 'casual';
 *   agencyName?: string;
 *   licensedStates?: string[];
 *   onboardingCompleted?: boolean;
 *   onboardingCompletedAt?: string;
 *   onboardingSkipped?: boolean;
 *   onboardingSkippedAt?: string;
 * }
 *
 * Response:
 * {
 *   data: {
 *     preferences: UserPreferences;
 *   }
 * }
 */
export async function PATCH(request: NextRequest): Promise<Response> {
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

    // Parse request body
    let updates: Partial<UserPreferences>;
    try {
      updates = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
        { status: 400 }
      );
    }

    // Validate updates (basic type checks)
    if (updates.role && !['producer', 'csr', 'manager', 'other'].includes(updates.role)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ROLE', message: 'Invalid role value' } },
        { status: 400 }
      );
    }

    if (updates.communicationStyle && !['professional', 'casual'].includes(updates.communicationStyle)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STYLE', message: 'Invalid communication style' } },
        { status: 400 }
      );
    }

    // Fetch current preferences
    const { data: userData } = await supabase
      .from('users')
      .select('ai_buddy_preferences')
      .eq('id', user.id)
      .maybeSingle();

    const currentPreferences = (userData?.ai_buddy_preferences as UserPreferences) || {};

    // Merge updates with current preferences
    const updatedPreferences: UserPreferences = {
      ...currentPreferences,
      ...updates,
    };

    // Step 2: Use service client for UPDATE (bypasses RLS per verify-then-service pattern)
    const serviceClient = createServiceClient();

    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        ai_buddy_preferences: updatedPreferences as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update preferences:', updateError);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update preferences' } },
        { status: 500 }
      );
    }

    // Return merged preferences with defaults
    const finalPreferences: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES_OBJ,
      ...updatedPreferences,
    };

    return NextResponse.json({ data: { preferences: finalPreferences } });
  } catch (error) {
    console.error('Preferences PATCH error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// Default preferences object (mirrors DEFAULT_USER_PREFERENCES from types)
const DEFAULT_USER_PREFERENCES_OBJ: UserPreferences = {
  linesOfBusiness: [],
  favoriteCarriers: [],
  communicationStyle: 'professional',
  onboardingCompleted: false,
};
