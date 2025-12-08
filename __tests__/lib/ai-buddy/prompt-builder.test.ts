/**
 * Prompt Builder Unit Tests
 * Story 15.5: AI Response Quality & Attribution
 *
 * Tests for system prompt construction with guardrails integration.
 */

import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  buildUserContext,
  buildGuardrailInstructions,
  extractCitationsFromResponse,
  calculateConfidence,
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

  it('should include display name', () => {
    const prefs: UserPreferences = { displayName: 'John Doe' };
    expect(buildUserContext(prefs)).toContain('User: John Doe');
  });

  it('should include role with label', () => {
    const prefs: UserPreferences = { role: 'producer' };
    expect(buildUserContext(prefs)).toContain('Role: Producer/Agent');
  });

  it('should include agency name', () => {
    const prefs: UserPreferences = { agencyName: 'ABC Insurance' };
    expect(buildUserContext(prefs)).toContain('Agency: ABC Insurance');
  });

  it('should include lines of business', () => {
    const prefs: UserPreferences = {
      linesOfBusiness: ['Commercial', 'Personal Lines'],
    };
    expect(buildUserContext(prefs)).toContain(
      'Primary Lines: Commercial, Personal Lines'
    );
  });

  it('should include favorite carriers', () => {
    const prefs: UserPreferences = {
      favoriteCarriers: ['Progressive', 'Travelers'],
    };
    expect(buildUserContext(prefs)).toContain(
      'Frequently Used Carriers: Progressive, Travelers'
    );
  });

  it('should include communication style', () => {
    const prefs: UserPreferences = { communicationStyle: 'professional' };
    expect(buildUserContext(prefs)).toContain('Preferred Style: Professional/Formal');
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
