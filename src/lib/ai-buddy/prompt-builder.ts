/**
 * AI Buddy Prompt Builder
 * Story 15.5: AI Response Quality & Attribution
 * Story 18.3: Preference-Aware AI Responses
 *
 * System prompt construction for AI Buddy with guardrails integration.
 * Implements invisible guardrail enforcement through prompt conditioning.
 *
 * Key principles (per architecture.md):
 * - Guardrails enforced via system prompt injection, NOT post-processing
 * - AI never says "I cannot" - always provide helpful alternatives
 * - Citation format instructions for source attribution
 * - Confidence level guidelines for trust transparency
 * - User preferences injected for personalized responses (Story 18.3)
 */

import type { UserPreferences, GuardrailConfig, Citation } from '@/types/ai-buddy';
import type { GuardrailCheckResult } from './guardrails';
import { log } from '@/lib/utils/logger';

export interface PromptContext {
  userPreferences?: UserPreferences;
  guardrailConfig?: GuardrailConfig;
  guardrailCheckResult?: GuardrailCheckResult;
  documentContext?: DocumentContext[];
  projectName?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  /** Story 17.2: Pre-formatted structured extraction data from project documents */
  structuredExtractionContext?: string;
}

export interface DocumentContext {
  documentId: string;
  documentName: string;
  chunks: Array<{
    content: string;
    page?: number;
    similarity?: number;
  }>;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userContext: string;
  documentContextSummary?: string;
}

/**
 * Base AI Buddy persona and capabilities
 */
const BASE_PERSONA = `You are AI Buddy, a knowledgeable and helpful AI assistant designed specifically for independent insurance agents. Your expertise includes:

- Insurance policy analysis and coverage interpretation
- Insurance industry terminology and concepts
- Best practices for client communication
- General insurance knowledge across all lines of business
- Document analysis when documents are provided

Your communication style is:
- Professional yet approachable
- Clear and concise
- Helpful and solution-oriented
- Educational without being condescending`;

/**
 * Invisible guardrail instructions
 * AC15: Never say "I cannot", "blocked", "restricted"
 * AC16: Provide helpful redirects
 * AC17: Say "I don't know" when appropriate
 */
const GUARDRAIL_BASE_INSTRUCTIONS = `
## Critical Response Guidelines

NEVER use these phrases in your responses:
- "I cannot"
- "I'm not allowed"
- "I'm restricted from"
- "I'm blocked from"
- "I'm unable to"
- "I cannot provide"
- "That's outside my scope"

Instead, ALWAYS:
- Provide helpful alternatives or redirects
- Suggest appropriate resources or professionals
- Frame guidance positively
- If you genuinely don't have information, say "I don't have information about that specific topic" or "I'd recommend consulting [appropriate resource]"

When you don't know something:
- Be honest: "I don't have enough information to answer that specifically"
- Never make up or hallucinate information
- Suggest where the user might find accurate information`;

/**
 * Citation format instructions for source attribution
 * AC1: Inline citations in format [📄 Document Name pg. X]
 */
const CITATION_INSTRUCTIONS = `
## Source Citations

When answering questions using information from attached documents:
1. Reference the source document inline using this exact format: [📄 Document Name pg. X]
2. Include page numbers when available
3. Place citations immediately after the relevant information
4. If information comes from multiple sources, cite each one
5. Only cite documents that are actually attached to this conversation

Example: "The policy has a $1,000,000 per occurrence limit [📄 Commercial General Liability.pdf pg. 2]"

When answering from general knowledge (no document sources):
- Do NOT include any citations
- The response will be marked with a "Needs Review" confidence indicator`;

/**
 * Confidence level guidelines
 * AC9-AC11: High/Medium/Low confidence indicators
 */
const CONFIDENCE_INSTRUCTIONS = `
## Response Confidence

Your responses will be automatically categorized by confidence:

HIGH CONFIDENCE (from documents):
- Information directly sourced from attached documents
- Include citations to support your answers
- User can verify by clicking citations

MEDIUM CONFIDENCE (general knowledge):
- General insurance knowledge not from attached documents
- User should verify important details with carrier or policy

LOW CONFIDENCE (not found):
- Information not available in documents or general knowledge
- Be honest that you couldn't find the information
- Suggest alternative resources`;

/**
 * Story 18.3: Communication Style Directives
 * AC-18.3.3: Casual style - conversational tone
 * AC-18.3.4: Professional style - formal tone
 */
const STYLE_DIRECTIVES = {
  professional: `Use formal, professional language in your responses.
Avoid contractions (use "do not" instead of "don't", "cannot" instead of "can't").
Structure responses with clear sections when appropriate.
Address the user respectfully and maintain a professional tone throughout.`,
  casual: `Use a friendly, conversational tone in your responses.
Contractions are fine (it's, don't, you're).
Be approachable and personable.
Feel free to use conversational openings like "Hey!" or "Sure thing!".`,
} as const;

/**
 * Story 18.3: Format carrier context for system prompt
 * AC-18.3.1: Carrier context in responses
 *
 * @param carriers - Array of preferred carrier names
 * @returns Formatted carrier context string or empty string
 */
export function formatCarriersContext(carriers?: string[]): string {
  if (!carriers || carriers.length === 0) {
    return '';
  }
  return `Your preferred carriers: ${carriers.join(', ')}. When discussing carrier options or recommendations, reference these carriers when relevant.`;
}

/**
 * Story 18.3: Format lines of business context for system prompt
 * AC-18.3.2: LOB context in responses
 *
 * @param linesOfBusiness - Array of lines of business
 * @returns Formatted LOB context string or empty string
 */
export function formatLOBContext(linesOfBusiness?: string[]): string {
  if (!linesOfBusiness || linesOfBusiness.length === 0) {
    return '';
  }
  return `You work primarily in: ${linesOfBusiness.join(', ')}. Contextualize examples and explanations to these lines of business when relevant.`;
}

/**
 * Story 18.3: Format licensed states context for system prompt
 * AC-18.3.5: Licensed states context in responses
 *
 * @param licensedStates - Array of state abbreviations
 * @param agencyName - Optional agency name
 * @returns Formatted states context string or empty string
 */
export function formatStatesContext(licensedStates?: string[], agencyName?: string): string {
  const parts: string[] = [];

  if (agencyName) {
    parts.push(`You work at: ${agencyName}.`);
  }

  if (licensedStates && licensedStates.length > 0) {
    parts.push(`Licensed in: ${licensedStates.join(', ')}. Prioritize information and regulations for these states when discussing state-specific topics.`);
  }

  return parts.join(' ');
}

/**
 * Story 18.3: Format communication style directive for system prompt
 * AC-18.3.3, AC-18.3.4: Communication style
 *
 * @param style - Communication style preference ('professional' or 'casual')
 * @returns Formatted style directive string
 */
export function formatCommunicationStyle(style?: 'professional' | 'casual'): string {
  // AC-18.3.7: Default to professional if style not set
  const effectiveStyle = style ?? 'professional';
  return STYLE_DIRECTIVES[effectiveStyle];
}

/**
 * Build the complete system prompt with guardrails
 *
 * @param context - Prompt context including preferences, guardrails, documents
 * @returns BuiltPrompt with system prompt and optional context sections
 */
export function buildSystemPrompt(context: PromptContext): BuiltPrompt {
  const parts: string[] = [BASE_PERSONA];

  // Story 18.3: Add communication style directive early (AC-18.3.3, AC-18.3.4)
  // This ensures the style influences the entire response
  const styleDirective = formatCommunicationStyle(context.userPreferences?.communicationStyle);
  parts.push(`\n## Communication Style\n${styleDirective}`);

  // Add user context if available
  const userContext = buildUserContext(context.userPreferences);
  if (userContext) {
    parts.push(`\n## User Context\n${userContext}`);
  }

  // Add guardrail instructions (always included for safety)
  parts.push(GUARDRAIL_BASE_INSTRUCTIONS);

  // Add specific guardrail rules from config
  if (context.guardrailConfig) {
    const guardrailRules = buildGuardrailInstructions(context.guardrailConfig);
    if (guardrailRules) {
      parts.push(guardrailRules);
    }
  }

  // Add redirect guidance if guardrail was triggered
  if (context.guardrailCheckResult?.triggeredTopic) {
    const { triggeredTopic } = context.guardrailCheckResult;
    parts.push(`
## Immediate Guidance Required
The user's question relates to "${triggeredTopic.trigger}".
You MUST lead your response with this guidance: "${triggeredTopic.redirect}"
Then provide any helpful context you can, while respecting this boundary.`);
  }

  // Add citation instructions
  parts.push(CITATION_INSTRUCTIONS);

  // Add confidence instructions
  parts.push(CONFIDENCE_INSTRUCTIONS);

  // Build document context summary
  let documentContextSummary: string | undefined;
  if (context.documentContext && context.documentContext.length > 0) {
    documentContextSummary = buildDocumentContextSection(context.documentContext);
    parts.push(`\n## Available Documents\n${documentContextSummary}`);
  }

  // Add project context if available
  if (context.projectName) {
    parts.push(`\n## Project Context\nThis conversation is part of the project: "${context.projectName}"`);
  }

  // Story 17.2: Add structured extraction context from project documents (AC-17.2.7)
  if (context.structuredExtractionContext) {
    parts.push(`\n## Structured Policy Data\nThe following structured data has been extracted from project documents. Use this for accurate coverage details, limits, and policy specifics:\n\n${context.structuredExtractionContext}`);
  }

  // Add E&O disclaimer reminder if enabled
  if (context.guardrailConfig?.eandoDisclaimer) {
    parts.push(`
## E&O Protection Reminder
For coverage-specific questions:
- Recommend verifying details with the carrier
- Note that policy language takes precedence
- Suggest professional review for binding decisions`);
  }

  // Add AI disclosure if enabled
  if (context.guardrailConfig?.aiDisclosureEnabled && context.guardrailConfig?.aiDisclosureMessage) {
    parts.push(`
## AI Disclosure
Include this disclosure when appropriate: "${context.guardrailConfig.aiDisclosureMessage}"`);
  }

  const systemPrompt = parts.join('\n');

  // AC-18.3.6: Debug logging for system prompt verification
  if (process.env.DEBUG_PROMPT_CONTEXT === 'true') {
    log.debug('Full system prompt constructed', {
      promptLength: systemPrompt.length,
      hasUserContext: !!userContext,
      hasDocumentContext: !!documentContextSummary,
      hasStructuredExtraction: !!context.structuredExtractionContext,
      hasGuardrailConfig: !!context.guardrailConfig,
      hasGuardrailTrigger: !!context.guardrailCheckResult?.triggeredTopic,
      communicationStyle: context.userPreferences?.communicationStyle ?? 'professional',
    });

    // Log full prompt only in development (can be very long)
    if (process.env.NODE_ENV === 'development') {
      log.debug('System prompt content', { systemPrompt });
    }
  }

  return {
    systemPrompt,
    userContext,
    documentContextSummary,
  };
}

/**
 * Build the user context section of the prompt
 * Story 18.3: Enhanced with richer context using formatter functions
 * AC-18.3.1: Carrier context
 * AC-18.3.2: LOB context
 * AC-18.3.5: Licensed states context
 * AC-18.3.7: Graceful degradation for missing preferences
 */
export function buildUserContext(preferences?: UserPreferences): string {
  // AC-18.3.7: Return empty string for undefined preferences (graceful degradation)
  if (!preferences) {
    return '';
  }

  const parts: string[] = [];

  // Basic identity information
  if (preferences.displayName) {
    parts.push(`Name: ${preferences.displayName}`);
  }

  if (preferences.role) {
    const roleLabels: Record<string, string> = {
      producer: 'Producer/Agent',
      csr: 'Customer Service Representative',
      manager: 'Agency Manager',
      other: 'Insurance Professional',
    };
    parts.push(`Role: ${roleLabels[preferences.role] ?? preferences.role}`);
  }

  // AC-18.3.5: Agency and licensed states context
  const statesContext = formatStatesContext(preferences.licensedStates, preferences.agencyName);
  if (statesContext) {
    parts.push(statesContext);
  }

  // AC-18.3.2: Lines of business context
  const lobContext = formatLOBContext(preferences.linesOfBusiness);
  if (lobContext) {
    parts.push(lobContext);
  }

  // AC-18.3.1: Carrier context
  const carriersContext = formatCarriersContext(preferences.favoriteCarriers);
  if (carriersContext) {
    parts.push(carriersContext);
  }

  const result = parts.join('\n');

  // AC-18.3.6: Debug logging for preference injection verification
  if (process.env.DEBUG_PROMPT_CONTEXT === 'true') {
    log.debug('Preferences injected into prompt', {
      hasDisplayName: !!preferences.displayName,
      hasRole: !!preferences.role,
      hasCarriers: !!preferences.favoriteCarriers?.length,
      hasLOB: !!preferences.linesOfBusiness?.length,
      hasStates: !!preferences.licensedStates?.length,
      hasAgency: !!preferences.agencyName,
      style: preferences.communicationStyle ?? 'professional',
    });
  }

  return result;
}

/**
 * Build the guardrail instructions section
 */
export function buildGuardrailInstructions(config?: GuardrailConfig): string {
  if (!config) {
    return '';
  }

  const parts: string[] = [];

  // Add restricted topic guidance
  if (config.restrictedTopicsEnabled && config.restrictedTopics?.length) {
    parts.push('\n## Topic Guidance');
    for (const topic of config.restrictedTopics) {
      parts.push(`When asked about "${topic.trigger}": Lead with "${topic.redirect}"`);
    }
  }

  // Add custom rules
  if (config.customRules?.length) {
    parts.push('\n## Agency-Specific Guidelines');
    for (const rule of config.customRules) {
      parts.push(`- ${rule}`);
    }
  }

  return parts.join('\n');
}

/**
 * Build document context section for RAG
 */
function buildDocumentContextSection(documents: DocumentContext[]): string {
  const parts: string[] = [];

  for (const doc of documents) {
    parts.push(`\n### ${doc.documentName}`);

    for (const chunk of doc.chunks) {
      const pageRef = chunk.page ? ` (Page ${chunk.page})` : '';
      parts.push(`${pageRef}\n${chunk.content}`);
    }
  }

  return parts.join('\n');
}

/**
 * Build user message with document context for RAG
 * This formats the user's question with relevant document chunks
 */
export function buildUserPrompt(
  message: string,
  documentContext?: DocumentContext[]
): string {
  if (!documentContext || documentContext.length === 0) {
    return message;
  }

  const contextParts: string[] = ['<relevant_document_content>'];

  for (const doc of documentContext) {
    contextParts.push(`\n[Document: ${doc.documentName}]`);
    for (const chunk of doc.chunks) {
      const pageRef = chunk.page ? `[Page ${chunk.page}]` : '';
      contextParts.push(`${pageRef}\n${chunk.content}\n`);
    }
  }

  contextParts.push('</relevant_document_content>');
  contextParts.push(`\nUser Question: ${message}`);

  return contextParts.join('\n');
}

/**
 * Extract citations from AI response text
 * Parses [📄 Document Name pg. X] format
 *
 * @param responseText - The AI response text
 * @param availableDocuments - Documents that were in context
 * @returns Array of extracted citations
 */
export function extractCitationsFromResponse(
  responseText: string,
  availableDocuments: DocumentContext[]
): Citation[] {
  const citations: Citation[] = [];

  // Regex to match [📄 Document Name pg. X] or [📄 Document Name]
  const citationRegex = /\[📄\s*([^\]]+?)(?:\s+pg\.?\s*(\d+))?\]/g;

  let match;
  while ((match = citationRegex.exec(responseText)) !== null) {
    const documentName = match[1]?.trim();
    const pageNumber = match[2] ? parseInt(match[2], 10) : undefined;

    if (!documentName) continue;

    // Find matching document
    const matchedDoc = availableDocuments.find(
      (doc) => doc.documentName.toLowerCase() === documentName.toLowerCase()
    );

    if (matchedDoc) {
      // Find the relevant chunk for text excerpt
      const relevantChunk = pageNumber
        ? matchedDoc.chunks.find((c) => c.page === pageNumber)
        : matchedDoc.chunks[0];

      citations.push({
        documentId: matchedDoc.documentId,
        documentName: matchedDoc.documentName,
        page: pageNumber ?? 1,
        text: relevantChunk?.content?.slice(0, 200) ?? '',
      });
    }
  }

  // Deduplicate citations
  const seen = new Set<string>();
  return citations.filter((c) => {
    const key = `${c.documentId}-${c.page}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculate confidence level based on document context
 * AC9-AC11: High/Medium/Low confidence
 *
 * @param hasDocumentContext - Whether documents were used
 * @param citations - Extracted citations from response
 * @param responseText - The AI response
 * @returns Confidence level
 */
export function calculateConfidence(
  hasDocumentContext: boolean,
  citations: Citation[],
  responseText: string
): 'high' | 'medium' | 'low' {
  // Check for "I don't know" type responses (AC11)
  const unknownPhrases = [
    "i don't have information",
    "i couldn't find",
    "i don't have enough information",
    "no information available",
    "not found in the documents",
    "i'm not sure",
    "i cannot determine",
  ];

  const lowerResponse = responseText.toLowerCase();
  const hasUnknownIndicator = unknownPhrases.some((phrase) => lowerResponse.includes(phrase));

  if (hasUnknownIndicator) {
    return 'low'; // AC11: Information not available
  }

  // High confidence: has document context AND citations (AC9)
  if (hasDocumentContext && citations.length > 0) {
    return 'high';
  }

  // Medium confidence: general knowledge without citations (AC10)
  return 'medium';
}
