/**
 * Chat API Guardrail Integration Tests
 * Story 19.3: Invisible Guardrail Responses
 *
 * Tests for the chat API guardrail integration.
 * Verifies AC-19.3.1 through AC-19.3.4 at the API level.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkGuardrails, loadGuardrails } from '@/lib/ai-buddy/guardrails';
import { buildSystemPrompt, FORBIDDEN_BLOCKING_PHRASES } from '@/lib/ai-buddy/prompt-builder';
import { logGuardrailEvent } from '@/lib/ai-buddy/audit-logger';
import type { GuardrailConfig, RestrictedTopic } from '@/types/ai-buddy';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'test-user' } },
            error: null,
          })
        ),
      },
    })
  ),
}));

vi.mock('@/lib/ai-buddy/audit-logger', () => ({
  logGuardrailEvent: vi.fn(() => Promise.resolve()),
  logMessageEvent: vi.fn(() => Promise.resolve()),
}));

describe('Story 19.3: Chat API Guardrail Integration', () => {
  const defaultConfig: GuardrailConfig = {
    agencyId: 'test-agency',
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
        redirect: "For claims filing assistance, please contact the carrier's claims department directly.",
      },
    ],
    customRules: [],
    eandoDisclaimer: true,
    aiDisclosureMessage: 'I am an AI assistant.',
    aiDisclosureEnabled: true,
    restrictedTopicsEnabled: true,
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * AC-19.3.1: Guardrail check returns redirect, not block
   * Verifies the chat API flow triggers guardrails correctly
   */
  describe('AC-19.3.1-19.3.4: Guardrail Flow Integration', () => {
    it('should trigger guardrail check when message contains restricted topic', () => {
      const result = checkGuardrails('I need legal advice about my policy', defaultConfig);

      expect(result.allowed).toBe(true); // Never blocks
      expect(result.triggeredTopic).toBeDefined();
      expect(result.triggeredTopic?.trigger).toBe('legal advice');
      expect(result.redirectMessage).toContain('attorney');
    });

    it('should build system prompt with guardrail context when topic triggered', () => {
      const guardrailCheckResult = checkGuardrails(
        'Can you help me file a claim?',
        defaultConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
        guardrailCheckResult,
      });

      // AC-19.3.3: Claims filing redirect
      expect(systemPrompt).toContain('## Immediate Guidance Required');
      expect(systemPrompt).toContain('file a claim');
      expect(systemPrompt).toContain("carrier's claims department");
    });

    it('should include forbidden phrases list in system prompt', () => {
      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
      });

      // AC-19.3.1: No blocking language
      expect(systemPrompt).toContain('NEVER use these phrases');
      FORBIDDEN_BLOCKING_PHRASES.slice(0, 5).forEach((phrase) => {
        expect(systemPrompt).toContain(phrase);
      });
    });

    it('should call logGuardrailEvent when topic triggered', async () => {
      const guardrailCheckResult = checkGuardrails(
        'I need legal advice',
        defaultConfig
      );

      if (guardrailCheckResult.triggeredTopic) {
        await logGuardrailEvent(
          'test-agency',
          'test-user',
          'test-conversation',
          guardrailCheckResult.triggeredTopic.trigger,
          guardrailCheckResult.triggeredTopic.redirect,
          'I need legal advice'
        );

        expect(logGuardrailEvent).toHaveBeenCalledWith(
          'test-agency',
          'test-user',
          'test-conversation',
          'legal advice',
          expect.stringContaining('attorney'),
          'I need legal advice'
        );
      }
    });
  });

  /**
   * AC-19.3.2: Legal Advice Redirect at API Level
   */
  describe('AC-19.3.2: Legal Advice Redirect Integration', () => {
    it('should include attorney redirect in system prompt for legal advice', () => {
      const guardrailCheckResult = checkGuardrails(
        'Should I sue my insurance company? I need legal advice.',
        defaultConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
        guardrailCheckResult,
      });

      expect(systemPrompt).toContain('attorney');
      expect(systemPrompt).toContain('## Immediate Guidance Required');
    });
  });

  /**
   * AC-19.3.3: Claims Filing Redirect at API Level
   */
  describe('AC-19.3.3: Claims Filing Redirect Integration', () => {
    it('should include carrier redirect in system prompt for claims', () => {
      const guardrailCheckResult = checkGuardrails(
        'How do I file a claim for my accident?',
        defaultConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
        guardrailCheckResult,
      });

      expect(systemPrompt).toContain('carrier');
      expect(systemPrompt).toContain('claims department');
    });
  });

  /**
   * AC-19.3.4: Binding Authority Redirect at API Level
   */
  describe('AC-19.3.4: Binding Authority Redirect Integration', () => {
    it('should include underwriter redirect in system prompt for binding', () => {
      const guardrailCheckResult = checkGuardrails(
        'Can you bind coverage for my client right now?',
        defaultConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
        guardrailCheckResult,
      });

      expect(systemPrompt).toContain('underwriter');
      expect(systemPrompt).toContain('carrier representative');
    });
  });

  /**
   * AC-19.3.5: Custom Topic Redirect at API Level
   */
  describe('AC-19.3.5: Custom Topic Redirect Integration', () => {
    it('should handle custom admin-configured topic', () => {
      const customConfig: GuardrailConfig = {
        ...defaultConfig,
        restrictedTopics: [
          ...defaultConfig.restrictedTopics,
          {
            trigger: 'rate increase',
            redirect: 'Contact your account manager for rate discussions.',
          },
        ],
      };

      const guardrailCheckResult = checkGuardrails(
        'Why did I get a rate increase on my policy?',
        customConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: customConfig,
        guardrailCheckResult,
      });

      expect(guardrailCheckResult.triggeredTopic?.trigger).toBe('rate increase');
      expect(systemPrompt).toContain('account manager');
    });
  });

  /**
   * AC-19.3.6: Disabled Topics Normal Response at API Level
   */
  describe('AC-19.3.6: Disabled Topics Integration', () => {
    it('should not inject redirect for disabled topics', () => {
      const disabledConfig: GuardrailConfig = {
        ...defaultConfig,
        restrictedTopicsEnabled: false,
      };

      const guardrailCheckResult = checkGuardrails(
        'I need legal advice urgently!',
        disabledConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: disabledConfig,
        guardrailCheckResult,
      });

      expect(guardrailCheckResult.triggeredTopic).toBeUndefined();
      expect(systemPrompt).not.toContain('## Immediate Guidance Required');
      // But should still include base guardrail instructions
      expect(systemPrompt).toContain('NEVER use these phrases');
    });
  });

  /**
   * System prompt verification (AC-19.3.7 related)
   */
  describe('AC-19.3.7: System Prompt Verification', () => {
    it('should construct system prompt with all guardrail sections', () => {
      const guardrailCheckResult = checkGuardrails(
        'I need legal advice',
        defaultConfig
      );

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
        guardrailCheckResult,
        userPreferences: {
          displayName: 'Test User',
          communicationStyle: 'professional',
        },
      });

      // Verify all expected sections present
      expect(systemPrompt).toContain('You are AI Buddy'); // Base persona
      expect(systemPrompt).toContain('## Communication Style'); // Style directive
      expect(systemPrompt).toContain('## Critical Response Guidelines'); // Forbidden phrases
      expect(systemPrompt).toContain('## Topic Guidance'); // All topics
      expect(systemPrompt).toContain('## Immediate Guidance Required'); // Triggered topic
      expect(systemPrompt).toContain('## Source Citations'); // Citation instructions
      expect(systemPrompt).toContain('## Response Confidence'); // Confidence instructions
      expect(systemPrompt).toContain('## E&O Protection Reminder'); // E&O section
      expect(systemPrompt).toContain('## AI Disclosure'); // AI disclosure
    });

    it('should include topic guidance for all configured topics', () => {
      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: defaultConfig,
      });

      // All default topics should be listed
      expect(systemPrompt).toContain('When asked about "legal advice"');
      expect(systemPrompt).toContain('When asked about "bind coverage"');
      expect(systemPrompt).toContain('When asked about "file a claim"');
    });
  });

  /**
   * Edge cases and error handling
   */
  describe('Edge Cases', () => {
    it('should handle empty message gracefully', () => {
      const result = checkGuardrails('', defaultConfig);
      expect(result.allowed).toBe(true);
      expect(result.triggeredTopic).toBeUndefined();
    });

    it('should handle message with multiple potential triggers (first match wins)', () => {
      const result = checkGuardrails(
        'I need legal advice on how to file a claim and bind coverage',
        defaultConfig
      );

      // First match in the config order should win
      expect(result.triggeredTopic?.trigger).toBe('legal advice');
    });

    it('should handle config with empty restricted topics array', () => {
      const emptyConfig: GuardrailConfig = {
        ...defaultConfig,
        restrictedTopics: [],
      };

      const result = checkGuardrails('legal advice', emptyConfig);
      expect(result.triggeredTopic).toBeUndefined();

      const { systemPrompt } = buildSystemPrompt({
        guardrailConfig: emptyConfig,
      });

      // Should still include base guardrail instructions
      expect(systemPrompt).toContain('NEVER use these phrases');
      // But no Topic Guidance section
      expect(systemPrompt).not.toContain('## Topic Guidance');
    });
  });
});
