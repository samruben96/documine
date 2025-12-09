/**
 * Guardrails Admin API Routes
 * Story 19.1: Guardrail Admin UI
 *
 * GET - Retrieve agency guardrails configuration
 * PATCH - Update agency guardrails configuration
 *
 * All endpoints require admin authentication via requireAdminAuth()
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import type {
  AgencyGuardrails,
  ExtendedRestrictedTopic,
  CustomGuardrailRule,
} from '@/types/ai-buddy';
import {
  DEFAULT_RESTRICTED_TOPICS,
  DEFAULT_CUSTOM_RULES,
  DEFAULT_AGENCY_GUARDRAILS,
} from '@/types/ai-buddy';
import type { Json } from '@/types/database.types';

/**
 * Map database row to AgencyGuardrails type
 */
function mapDbToGuardrails(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  agencyId: string
): AgencyGuardrails {
  // Parse restricted topics - handle both old and new formats
  let restrictedTopics: ExtendedRestrictedTopic[] = DEFAULT_RESTRICTED_TOPICS;
  if (data?.restricted_topics && Array.isArray(data.restricted_topics)) {
    restrictedTopics = (data.restricted_topics as unknown[]).map((topic, index) => {
      // Handle old format {trigger, redirect}
      const t = topic as Record<string, unknown>;
      if ('redirect' in t && !('redirectGuidance' in t)) {
        return {
          id: (t.id as string) || `migrated-${index}`,
          trigger: (t.trigger as string) || '',
          description: (t.description as string) || undefined,
          redirectGuidance: (t.redirect as string) || '',
          enabled: t.enabled !== false,
          isBuiltIn: (t.isBuiltIn as boolean) ?? false,
          createdAt: (t.createdAt as string) || new Date().toISOString(),
          createdBy: t.createdBy as string | undefined,
        };
      }
      // New format
      return {
        id: (t.id as string) || `topic-${index}`,
        trigger: (t.trigger as string) || '',
        description: (t.description as string) || undefined,
        redirectGuidance: (t.redirectGuidance as string) || '',
        enabled: t.enabled !== false,
        isBuiltIn: (t.isBuiltIn as boolean) ?? false,
        createdAt: (t.createdAt as string) || new Date().toISOString(),
        createdBy: t.createdBy as string | undefined,
      };
    });
  }

  // Parse custom rules - handle both old (string[]) and new formats
  let customRules: CustomGuardrailRule[] = DEFAULT_CUSTOM_RULES;
  if (data?.custom_rules && Array.isArray(data.custom_rules)) {
    if (data.custom_rules.length > 0) {
      const firstRule = data.custom_rules[0];
      if (typeof firstRule === 'string') {
        // Old format - array of strings, convert to rules
        customRules = DEFAULT_CUSTOM_RULES.map((rule) => ({
          ...rule,
          enabled: true,
        }));
      } else {
        // New format - array of CustomGuardrailRule objects
        customRules = (data.custom_rules as unknown[]).map((rule, index) => {
          const r = rule as Record<string, unknown>;
          return {
            id: (r.id as string) || `rule-${index}`,
            name: (r.name as string) || '',
            description: (r.description as string) || '',
            promptInjection: (r.promptInjection as string) || '',
            enabled: r.enabled !== false,
            isBuiltIn: (r.isBuiltIn as boolean) ?? false,
          };
        });
      }
    }
  }

  return {
    agencyId,
    restrictedTopics,
    customRules,
    eandoDisclaimer: data?.eando_disclaimer ?? true,
    aiDisclosureMessage: data?.ai_disclosure_message ?? DEFAULT_AGENCY_GUARDRAILS.aiDisclosureMessage,
    aiDisclosureEnabled: data?.ai_disclosure_enabled ?? true,
    restrictedTopicsEnabled: data?.restricted_topics_enabled ?? true,
    updatedAt: data?.updated_at ?? new Date().toISOString(),
  };
}

/**
 * GET /api/ai-buddy/admin/guardrails
 *
 * Retrieve guardrails configuration for the admin's agency.
 * Returns defaults if no guardrails are configured.
 *
 * AC-19.1.1: Returns guardrails for admin
 * AC-19.1.2: Returns default topics if none configured
 * AC-19.1.12: Returns 403 for non-admin
 */
export async function GET(): Promise<NextResponse> {
  // Check admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();

  // Load guardrails (NO CACHING - FR37 immediate effect)
  const { data, error } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', auth.agencyId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load guardrails:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map to typed response
  const guardrails = mapDbToGuardrails(data, auth.agencyId);

  return NextResponse.json({ data: { guardrails } });
}

/**
 * PATCH /api/ai-buddy/admin/guardrails
 *
 * Update guardrails configuration for the admin's agency.
 * Supports partial updates - only updates provided fields.
 *
 * AC-19.1.10: Changes persisted immediately
 * AC-19.1.11: Immediate effect (no cache)
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  // Check admin authentication
  const auth = await requireAdminAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let updates: Partial<AgencyGuardrails>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Fetch existing guardrails
  const { data: existing } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', auth.agencyId)
    .maybeSingle();

  // Build update payload - only include changed fields
  // Upsert using service client (verify-then-service pattern)
  const restrictedTopicsValue = (updates.restrictedTopics !== undefined
    ? updates.restrictedTopics
    : existing?.restricted_topics) ?? null;
  const customRulesValue = (updates.customRules !== undefined
    ? updates.customRules
    : existing?.custom_rules) ?? null;

  const { error: upsertError } = await serviceClient
    .from('ai_buddy_guardrails')
    .upsert({
      agency_id: auth.agencyId,
      updated_at: new Date().toISOString(),
      restricted_topics: restrictedTopicsValue as unknown as Json,
      custom_rules: customRulesValue as unknown as Json,
      eando_disclaimer: updates.eandoDisclaimer !== undefined
        ? updates.eandoDisclaimer
        : (existing?.eando_disclaimer ?? true),
      ai_disclosure_message: updates.aiDisclosureMessage !== undefined
        ? updates.aiDisclosureMessage
        : (existing?.ai_disclosure_message ?? null),
      ai_disclosure_enabled: updates.aiDisclosureEnabled !== undefined
        ? updates.aiDisclosureEnabled
        : (existing?.ai_disclosure_enabled ?? true),
      restricted_topics_enabled: updates.restrictedTopicsEnabled !== undefined
        ? updates.restrictedTopicsEnabled
        : (existing?.restricted_topics_enabled ?? true),
    }, { onConflict: 'agency_id' });

  if (upsertError) {
    console.error('Failed to update guardrails:', upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Log the change to audit log
  await serviceClient.from('ai_buddy_audit_logs').insert({
    agency_id: auth.agencyId,
    user_id: auth.userId,
    action: 'guardrails_updated',
    metadata: { changes: Object.keys(updates) },
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

  const guardrails = mapDbToGuardrails(updatedData, auth.agencyId);

  return NextResponse.json({ data: { guardrails } });
}
