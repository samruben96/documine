/**
 * Tests for Personalized Greeting Generation
 * Story 18.1: Onboarding Flow & Guided Start
 */

import { describe, it, expect } from 'vitest';
import {
  generatePersonalizedGreeting,
  getSuggestionsForLOB,
  getInitialAIMessage,
} from '@/lib/ai-buddy/personalized-greeting';
import type { UserPreferences } from '@/types/ai-buddy';

describe('generatePersonalizedGreeting', () => {
  it('returns generic greeting when preferences is null', () => {
    const result = generatePersonalizedGreeting(null);

    expect(result.message).toContain("I'm AI Buddy");
    expect(result.suggestions).toHaveLength(4);
  });

  it('returns generic greeting when preferences is undefined', () => {
    const result = generatePersonalizedGreeting(undefined);

    expect(result.message).toContain("I'm AI Buddy");
  });

  it('returns generic greeting when onboarding not completed', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      onboardingCompleted: false,
    };

    const result = generatePersonalizedGreeting(preferences);

    expect(result.message).toContain("I'm AI Buddy");
    expect(result.message).not.toContain('John');
  });

  it('AC-18.1.6: includes name in greeting when onboarding is completed', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      onboardingCompleted: true,
    };

    const result = generatePersonalizedGreeting(preferences);

    expect(result.message).toContain('Hi John!');
  });

  it('AC-18.1.6: includes LOB reference when onboarding is completed', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      linesOfBusiness: ['Personal Auto'],
      onboardingCompleted: true,
    };

    const result = generatePersonalizedGreeting(preferences);

    expect(result.message).toContain('Personal Auto');
  });

  it('includes role context for producer', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      role: 'producer',
      onboardingCompleted: true,
    };

    const result = generatePersonalizedGreeting(preferences);

    expect(result.message).toContain('producer');
  });

  it('includes role context for csr', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      role: 'csr',
      onboardingCompleted: true,
    };

    const result = generatePersonalizedGreeting(preferences);

    expect(result.message).toContain('client questions');
  });

  it('AC-18.1.7: returns LOB-specific suggestions', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      linesOfBusiness: ['Personal Auto'],
      onboardingCompleted: true,
    };

    const result = generatePersonalizedGreeting(preferences);

    // Should have Personal Auto specific suggestions
    expect(result.suggestions.some((s) => s.toLowerCase().includes('auto') || s.toLowerCase().includes('coverage'))).toBe(true);
  });

  it('returns generic suggestions when no LOB is specified', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      linesOfBusiness: [],
      onboardingCompleted: true,
    };

    const result = generatePersonalizedGreeting(preferences);

    // Should have generic suggestions
    expect(result.suggestions).toContain('Help me understand a policy document');
  });
});

describe('getSuggestionsForLOB', () => {
  it('returns Personal Auto suggestions', () => {
    const suggestions = getSuggestionsForLOB('Personal Auto');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.toLowerCase().includes('coverage') || s.toLowerCase().includes('auto'))).toBe(true);
  });

  it('returns Homeowners suggestions', () => {
    const suggestions = getSuggestionsForLOB('Homeowners');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.toLowerCase().includes('dwelling') || s.toLowerCase().includes('homeowners'))).toBe(true);
  });

  it('returns Workers Compensation suggestions', () => {
    const suggestions = getSuggestionsForLOB('Workers Compensation');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.toLowerCase().includes('workers') || s.toLowerCase().includes('comp'))).toBe(true);
  });

  it('returns generic suggestions for unknown LOB', () => {
    const suggestions = getSuggestionsForLOB('Unknown LOB');

    expect(suggestions).toContain('Help me understand a policy document');
  });
});

describe('getInitialAIMessage', () => {
  it('formats greeting with numbered suggestions', () => {
    const preferences: UserPreferences = {
      displayName: 'John',
      linesOfBusiness: ['Personal Auto'],
      onboardingCompleted: true,
    };

    const message = getInitialAIMessage(preferences);

    expect(message).toContain('Hi John!');
    expect(message).toContain('1.');
    expect(message).toContain('2.');
    expect(message).toContain('3.');
  });

  it('returns generic message for null preferences', () => {
    const message = getInitialAIMessage(null);

    expect(message).toContain("I'm AI Buddy");
    expect(message).toContain('1.');
  });
});
