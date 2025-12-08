/**
 * Guardrails Unit Tests
 * Story 15.5: AI Response Quality & Attribution
 *
 * Tests for guardrail checking functions.
 * AC15-AC20: Invisible guardrail enforcement
 */

import { describe, it, expect } from 'vitest';
import {
  checkGuardrails,
  matchesRestrictedTopic,
  type GuardrailCheckResult,
} from '@/lib/ai-buddy/guardrails';
import type { GuardrailConfig, RestrictedTopic } from '@/types/ai-buddy';

describe('matchesRestrictedTopic', () => {
  const restrictedTopics: RestrictedTopic[] = [
    { trigger: 'legal advice', redirect: 'Consult an attorney.' },
    { trigger: 'bind coverage', redirect: 'Contact your underwriter.' },
    { trigger: 'file a claim', redirect: 'Contact the carrier claims department.' },
  ];

  it('should return null when message does not match any topic', () => {
    const result = matchesRestrictedTopic('What is general liability?', restrictedTopics);
    expect(result).toBeNull();
  });

  it('should return the matching topic for exact match', () => {
    const result = matchesRestrictedTopic('I need legal advice', restrictedTopics);
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe('legal advice');
  });

  it('should match case-insensitively', () => {
    const result = matchesRestrictedTopic('Can you give me LEGAL ADVICE?', restrictedTopics);
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe('legal advice');
  });

  it('should match partial substring', () => {
    const result = matchesRestrictedTopic(
      'How do I bind coverage for my client?',
      restrictedTopics
    );
    expect(result).not.toBeNull();
    expect(result?.trigger).toBe('bind coverage');
  });

  it('should return first match when multiple topics apply', () => {
    const topics: RestrictedTopic[] = [
      { trigger: 'coverage', redirect: 'First redirect.' },
      { trigger: 'bind coverage', redirect: 'Second redirect.' },
    ];
    const result = matchesRestrictedTopic('How to bind coverage?', topics);
    expect(result?.trigger).toBe('coverage'); // First match wins
  });
});

describe('checkGuardrails', () => {
  const baseConfig: GuardrailConfig = {
    agencyId: 'test-agency',
    restrictedTopics: [
      { trigger: 'legal advice', redirect: 'Consult an attorney.' },
      { trigger: 'bind coverage', redirect: 'Contact your underwriter.' },
    ],
    customRules: ['Always recommend professional review'],
    eandoDisclaimer: true,
    aiDisclosureMessage: 'I am an AI assistant.',
    aiDisclosureEnabled: true,
    restrictedTopicsEnabled: true,
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('should always return allowed=true (AC18: never block)', () => {
    const result = checkGuardrails('I need legal advice', baseConfig);
    expect(result.allowed).toBe(true);
  });

  it('should return triggered topic when message matches restricted topic', () => {
    const result = checkGuardrails('Can you provide legal advice?', baseConfig);
    expect(result.triggeredTopic).toBeDefined();
    expect(result.triggeredTopic?.trigger).toBe('legal advice');
    expect(result.redirectMessage).toBe('Consult an attorney.');
  });

  it('should include applied rules for triggered topic', () => {
    const result = checkGuardrails('How do I bind coverage?', baseConfig);
    expect(result.appliedRules).toContain('restricted_topic:bind coverage');
  });

  it('should include E&O disclaimer in applied rules when enabled', () => {
    const result = checkGuardrails('What is general liability?', baseConfig);
    expect(result.appliedRules).toContain('eando_disclaimer');
  });

  it('should not include E&O disclaimer when disabled', () => {
    const configWithoutEO = { ...baseConfig, eandoDisclaimer: false };
    const result = checkGuardrails('What is general liability?', configWithoutEO);
    expect(result.appliedRules).not.toContain('eando_disclaimer');
  });

  it('should not check restricted topics when disabled', () => {
    const configDisabled = { ...baseConfig, restrictedTopicsEnabled: false };
    const result = checkGuardrails('I need legal advice', configDisabled);
    expect(result.triggeredTopic).toBeUndefined();
  });

  it('should include custom rules in applied rules when matched', () => {
    const config: GuardrailConfig = {
      ...baseConfig,
      customRules: ['professional review'],
    };
    const result = checkGuardrails(
      'Should I get a professional review of this policy?',
      config
    );
    expect(result.appliedRules).toContain('custom_rule:professional review');
  });

  it('should return empty applied rules array when no rules match', () => {
    const config: GuardrailConfig = {
      ...baseConfig,
      eandoDisclaimer: false,
      customRules: [],
      restrictedTopicsEnabled: false,
    };
    const result = checkGuardrails('Hello', config);
    expect(result.appliedRules).toEqual([]);
  });
});

describe('Guardrails AC Requirements', () => {
  const config: GuardrailConfig = {
    agencyId: 'test-agency',
    restrictedTopics: [
      { trigger: 'legal advice', redirect: 'For legal matters, consult an attorney.' },
    ],
    customRules: [],
    eandoDisclaimer: true,
    aiDisclosureMessage: 'I am an AI assistant.',
    aiDisclosureEnabled: true,
    restrictedTopicsEnabled: true,
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('AC15: Never blocks - always returns allowed=true', () => {
    // Even for restricted topics
    const result = checkGuardrails('Give me legal advice now!', config);
    expect(result.allowed).toBe(true);
  });

  it('AC16: Provides helpful redirects for restricted topics', () => {
    const result = checkGuardrails('I need legal advice about my policy', config);
    expect(result.redirectMessage).toBe('For legal matters, consult an attorney.');
  });

  it('AC18: Guardrail enforcement is invisible (redirects, not blocks)', () => {
    const result = checkGuardrails('Can you give legal advice?', config);
    // The function returns a redirect message, not a block
    expect(result.allowed).toBe(true);
    expect(result.triggeredTopic).toBeDefined();
    expect(result.redirectMessage).toBeDefined();
    // The actual "invisible" enforcement happens in prompt-builder.ts
    // which uses this result to modify the system prompt
  });
});
