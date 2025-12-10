/**
 * Guardrails Reset API Route
 * Story 19.1: Guardrail Admin UI
 *
 * POST - Reset guardrails to defaults
 *
 * Supports resetting specific sections or all guardrails.
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import {
  DEFAULT_RESTRICTED_TOPICS,
  DEFAULT_CUSTOM_RULES,
  DEFAULT_AGENCY_GUARDRAILS,
} from '@/types/ai-buddy';
import type { Json } from '@/types/database.types';

type ResetSection = 'restrictedTopics' | 'customRules' | 'aiDisclosure' | 'all';

interface ResetRequestBody {
  section: ResetSection;
}

/**
 * POST /api/ai-buddy/admin/guardrails/reset
 *
 * Reset guardrails to defaults.
 * Supports resetting specific sections or all guardrails.
 *
 * Body:
 *   section: 'restrictedTopics' | 'customRules' | 'aiDisclosure' | 'all'
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Check admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: ResetRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { section } = body;
  if (!section || !['restrictedTopics', 'customRules', 'aiDisclosure', 'all'].includes(section)) {
    return NextResponse.json(
      { error: 'section must be one of: restrictedTopics, customRules, aiDisclosure, all' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Fetch existing guardrails
  const { data: existing } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', auth.agencyId)
    .maybeSingle();

  // Build update payload based on section
  let restricted_topics: Json;
  let restricted_topics_enabled: boolean;
  let custom_rules: Json;
  let eando_disclaimer: boolean;
  let ai_disclosure_message: string | null;
  let ai_disclosure_enabled: boolean;

  switch (section) {
    case 'restrictedTopics':
      restricted_topics = DEFAULT_RESTRICTED_TOPICS as unknown as Json;
      restricted_topics_enabled = true;
      // Preserve other fields
      custom_rules = (existing?.custom_rules ?? DEFAULT_CUSTOM_RULES) as Json;
      eando_disclaimer = existing?.eando_disclaimer ?? true;
      ai_disclosure_message = existing?.ai_disclosure_message ?? DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage;
      ai_disclosure_enabled = existing?.ai_disclosure_enabled ?? true;
      break;

    case 'customRules':
      custom_rules = DEFAULT_CUSTOM_RULES as unknown as Json;
      eando_disclaimer = true;
      // Preserve other fields
      restricted_topics = (existing?.restricted_topics ?? DEFAULT_RESTRICTED_TOPICS) as Json;
      restricted_topics_enabled = existing?.restricted_topics_enabled ?? true;
      ai_disclosure_message = existing?.ai_disclosure_message ?? DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage;
      ai_disclosure_enabled = existing?.ai_disclosure_enabled ?? true;
      break;

    case 'aiDisclosure':
      ai_disclosure_message = DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage;
      ai_disclosure_enabled = true;
      // Preserve other fields
      restricted_topics = (existing?.restricted_topics ?? DEFAULT_RESTRICTED_TOPICS) as Json;
      restricted_topics_enabled = existing?.restricted_topics_enabled ?? true;
      custom_rules = (existing?.custom_rules ?? DEFAULT_CUSTOM_RULES) as Json;
      eando_disclaimer = existing?.eando_disclaimer ?? true;
      break;

    case 'all':
    default:
      restricted_topics = DEFAULT_RESTRICTED_TOPICS as unknown as Json;
      restricted_topics_enabled = true;
      custom_rules = DEFAULT_CUSTOM_RULES as unknown as Json;
      eando_disclaimer = true;
      ai_disclosure_message = DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage;
      ai_disclosure_enabled = true;
      break;
  }

  // Upsert using service client
  const { error: upsertError } = await serviceClient
    .from('ai_buddy_guardrails')
    .upsert({
      agency_id: auth.agencyId,
      updated_at: new Date().toISOString(),
      restricted_topics,
      restricted_topics_enabled,
      custom_rules,
      eando_disclaimer,
      ai_disclosure_message,
      ai_disclosure_enabled,
    }, { onConflict: 'agency_id' });

  if (upsertError) {
    console.error('Failed to reset guardrails:', upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Log the change to audit log
  await serviceClient.from('agency_audit_logs').insert({
    agency_id: auth.agencyId,
    user_id: auth.userId,
    action: 'guardrails_reset',
    metadata: { section },
  });

  // Fetch updated guardrails to return
  const { data: updatedData, error: fetchError } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', auth.agencyId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch updated guardrails:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Import mapDbToGuardrails pattern (simplified inline version)
  const guardrails = {
    agencyId: auth.agencyId,
    restrictedTopics: updatedData.restricted_topics ?? DEFAULT_RESTRICTED_TOPICS,
    customRules: updatedData.custom_rules ?? DEFAULT_CUSTOM_RULES,
    eandoDisclaimer: updatedData.eando_disclaimer ?? true,
    aiDisclosureMessage: updatedData.ai_disclosure_message ?? DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage,
    aiDisclosureEnabled: updatedData.ai_disclosure_enabled ?? true,
    restrictedTopicsEnabled: updatedData.restricted_topics_enabled ?? true,
    updatedAt: updatedData.updated_at,
  };

  return NextResponse.json({ data: { guardrails, resetSection: section } });
}
