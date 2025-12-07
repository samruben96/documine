/**
 * AI Buddy Prompt Builder
 * Story 14.2: API Route Structure
 *
 * System prompt construction for AI Buddy.
 * Stub implementation - actual prompt building in Epic 15.
 */

import type { UserPreferences, GuardrailConfig } from '@/types/ai-buddy';

export interface PromptContext {
  userPreferences?: UserPreferences;
  guardrailConfig?: GuardrailConfig;
  documentContext?: string;
  projectName?: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userContext: string;
}

/**
 * Build a system prompt for AI Buddy chat
 * @throws Error - Not implemented
 */
export function buildSystemPrompt(_context: PromptContext): BuiltPrompt {
  throw new Error('Not implemented - Prompt building deferred to Epic 15');
}

/**
 * Build the user context section of the prompt
 */
export function buildUserContext(preferences?: UserPreferences): string {
  if (!preferences) {
    return '';
  }

  const parts: string[] = [];

  if (preferences.displayName) {
    parts.push(`User: ${preferences.displayName}`);
  }
  if (preferences.role) {
    parts.push(`Role: ${preferences.role}`);
  }
  if (preferences.agencyName) {
    parts.push(`Agency: ${preferences.agencyName}`);
  }
  if (preferences.linesOfBusiness?.length) {
    parts.push(`Lines of business: ${preferences.linesOfBusiness.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Build the guardrail instructions section
 */
export function buildGuardrailInstructions(config?: GuardrailConfig): string {
  if (!config) {
    return '';
  }

  const parts: string[] = [];

  if (config.eandoDisclaimer) {
    parts.push('Include E&O disclaimer when providing advice.');
  }
  if (config.aiDisclosureEnabled && config.aiDisclosureMessage) {
    parts.push(`AI disclosure: ${config.aiDisclosureMessage}`);
  }
  if (config.customRules?.length) {
    parts.push('Custom rules:', ...config.customRules.map((r) => `- ${r}`));
  }

  return parts.join('\n');
}
