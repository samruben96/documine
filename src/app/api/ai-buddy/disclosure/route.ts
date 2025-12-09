/**
 * AI Disclosure API Route
 * Story 19.4: AI Disclosure Message
 *
 * GET - Retrieve AI disclosure message for display in chat
 *
 * AC-19.4.4: Load disclosure for display to users
 * AC-19.4.6: Return null when no disclosure configured
 *
 * This is a public endpoint for authenticated users (not admin-only)
 * to fetch their agency's disclosure message for display in the chat UI.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_AGENCY_GUARDRAILS } from '@/types/ai-buddy';

/**
 * GET /api/ai-buddy/disclosure
 *
 * Retrieve AI disclosure message for the current user's agency.
 * Returns null if no disclosure is configured or if disabled.
 *
 * Response:
 * {
 *   data: {
 *     aiDisclosureMessage: string | null,
 *     aiDisclosureEnabled: boolean
 *   }
 * }
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's agency
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.agency_id) {
    return NextResponse.json({ error: 'User not found or no agency' }, { status: 400 });
  }

  // Load guardrails for the agency (NO CACHING - FR37)
  const { data: guardrails, error: guardrailsError } = await supabase
    .from('ai_buddy_guardrails')
    .select('ai_disclosure_message, ai_disclosure_enabled')
    .eq('agency_id', userData.agency_id)
    .maybeSingle();

  if (guardrailsError) {
    console.error('Failed to load disclosure:', guardrailsError);
    return NextResponse.json({ error: guardrailsError.message }, { status: 500 });
  }

  // If no guardrails configured, return defaults
  if (!guardrails) {
    return NextResponse.json({
      data: {
        aiDisclosureMessage: DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage,
        aiDisclosureEnabled: DEFAULT_AGENCY_GUARDRAILS.aiDisclosureEnabled,
      },
    });
  }

  return NextResponse.json({
    data: {
      aiDisclosureMessage: guardrails.ai_disclosure_message ?? null,
      aiDisclosureEnabled: guardrails.ai_disclosure_enabled ?? true,
    },
  });
}
