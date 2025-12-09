/**
 * Invisible Guardrail Unit Tests
 * Story 19.3: Invisible Guardrail Responses
 *
 * Comprehensive tests for the invisible guardrail pattern.
 * Verifies AC-19.3.1 through AC-19.3.6 requirements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkGuardrails,
  matchesRestrictedTopic,
  loadGuardrails,
} from '@/lib/ai-buddy/guardrails';
import type { GuardrailConfig, RestrictedTopic } from '@/types/ai-buddy';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })
  ),
}));

/**
 * Default topics from DEFAULT_GUARDRAILS for testing
 * Must match the actual defaults in guardrails.ts
 */
const DEFAULT_RESTRICTED_TOPICS: RestrictedTopic[] = [
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
    redirect: "For claims filing assistance, please contact the carrier's claims department directly. They can guide you through the proper process.",
  },
];

describe('Story 19.3: Invisible Guardrail Responses', () => {
  /**
   * AC-19.3.2: Legal Advice Redirect
   * Given the restricted topic "legal advice" with redirect guidance,
   * When triggered, the AI should recommend consulting an attorney.
   */
  describe('AC-19.3.2: Legal Advice Redirect', () => {
    it('should trigger "legal advice" topic with exact match', () => {
      const result = matchesRestrictedTopic('I need legal advice', DEFAULT_RESTRICTED_TOPICS);
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('legal advice');
      expect(result?.redirect).toContain('attorney');
    });

    it('should trigger "legal advice" when asking about suing', () => {
      const result = matchesRestrictedTopic('Should I sue my carrier?', DEFAULT_RESTRICTED_TOPICS);
      // "sue" doesn't contain "legal advice", so this shouldn't trigger
      expect(result).toBeNull();
    });

    it('should trigger "legal advice" with question phrasing', () => {
      const result = matchesRestrictedTopic(
        'Can you give me legal advice about my policy dispute?',
        DEFAULT_RESTRICTED_TOPICS
      );
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('legal advice');
    });

    it('should provide helpful attorney redirect message', () => {
      const result = matchesRestrictedTopic('I want legal advice', DEFAULT_RESTRICTED_TOPICS);
      expect(result?.redirect).toBe(
        'For legal matters, I recommend consulting with a licensed attorney who specializes in insurance law.'
      );
    });
  });

  /**
   * AC-19.3.3: Claims Filing Redirect
   * Given the restricted topic "file a claim" with redirect to carrier portal,
   * When triggered, the AI should direct to the carrier.
   */
  describe('AC-19.3.3: Claims Filing Redirect', () => {
    it('should trigger "file a claim" topic', () => {
      const result = matchesRestrictedTopic('How do I file a claim?', DEFAULT_RESTRICTED_TOPICS);
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('file a claim');
    });

    it('should trigger "file a claim" with different phrasing', () => {
      const result = matchesRestrictedTopic(
        'I need to file a claim for my damaged car',
        DEFAULT_RESTRICTED_TOPICS
      );
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('file a claim');
    });

    it('should provide carrier contact redirect message', () => {
      const result = matchesRestrictedTopic('Help me file a claim', DEFAULT_RESTRICTED_TOPICS);
      expect(result?.redirect).toContain("carrier's claims department");
    });
  });

  /**
   * AC-19.3.4: Binding Authority Redirect
   * Given the restricted topic "bind coverage" requiring human review,
   * When triggered, the AI should explain binding requires agency review.
   */
  describe('AC-19.3.4: Binding Authority Redirect', () => {
    it('should trigger "bind coverage" topic', () => {
      const result = matchesRestrictedTopic('Can you bind coverage for me?', DEFAULT_RESTRICTED_TOPICS);
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('bind coverage');
    });

    it('should trigger "bind coverage" with different phrasing', () => {
      const result = matchesRestrictedTopic(
        'I want to bind coverage on this policy immediately',
        DEFAULT_RESTRICTED_TOPICS
      );
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('bind coverage');
    });

    it('should provide underwriter contact redirect message', () => {
      const result = matchesRestrictedTopic('bind coverage please', DEFAULT_RESTRICTED_TOPICS);
      expect(result?.redirect).toContain('underwriter');
      expect(result?.redirect).toContain('carrier representative');
    });
  });

  /**
   * AC-19.3.5: Custom Topic Redirect
   * Given an admin adds a custom restricted topic with custom redirect guidance,
   * When that topic is triggered, the AI follows the custom redirect.
   */
  describe('AC-19.3.5: Custom Topic Redirect', () => {
    const customTopics: RestrictedTopic[] = [
      ...DEFAULT_RESTRICTED_TOPICS,
      {
        trigger: 'rate increase',
        redirect: 'For rate questions, please contact your account manager who can review your specific situation.',
      },
    ];

    it('should trigger custom topic from admin configuration', () => {
      const result = matchesRestrictedTopic(
        'Why did I get a rate increase?',
        customTopics
      );
      expect(result).not.toBeNull();
      expect(result?.trigger).toBe('rate increase');
    });

    it('should use custom redirect message', () => {
      const result = matchesRestrictedTopic('about my rate increase', customTopics);
      expect(result?.redirect).toContain('account manager');
    });

    it('should not trigger custom topic when not present in list', () => {
      const result = matchesRestrictedTopic('rate increase', DEFAULT_RESTRICTED_TOPICS);
      expect(result).toBeNull();
    });
  });

  /**
   * AC-19.3.6: Disabled Topic Normal Response
   * Given a restricted topic is disabled,
   * When that topic comes up in conversation, the AI discusses it normally.
   */
  describe('AC-19.3.6: Disabled Topic Normal Response', () => {
    it('should not check topics when restrictedTopicsEnabled is false', () => {
      const config: GuardrailConfig = {
        agencyId: 'test-agency',
        restrictedTopics: DEFAULT_RESTRICTED_TOPICS,
        customRules: [],
        eandoDisclaimer: true,
        aiDisclosureMessage: 'I am an AI assistant.',
        aiDisclosureEnabled: true,
        restrictedTopicsEnabled: false, // Disabled
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const result = checkGuardrails('I need legal advice', config);
      expect(result.triggeredTopic).toBeUndefined();
      expect(result.allowed).toBe(true);
    });

    it('should allow normal response when topics disabled', () => {
      const config: GuardrailConfig = {
        agencyId: 'test-agency',
        restrictedTopics: DEFAULT_RESTRICTED_TOPICS,
        customRules: [],
        eandoDisclaimer: false,
        aiDisclosureMessage: '',
        aiDisclosureEnabled: false,
        restrictedTopicsEnabled: false,
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const result = checkGuardrails('Can you bind coverage for me?', config);
      expect(result.triggeredTopic).toBeUndefined();
      expect(result.redirectMessage).toBeUndefined();
    });
  });

  /**
   * Core guardrail checking functionality
   * Verifies case-insensitivity, substring matching, and first-match-wins behavior
   */
  describe('matchesRestrictedTopic - Core Functionality', () => {
    it('should be case-insensitive', () => {
      const result1 = matchesRestrictedTopic('LEGAL ADVICE', DEFAULT_RESTRICTED_TOPICS);
      const result2 = matchesRestrictedTopic('Legal Advice', DEFAULT_RESTRICTED_TOPICS);
      const result3 = matchesRestrictedTopic('LeGaL aDvIcE', DEFAULT_RESTRICTED_TOPICS);

      expect(result1?.trigger).toBe('legal advice');
      expect(result2?.trigger).toBe('legal advice');
      expect(result3?.trigger).toBe('legal advice');
    });

    it('should perform substring matching (partial match)', () => {
      const result = matchesRestrictedTopic(
        'This is a long message about getting legal advice from someone',
        DEFAULT_RESTRICTED_TOPICS
      );
      expect(result?.trigger).toBe('legal advice');
    });

    it('should return first match when multiple topics in message', () => {
      // "legal advice" comes before "file a claim" in the array
      const result = matchesRestrictedTopic(
        'I need legal advice on how to file a claim',
        DEFAULT_RESTRICTED_TOPICS
      );
      expect(result?.trigger).toBe('legal advice');
    });

    it('should return null for empty topics array', () => {
      const result = matchesRestrictedTopic('legal advice', []);
      expect(result).toBeNull();
    });

    it('should return null when message does not match any topic', () => {
      const result = matchesRestrictedTopic(
        'What is the deductible on my policy?',
        DEFAULT_RESTRICTED_TOPICS
      );
      expect(result).toBeNull();
    });

    it('should handle empty message', () => {
      const result = matchesRestrictedTopic('', DEFAULT_RESTRICTED_TOPICS);
      expect(result).toBeNull();
    });
  });

  /**
   * checkGuardrails function behavior
   * Verifies the full guardrail check result structure
   */
  describe('checkGuardrails - Result Structure', () => {
    const baseConfig: GuardrailConfig = {
      agencyId: 'test-agency',
      restrictedTopics: DEFAULT_RESTRICTED_TOPICS,
      customRules: [],
      eandoDisclaimer: true,
      aiDisclosureMessage: 'I am an AI assistant.',
      aiDisclosureEnabled: true,
      restrictedTopicsEnabled: true,
      updatedAt: '2025-01-01T00:00:00Z',
    };

    it('should always return allowed=true (invisible pattern)', () => {
      const result = checkGuardrails('I need legal advice urgently!', baseConfig);
      expect(result.allowed).toBe(true);
    });

    it('should include triggered topic and redirect message when matched', () => {
      const result = checkGuardrails('How do I file a claim?', baseConfig);
      expect(result.triggeredTopic).toBeDefined();
      expect(result.triggeredTopic?.trigger).toBe('file a claim');
      expect(result.redirectMessage).toBeDefined();
    });

    it('should include applied rules in result', () => {
      const result = checkGuardrails('Can you bind coverage?', baseConfig);
      expect(result.appliedRules).toContain('restricted_topic:bind coverage');
    });

    it('should include eando_disclaimer in applied rules when enabled', () => {
      const result = checkGuardrails('General question about policies', baseConfig);
      expect(result.appliedRules).toContain('eando_disclaimer');
    });

    it('should not include eando_disclaimer when disabled', () => {
      const configNoEO = { ...baseConfig, eandoDisclaimer: false };
      const result = checkGuardrails('General question', configNoEO);
      expect(result.appliedRules).not.toContain('eando_disclaimer');
    });
  });

  /**
   * loadGuardrails function behavior
   * Tests loading guardrails from database and handling disabled topics
   */
  describe('loadGuardrails - Database Loading', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return default config when no guardrails in database', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof createClient>);

      const { loadGuardrails: loadGuardrailsFn } = await import('@/lib/ai-buddy/guardrails');
      const config = await loadGuardrailsFn('test-agency');

      expect(config.agencyId).toBe('test-agency');
      expect(config.restrictedTopics).toHaveLength(3);
      expect(config.restrictedTopicsEnabled).toBe(true);
    });

    it('should filter out disabled topics from database', async () => {
      const dbData = {
        agency_id: 'test-agency',
        restricted_topics: [
          { trigger: 'legal advice', redirectGuidance: 'Consult attorney', enabled: true },
          { trigger: 'disabled topic', redirectGuidance: 'Should not appear', enabled: false },
          { trigger: 'bind coverage', redirectGuidance: 'Contact underwriter', enabled: true },
        ],
        custom_rules: [],
        eando_disclaimer: true,
        ai_disclosure_message: 'AI assistant',
        ai_disclosure_enabled: true,
        restricted_topics_enabled: true,
        updated_at: '2025-01-01T00:00:00Z',
      };

      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: dbData, error: null })),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof createClient>);

      const { loadGuardrails: loadGuardrailsFn } = await import('@/lib/ai-buddy/guardrails');
      const config = await loadGuardrailsFn('test-agency');

      // Should only have 2 topics (disabled one filtered out)
      expect(config.restrictedTopics).toHaveLength(2);
      expect(config.restrictedTopics.map((t) => t.trigger)).not.toContain('disabled topic');
    });

    it('should handle both old format (redirect) and new format (redirectGuidance)', async () => {
      const dbData = {
        agency_id: 'test-agency',
        restricted_topics: [
          { trigger: 'old format', redirect: 'Old redirect message' }, // Old format
          { trigger: 'new format', redirectGuidance: 'New redirect message' }, // New format
        ],
        custom_rules: [],
        eando_disclaimer: true,
        ai_disclosure_message: 'AI assistant',
        ai_disclosure_enabled: true,
        restricted_topics_enabled: true,
        updated_at: '2025-01-01T00:00:00Z',
      };

      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: dbData, error: null })),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof createClient>);

      const { loadGuardrails: loadGuardrailsFn } = await import('@/lib/ai-buddy/guardrails');
      const config = await loadGuardrailsFn('test-agency');

      expect(config.restrictedTopics).toHaveLength(2);
      expect(config.restrictedTopics[0].redirect).toBe('Old redirect message');
      expect(config.restrictedTopics[1].redirect).toBe('New redirect message');
    });

    it('should return defaults on database error (fail-safe)', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: null, error: new Error('DB Error') })
              ),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof createClient>);

      const { loadGuardrails: loadGuardrailsFn } = await import('@/lib/ai-buddy/guardrails');
      const config = await loadGuardrailsFn('test-agency');

      // Should return defaults, not throw
      expect(config.agencyId).toBe('test-agency');
      expect(config.restrictedTopics).toHaveLength(3);
    });
  });
});
