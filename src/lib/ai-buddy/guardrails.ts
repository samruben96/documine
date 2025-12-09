/**
 * AI Buddy Guardrails
 * Story 15.5: AI Response Quality & Attribution
 *
 * Guardrail loading and checking functions for AI Buddy.
 * Implements AC15-AC20: Invisible guardrail enforcement.
 *
 * Key principles:
 * - AC15: Never say "I cannot", "blocked", "restricted"
 * - AC16: Provide helpful redirects for restricted topics
 * - AC18: Guardrail enforcement is invisible to users
 * - AC19: Log guardrail events to audit table
 * - AC20: Changes apply immediately (no cache)
 */

import { createClient } from '@/lib/supabase/server';
import type { GuardrailConfig, RestrictedTopic } from '@/types/ai-buddy';

export interface GuardrailCheckResult {
  allowed: boolean;
  triggeredTopic?: RestrictedTopic;
  redirectMessage?: string;
  appliedRules: string[];
}

/**
 * Default guardrail configuration when none exists for agency
 * Provides sensible defaults for E&O protection
 */
const DEFAULT_GUARDRAILS: Omit<GuardrailConfig, 'agencyId' | 'updatedAt'> = {
  restrictedTopics: [
    {
      trigger: 'legal advice',
      redirect: 'For legal matters, I recommend consulting with a licensed attorney who specializes in insurance law.',
    },
    {
      trigger: 'bind coverage',
      redirect: 'Binding authority requires direct carrier authorization. Please contact your underwriter or carrier representative.',
    },
    {
      trigger: 'file a claim',
      redirect: 'For claims filing assistance, please contact the carrier\'s claims department directly. They can guide you through the proper process.',
    },
  ],
  customRules: [],
  eandoDisclaimer: true,
  aiDisclosureMessage: 'I am an AI assistant. For definitive coverage determinations, please verify with the carrier.',
  aiDisclosureEnabled: true,
  restrictedTopicsEnabled: true,
};

/**
 * Load guardrail configuration for an agency
 * AC20: No caching - always fetch fresh from database
 *
 * @param agencyId - The agency to load guardrails for
 * @returns GuardrailConfig or default config if none exists
 */
export async function loadGuardrails(agencyId: string): Promise<GuardrailConfig> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_buddy_guardrails')
    .select('*')
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load guardrails:', error);
    // Return default config on error - fail safe
    return {
      agencyId,
      ...DEFAULT_GUARDRAILS,
      updatedAt: new Date().toISOString(),
    };
  }

  if (!data) {
    // No guardrails configured - return defaults
    return {
      agencyId,
      ...DEFAULT_GUARDRAILS,
      updatedAt: new Date().toISOString(),
    };
  }

  // Map database columns to GuardrailConfig
  // Handle both old format (trigger/redirect) and new format (trigger/redirectGuidance)
  const rawTopics = data.restricted_topics as unknown[];
  const mappedTopics: RestrictedTopic[] = rawTopics
    ? rawTopics.map((t) => {
        const topic = t as Record<string, unknown>;
        // Check if topic is enabled (default true if not specified)
        const isEnabled = topic.enabled !== false;
        if (!isEnabled) return null; // Skip disabled topics

        return {
          trigger: (topic.trigger as string) || '',
          // Handle both old format (redirect) and new format (redirectGuidance)
          redirect: (topic.redirectGuidance as string) || (topic.redirect as string) || '',
        };
      }).filter((t): t is RestrictedTopic => t !== null && t.trigger !== '' && t.redirect !== '')
    : DEFAULT_GUARDRAILS.restrictedTopics;

  // Map custom rules - handle both old (string[]) and new (CustomGuardrailRule[]) formats
  const rawRules = data.custom_rules as unknown[];
  let mappedRules: string[] = [];
  if (rawRules && rawRules.length > 0) {
    const firstRule = rawRules[0];
    if (typeof firstRule === 'string') {
      // Old format - array of strings
      mappedRules = rawRules as string[];
    } else {
      // New format - array of CustomGuardrailRule objects
      // Extract promptInjection from enabled rules only
      mappedRules = rawRules
        .filter((r) => {
          const rule = r as Record<string, unknown>;
          return rule.enabled !== false;
        })
        .map((r) => {
          const rule = r as Record<string, unknown>;
          return (rule.promptInjection as string) || '';
        })
        .filter((s) => s !== '');
    }
  }

  return {
    agencyId: data.agency_id,
    restrictedTopics: mappedTopics,
    customRules: mappedRules,
    eandoDisclaimer: data.eando_disclaimer ?? true,
    aiDisclosureMessage: data.ai_disclosure_message ?? DEFAULT_GUARDRAILS.aiDisclosureMessage,
    aiDisclosureEnabled: data.ai_disclosure_enabled ?? (data.ai_disclosure_message != null),
    restrictedTopicsEnabled: data.restricted_topics_enabled ?? true,
    updatedAt: data.updated_at,
  };
}

/**
 * Check if a message triggers any guardrails
 * AC15: Never block - always provide helpful redirects
 * AC18: Enforcement is invisible (redirects, not blocks)
 *
 * @param message - The user message to check
 * @param config - The guardrail configuration
 * @returns GuardrailCheckResult with redirect info if triggered
 */
export function checkGuardrails(
  message: string,
  config: GuardrailConfig
): GuardrailCheckResult {
  const appliedRules: string[] = [];

  // Check restricted topics if enabled
  if (config.restrictedTopicsEnabled) {
    const triggeredTopic = matchesRestrictedTopic(message, config.restrictedTopics);
    if (triggeredTopic) {
      appliedRules.push(`restricted_topic:${triggeredTopic.trigger}`);
      return {
        allowed: true, // AC18: Always allowed, just with redirect
        triggeredTopic,
        redirectMessage: triggeredTopic.redirect,
        appliedRules,
      };
    }
  }

  // Check custom rules
  for (const rule of config.customRules) {
    if (message.toLowerCase().includes(rule.toLowerCase())) {
      appliedRules.push(`custom_rule:${rule}`);
    }
  }

  // Add E&O disclaimer rule if enabled
  if (config.eandoDisclaimer) {
    appliedRules.push('eando_disclaimer');
  }

  return {
    allowed: true,
    appliedRules,
  };
}

/**
 * Check if a topic matches any restricted patterns
 * Case-insensitive substring matching
 */
export function matchesRestrictedTopic(
  message: string,
  topics: RestrictedTopic[]
): RestrictedTopic | null {
  const lowerMessage = message.toLowerCase();
  for (const topic of topics) {
    if (lowerMessage.includes(topic.trigger.toLowerCase())) {
      return topic;
    }
  }
  return null;
}

/**
 * Get guardrail configuration for an agency (alias for loadGuardrails)
 * Maintained for backward compatibility with existing code
 */
export async function getGuardrailConfig(
  agencyId: string
): Promise<GuardrailConfig | null> {
  return loadGuardrails(agencyId);
}

/**
 * Update guardrail configuration for an agency
 * AC20: Changes apply immediately
 */
export async function updateGuardrailConfig(
  agencyId: string,
  config: Partial<GuardrailConfig>,
  updatedBy: string
): Promise<GuardrailConfig> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  if (config.restrictedTopics !== undefined) {
    updateData.restricted_topics = config.restrictedTopics;
  }
  if (config.customRules !== undefined) {
    updateData.custom_rules = config.customRules;
  }
  if (config.eandoDisclaimer !== undefined) {
    updateData.eando_disclaimer = config.eandoDisclaimer;
  }
  if (config.aiDisclosureMessage !== undefined) {
    updateData.ai_disclosure_message = config.aiDisclosureMessage;
  }

  const { data, error } = await supabase
    .from('ai_buddy_guardrails')
    .upsert({
      agency_id: agencyId,
      ...updateData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guardrails: ${error.message}`);
  }

  return {
    agencyId: data.agency_id,
    restrictedTopics: data.restricted_topics as unknown as RestrictedTopic[],
    customRules: data.custom_rules as unknown as string[],
    eandoDisclaimer: data.eando_disclaimer ?? true,
    aiDisclosureMessage: data.ai_disclosure_message ?? '',
    aiDisclosureEnabled: data.ai_disclosure_message != null,
    restrictedTopicsEnabled: true,
    updatedAt: data.updated_at,
  };
}
