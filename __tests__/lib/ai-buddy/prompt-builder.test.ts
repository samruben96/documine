/**
 * Prompt Builder Unit Tests
 * Story 15.5: AI Response Quality & Attribution
 * Story 18.3: Preference-Aware AI Responses
 *
 * Tests for system prompt construction with guardrails integration and user preferences.
 */

import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  buildUserContext,
  buildGuardrailInstructions,
  extractCitationsFromResponse,
  calculateConfidence,
  formatCarriersContext,
  formatLOBContext,
  formatStatesContext,
  formatCommunicationStyle,
  type DocumentContext,
} from '@/lib/ai-buddy/prompt-builder';
import type { UserPreferences, GuardrailConfig, Citation } from '@/types/ai-buddy';
import type { GuardrailCheckResult } from '@/lib/ai-buddy/guardrails';

describe('buildUserContext', () => {
  it('should return empty string for undefined preferences', () => {
    expect(buildUserContext(undefined)).toBe('');
  });

  it('should return empty string for empty preferences', () => {
    expect(buildUserContext({})).toBe('');
  });

  // Story 18.3: Updated format - now uses "Name:" instead of "User:"
  it('should include display name', () => {
    const prefs: UserPreferences = { displayName: 'John Doe' };
    expect(buildUserContext(prefs)).toContain('Name: John Doe');
  });

  it('should include role with label', () => {
    const prefs: UserPreferences = { role: 'producer' };
    expect(buildUserContext(prefs)).toContain('Role: Producer/Agent');
  });

  // Story 18.3: Updated format - now uses "You work at:" with richer context
  it('should include agency name', () => {
    const prefs: UserPreferences = { agencyName: 'ABC Insurance' };
    expect(buildUserContext(prefs)).toContain('You work at: ABC Insurance');
  });

  // Story 18.3: Updated format - now uses "You work primarily in:" with richer context
  it('should include lines of business', () => {
    const prefs: UserPreferences = {
      linesOfBusiness: ['Commercial', 'Personal Lines'],
    };
    expect(buildUserContext(prefs)).toContain(
      'You work primarily in: Commercial, Personal Lines'
    );
  });

  // Story 18.3: Updated format - now uses "Your preferred carriers:" with richer context
  it('should include favorite carriers', () => {
    const prefs: UserPreferences = {
      favoriteCarriers: ['Progressive', 'Travelers'],
    };
    expect(buildUserContext(prefs)).toContain(
      'Your preferred carriers: Progressive, Travelers'
    );
  });

  // Story 18.3: Communication style is now handled separately in buildSystemPrompt
  // This test is updated to reflect that communicationStyle alone doesn't produce output in buildUserContext
  it('should not include communication style in user context (handled separately)', () => {
    const prefs: UserPreferences = { communicationStyle: 'professional' };
    // Communication style is now part of the system prompt, not user context
    expect(buildUserContext(prefs)).toBe('');
  });
});

describe('buildGuardrailInstructions', () => {
  it('should return empty string for undefined config', () => {
    expect(buildGuardrailInstructions(undefined)).toBe('');
  });

  it('should include restricted topic guidance when enabled', () => {
    const config: GuardrailConfig = {
      agencyId: 'test',
      restrictedTopics: [
        { trigger: 'legal advice', redirect: 'Consult an attorney.' },
      ],
      customRules: [],
      eandoDisclaimer: false,
      aiDisclosureMessage: '',
      aiDisclosureEnabled: false,
      restrictedTopicsEnabled: true,
      updatedAt: '',
    };
    const result = buildGuardrailInstructions(config);
    expect(result).toContain('Topic Guidance');
    expect(result).toContain('legal advice');
    expect(result).toContain('Consult an attorney.');
  });

  it('should include custom rules', () => {
    const config: GuardrailConfig = {
      agencyId: 'test',
      restrictedTopics: [],
      customRules: ['Always recommend professional review'],
      eandoDisclaimer: false,
      aiDisclosureMessage: '',
      aiDisclosureEnabled: false,
      restrictedTopicsEnabled: false,
      updatedAt: '',
    };
    const result = buildGuardrailInstructions(config);
    expect(result).toContain('Agency-Specific Guidelines');
    expect(result).toContain('Always recommend professional review');
  });
});

describe('buildSystemPrompt', () => {
  it('should include base persona', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('AI Buddy');
    expect(systemPrompt).toContain('insurance agents');
  });

  it('should include guardrail base instructions', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('NEVER use these phrases');
    expect(systemPrompt).toContain('I cannot');
  });

  it('should include citation instructions', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('Source Citations');
    expect(systemPrompt).toContain('[📄 Document Name pg. X]');
  });

  it('should include confidence instructions', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('Response Confidence');
    expect(systemPrompt).toContain('HIGH CONFIDENCE');
    expect(systemPrompt).toContain('MEDIUM CONFIDENCE');
    expect(systemPrompt).toContain('LOW CONFIDENCE');
  });

  it('should include user context when preferences provided', () => {
    const { systemPrompt, userContext } = buildSystemPrompt({
      userPreferences: { displayName: 'Jane Doe', role: 'csr' },
    });
    expect(systemPrompt).toContain('User Context');
    expect(systemPrompt).toContain('Jane Doe');
    expect(userContext).toContain('Jane Doe');
  });

  it('should include E&O reminder when enabled', () => {
    const config: GuardrailConfig = {
      agencyId: 'test',
      restrictedTopics: [],
      customRules: [],
      eandoDisclaimer: true,
      aiDisclosureMessage: '',
      aiDisclosureEnabled: false,
      restrictedTopicsEnabled: false,
      updatedAt: '',
    };
    const { systemPrompt } = buildSystemPrompt({ guardrailConfig: config });
    expect(systemPrompt).toContain('E&O Protection Reminder');
  });

  it('should include AI disclosure when enabled', () => {
    const config: GuardrailConfig = {
      agencyId: 'test',
      restrictedTopics: [],
      customRules: [],
      eandoDisclaimer: false,
      aiDisclosureMessage: 'I am an AI assistant.',
      aiDisclosureEnabled: true,
      restrictedTopicsEnabled: false,
      updatedAt: '',
    };
    const { systemPrompt } = buildSystemPrompt({ guardrailConfig: config });
    expect(systemPrompt).toContain('AI Disclosure');
    expect(systemPrompt).toContain('I am an AI assistant.');
  });

  it('should include redirect guidance when guardrail triggered', () => {
    const checkResult: GuardrailCheckResult = {
      allowed: true,
      triggeredTopic: {
        trigger: 'legal advice',
        redirect: 'Consult an attorney.',
      },
      redirectMessage: 'Consult an attorney.',
      appliedRules: ['restricted_topic:legal advice'],
    };
    const { systemPrompt } = buildSystemPrompt({
      guardrailCheckResult: checkResult,
    });
    expect(systemPrompt).toContain('Immediate Guidance Required');
    expect(systemPrompt).toContain('legal advice');
    expect(systemPrompt).toContain('Consult an attorney.');
  });

  it('should include project context when provided', () => {
    const { systemPrompt } = buildSystemPrompt({
      projectName: 'Smith Account',
    });
    expect(systemPrompt).toContain('Project Context');
    expect(systemPrompt).toContain('Smith Account');
  });
});

describe('extractCitationsFromResponse', () => {
  const documents: DocumentContext[] = [
    {
      documentId: 'doc-1',
      documentName: 'Policy.pdf',
      chunks: [
        { content: 'The liability limit is $1,000,000.', page: 2 },
        { content: 'Deductible is $500.', page: 3 },
      ],
    },
    {
      documentId: 'doc-2',
      documentName: 'Coverage Summary.pdf',
      chunks: [{ content: 'Summary of all coverages.', page: 1 }],
    },
  ];

  it('should extract citations in format [📄 Document Name pg. X]', () => {
    const response =
      'The policy has a $1,000,000 limit [📄 Policy.pdf pg. 2].';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations).toHaveLength(1);
    expect(citations[0].documentId).toBe('doc-1');
    expect(citations[0].documentName).toBe('Policy.pdf');
    expect(citations[0].page).toBe(2);
  });

  it('should extract multiple citations', () => {
    const response =
      'Limit is $1M [📄 Policy.pdf pg. 2] and deductible is $500 [📄 Policy.pdf pg. 3].';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations).toHaveLength(2);
  });

  it('should extract citations without page numbers', () => {
    const response =
      'See the coverage summary [📄 Coverage Summary.pdf] for details.';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations).toHaveLength(1);
    expect(citations[0].page).toBe(1); // Defaults to 1
  });

  it('should deduplicate citations with same document and page', () => {
    const response =
      'Limit is $1M [📄 Policy.pdf pg. 2]. The limit [📄 Policy.pdf pg. 2] is confirmed.';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations).toHaveLength(1);
  });

  it('should return empty array when no citations found', () => {
    const response = 'General liability covers third-party claims.';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations).toHaveLength(0);
  });

  it('should ignore citations for documents not in context', () => {
    const response =
      'See details in [📄 Unknown Document.pdf pg. 1].';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations).toHaveLength(0);
  });

  it('should include text excerpt from chunk', () => {
    const response =
      'The liability limit is $1,000,000 [📄 Policy.pdf pg. 2].';
    const citations = extractCitationsFromResponse(response, documents);
    expect(citations[0].text).toContain('liability limit');
  });
});

describe('calculateConfidence', () => {
  it('should return "high" when has document context and citations (AC9)', () => {
    const citations: Citation[] = [
      { documentId: 'doc-1', documentName: 'Policy.pdf', page: 1, text: 'test' },
    ];
    const confidence = calculateConfidence(true, citations, 'The limit is $1M.');
    expect(confidence).toBe('high');
  });

  it('should return "medium" when no document context (AC10)', () => {
    const confidence = calculateConfidence(
      false,
      [],
      'General liability is a common coverage type.'
    );
    expect(confidence).toBe('medium');
  });

  it('should return "medium" when has document context but no citations', () => {
    const confidence = calculateConfidence(
      true,
      [],
      'I can help with that question.'
    );
    expect(confidence).toBe('medium');
  });

  it('should return "low" when response indicates unknown (AC11)', () => {
    const confidence = calculateConfidence(
      false,
      [],
      "I don't have information about that specific topic."
    );
    expect(confidence).toBe('low');
  });

  it('should detect various "unknown" phrases', () => {
    const unknownPhrases = [
      "I couldn't find that information",
      "I don't have enough information to answer",
      'No information available on that topic',
      'Not found in the documents',
      "I'm not sure about that",
    ];

    for (const phrase of unknownPhrases) {
      const confidence = calculateConfidence(false, [], phrase);
      expect(confidence).toBe('low');
    }
  });

  it('should prioritize "low" over other indicators', () => {
    // Even with citations, if response says "not found", it should be low
    const citations: Citation[] = [
      { documentId: 'doc-1', documentName: 'Policy.pdf', page: 1, text: 'test' },
    ];
    const confidence = calculateConfidence(
      true,
      citations,
      "I couldn't find information about coverage limits in the documents."
    );
    expect(confidence).toBe('low');
  });
});

describe('AC Requirements for Prompt Builder', () => {
  it('AC15: System prompt instructs AI to never say "I cannot"', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('NEVER use these phrases');
    expect(systemPrompt).toContain('"I cannot"');
    expect(systemPrompt).toContain('"I\'m not allowed"');
    expect(systemPrompt).toContain('"I\'m restricted from"');
  });

  it('AC16: System prompt instructs AI to provide helpful alternatives', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('Provide helpful alternatives');
    expect(systemPrompt).toContain('Suggest appropriate resources');
  });

  it('AC17: System prompt instructs AI to say "I don\'t know" when appropriate', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain("I don't have information");
    expect(systemPrompt).toContain('Never make up or hallucinate');
  });

  it('AC1: Citation format instruction is [📄 Document Name pg. X]', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('[📄 Document Name pg. X]');
  });
});

// Story 18.3: Preference-Aware AI Responses Tests
describe('formatCarriersContext (AC-18.3.1)', () => {
  it('should return empty string for undefined carriers', () => {
    expect(formatCarriersContext(undefined)).toBe('');
  });

  it('should return empty string for empty array', () => {
    expect(formatCarriersContext([])).toBe('');
  });

  it('should format single carrier correctly', () => {
    const result = formatCarriersContext(['Progressive']);
    expect(result).toContain('Your preferred carriers: Progressive');
    expect(result).toContain('reference these carriers');
  });

  it('should format multiple carriers correctly', () => {
    const result = formatCarriersContext(['Progressive', 'Travelers', 'Hartford']);
    expect(result).toContain('Your preferred carriers: Progressive, Travelers, Hartford');
  });
});

describe('formatLOBContext (AC-18.3.2)', () => {
  it('should return empty string for undefined LOB', () => {
    expect(formatLOBContext(undefined)).toBe('');
  });

  it('should return empty string for empty array', () => {
    expect(formatLOBContext([])).toBe('');
  });

  it('should format single LOB correctly', () => {
    const result = formatLOBContext(['Commercial Property']);
    expect(result).toContain('You work primarily in: Commercial Property');
    expect(result).toContain('Contextualize examples');
  });

  it('should format multiple LOBs correctly', () => {
    const result = formatLOBContext(['Commercial Property', 'Workers Compensation', 'General Liability']);
    expect(result).toContain('You work primarily in: Commercial Property, Workers Compensation, General Liability');
  });
});

describe('formatStatesContext (AC-18.3.5)', () => {
  it('should return empty string when no states or agency', () => {
    expect(formatStatesContext(undefined, undefined)).toBe('');
  });

  it('should return empty string for empty states array and no agency', () => {
    expect(formatStatesContext([], undefined)).toBe('');
  });

  it('should include agency name only', () => {
    const result = formatStatesContext(undefined, 'ABC Insurance');
    expect(result).toContain('You work at: ABC Insurance');
    expect(result).not.toContain('Licensed in:');
  });

  it('should include licensed states only', () => {
    const result = formatStatesContext(['CA', 'TX', 'NY'], undefined);
    expect(result).toContain('Licensed in: CA, TX, NY');
    expect(result).toContain('Prioritize information and regulations');
    expect(result).not.toContain('You work at:');
  });

  it('should include both agency name and licensed states', () => {
    const result = formatStatesContext(['CA', 'TX'], 'ABC Insurance');
    expect(result).toContain('You work at: ABC Insurance');
    expect(result).toContain('Licensed in: CA, TX');
  });
});

describe('formatCommunicationStyle (AC-18.3.3, AC-18.3.4)', () => {
  it('should return professional style directive by default (AC-18.3.7)', () => {
    const result = formatCommunicationStyle(undefined);
    expect(result).toContain('formal, professional language');
    expect(result).toContain('Avoid contractions');
  });

  it('should return professional style directive explicitly', () => {
    const result = formatCommunicationStyle('professional');
    expect(result).toContain('formal, professional language');
    expect(result).toContain('Avoid contractions');
    expect(result).toContain('respectfully');
  });

  it('should return casual style directive (AC-18.3.3)', () => {
    const result = formatCommunicationStyle('casual');
    expect(result).toContain('friendly, conversational tone');
    expect(result).toContain('Contractions are fine');
    expect(result).toContain('approachable');
    expect(result).toContain('Hey!');
  });
});

describe('buildUserContext - Story 18.3 Enhanced', () => {
  it('should include carrier context (AC-18.3.1)', () => {
    const prefs: UserPreferences = {
      favoriteCarriers: ['Progressive', 'Travelers'],
    };
    const result = buildUserContext(prefs);
    expect(result).toContain('Your preferred carriers: Progressive, Travelers');
  });

  it('should include LOB context (AC-18.3.2)', () => {
    const prefs: UserPreferences = {
      linesOfBusiness: ['Commercial Property', 'Workers Compensation'],
    };
    const result = buildUserContext(prefs);
    expect(result).toContain('You work primarily in: Commercial Property, Workers Compensation');
  });

  it('should include states context (AC-18.3.5)', () => {
    const prefs: UserPreferences = {
      agencyName: 'Smith Insurance',
      licensedStates: ['CA', 'TX', 'NY'],
    };
    const result = buildUserContext(prefs);
    expect(result).toContain('You work at: Smith Insurance');
    expect(result).toContain('Licensed in: CA, TX, NY');
  });

  it('should include full user context with all preferences', () => {
    const prefs: UserPreferences = {
      displayName: 'John Smith',
      role: 'producer',
      agencyName: 'ABC Insurance',
      licensedStates: ['CA', 'TX'],
      linesOfBusiness: ['Commercial Property'],
      favoriteCarriers: ['Progressive'],
    };
    const result = buildUserContext(prefs);
    expect(result).toContain('Name: John Smith');
    expect(result).toContain('Role: Producer/Agent');
    expect(result).toContain('You work at: ABC Insurance');
    expect(result).toContain('Licensed in: CA, TX');
    expect(result).toContain('You work primarily in: Commercial Property');
    expect(result).toContain('Your preferred carriers: Progressive');
  });

  it('should gracefully degrade with empty preferences (AC-18.3.7)', () => {
    const prefs: UserPreferences = {
      linesOfBusiness: [],
      favoriteCarriers: [],
      licensedStates: [],
    };
    const result = buildUserContext(prefs);
    expect(result).toBe('');
  });

  it('should skip sections for undefined arrays', () => {
    const prefs: UserPreferences = {
      displayName: 'Jane Doe',
    };
    const result = buildUserContext(prefs);
    expect(result).toContain('Name: Jane Doe');
    expect(result).not.toContain('Your preferred carriers');
    expect(result).not.toContain('You work primarily in');
    expect(result).not.toContain('Licensed in');
  });
});

describe('buildSystemPrompt - Story 18.3 Communication Style', () => {
  it('should include Communication Style section by default (AC-18.3.4)', () => {
    const { systemPrompt } = buildSystemPrompt({});
    expect(systemPrompt).toContain('## Communication Style');
    expect(systemPrompt).toContain('formal, professional language');
  });

  it('should include professional style when explicitly set', () => {
    const { systemPrompt } = buildSystemPrompt({
      userPreferences: { communicationStyle: 'professional' },
    });
    expect(systemPrompt).toContain('## Communication Style');
    expect(systemPrompt).toContain('formal, professional language');
  });

  it('should include casual style when set (AC-18.3.3)', () => {
    const { systemPrompt } = buildSystemPrompt({
      userPreferences: { communicationStyle: 'casual' },
    });
    expect(systemPrompt).toContain('## Communication Style');
    expect(systemPrompt).toContain('friendly, conversational tone');
    expect(systemPrompt).toContain('Contractions are fine');
  });

  it('should include User Context with preferences', () => {
    const { systemPrompt, userContext } = buildSystemPrompt({
      userPreferences: {
        displayName: 'Agent Smith',
        favoriteCarriers: ['Progressive'],
        linesOfBusiness: ['Commercial'],
        licensedStates: ['CA'],
        agencyName: 'Smith Insurance',
      },
    });
    expect(systemPrompt).toContain('## User Context');
    expect(userContext).toContain('Name: Agent Smith');
    expect(userContext).toContain('Your preferred carriers: Progressive');
    expect(userContext).toContain('You work primarily in: Commercial');
    expect(userContext).toContain('Licensed in: CA');
  });

  it('should work without preferences (graceful degradation AC-18.3.7)', () => {
    const { systemPrompt, userContext } = buildSystemPrompt({});
    // Should still have communication style (defaults to professional)
    expect(systemPrompt).toContain('## Communication Style');
    // But no user context section
    expect(userContext).toBe('');
  });
});

describe('Story 18.3 AC Requirements', () => {
  it('AC-18.3.1: Carrier context included when carriers set', () => {
    const { userContext } = buildSystemPrompt({
      userPreferences: { favoriteCarriers: ['Progressive', 'Travelers'] },
    });
    expect(userContext).toContain('Your preferred carriers: Progressive, Travelers');
    expect(userContext).toContain('reference these carriers');
  });

  it('AC-18.3.2: LOB context included when LOB set', () => {
    const { userContext } = buildSystemPrompt({
      userPreferences: { linesOfBusiness: ['Commercial Property'] },
    });
    expect(userContext).toContain('You work primarily in: Commercial Property');
    expect(userContext).toContain('Contextualize examples');
  });

  it('AC-18.3.3: Casual style produces conversational directive', () => {
    const { systemPrompt } = buildSystemPrompt({
      userPreferences: { communicationStyle: 'casual' },
    });
    expect(systemPrompt).toContain('friendly, conversational tone');
    expect(systemPrompt).toContain('Hey!');
    expect(systemPrompt).not.toContain('Avoid contractions');
  });

  it('AC-18.3.4: Professional style produces formal directive', () => {
    const { systemPrompt } = buildSystemPrompt({
      userPreferences: { communicationStyle: 'professional' },
    });
    expect(systemPrompt).toContain('formal, professional language');
    expect(systemPrompt).toContain('Avoid contractions');
    expect(systemPrompt).not.toContain('Hey!');
  });

  it('AC-18.3.5: Licensed states context included when states set', () => {
    const { userContext } = buildSystemPrompt({
      userPreferences: {
        agencyName: 'ABC Insurance',
        licensedStates: ['CA', 'TX', 'NY'],
      },
    });
    expect(userContext).toContain('You work at: ABC Insurance');
    expect(userContext).toContain('Licensed in: CA, TX, NY');
    expect(userContext).toContain('Prioritize information and regulations');
  });

  it('AC-18.3.7: Graceful degradation - professional style and generic context with no preferences', () => {
    const { systemPrompt, userContext } = buildSystemPrompt({});
    // Professional style is default
    expect(systemPrompt).toContain('formal, professional language');
    // No user context when no preferences
    expect(userContext).toBe('');
    // System prompt should still work
    expect(systemPrompt).toContain('AI Buddy');
    expect(systemPrompt).toContain('insurance agents');
  });
});
