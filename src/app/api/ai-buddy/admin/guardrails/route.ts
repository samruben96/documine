/**
 * AI Buddy Admin Guardrails API Route
 * Story 14.2: API Route Structure
 *
 * GET /api/ai-buddy/admin/guardrails - Get agency guardrails
 * PATCH /api/ai-buddy/admin/guardrails - Update agency guardrails
 * Admin only - requires configure_guardrails permission.
 * Stub implementation - actual guardrail management in Epic 19.
 */

import { notImplementedResponse } from '@/lib/ai-buddy';

/**
 * GET /api/ai-buddy/admin/guardrails
 * Get agency guardrail configuration
 *
 * Response:
 * {
 *   data: {
 *     guardrails: GuardrailConfig;
 *   }
 * }
 */
export async function GET(): Promise<Response> {
  return notImplementedResponse();
}

/**
 * PATCH /api/ai-buddy/admin/guardrails
 * Update agency guardrail configuration
 *
 * Request body (partial update):
 * {
 *   restrictedTopics?: RestrictedTopic[];
 *   customRules?: string[];
 *   eandoDisclaimer?: boolean;
 *   aiDisclosureMessage?: string;
 *   aiDisclosureEnabled?: boolean;
 *   restrictedTopicsEnabled?: boolean;
 * }
 *
 * Response:
 * {
 *   data: {
 *     guardrails: GuardrailConfig;
 *   }
 * }
 */
export async function PATCH(): Promise<Response> {
  return notImplementedResponse();
}
