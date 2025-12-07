/**
 * AI Buddy Guardrails
 * Story 14.2: API Route Structure
 *
 * Guardrail checking functions for AI Buddy.
 * Stub implementation - actual guardrail enforcement in Epic 19.
 */

import type { GuardrailConfig, RestrictedTopic } from '@/types/ai-buddy';

export interface GuardrailCheckResult {
  allowed: boolean;
  triggeredTopic?: RestrictedTopic;
  redirectMessage?: string;
}

/**
 * Check if a message violates any guardrails
 * @throws Error - Not implemented
 */
export async function checkGuardrails(
  _agencyId: string,
  _message: string
): Promise<GuardrailCheckResult> {
  throw new Error('Not implemented - Guardrail checking deferred to Epic 19');
}

/**
 * Get guardrail configuration for an agency
 * @throws Error - Not implemented
 */
export async function getGuardrailConfig(
  _agencyId: string
): Promise<GuardrailConfig | null> {
  throw new Error('Not implemented - Guardrail config retrieval deferred to Epic 19');
}

/**
 * Update guardrail configuration for an agency
 * @throws Error - Not implemented
 */
export async function updateGuardrailConfig(
  _agencyId: string,
  _config: Partial<GuardrailConfig>
): Promise<GuardrailConfig> {
  throw new Error('Not implemented - Guardrail config update deferred to Epic 19');
}

/**
 * Check if a topic matches any restricted patterns
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
