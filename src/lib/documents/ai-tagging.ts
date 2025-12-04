/**
 * AI Tagging Service
 *
 * GPT-5.1 structured outputs for document tagging and summarization.
 * Uses OpenAI SDK's zodResponseFormat for guaranteed schema-compliant responses.
 *
 * Story F2-3: AC-F2-3.1, AC-F2-3.2, AC-F2-3.3, AC-F2-3.4
 *
 * @module @/lib/documents/ai-tagging
 */

import { z } from 'zod';

// ============================================================================
// Configuration
// ============================================================================

const TAGGING_TIMEOUT_MS = 5000; // 5 seconds per AC-F2-3.4
const MODEL = 'gpt-5.1';

/**
 * Zod schema for AI tagging result.
 * AC-F2-3.1: 3-5 tags
 * AC-F2-3.2: Summary under 200 characters
 * AC-F2-3.3: Document type inference
 */
export const tagResultSchema = z.object({
  tags: z.array(z.string()).min(3).max(5),
  summary: z.string().max(200),
  documentType: z.enum(['quote', 'general']),
});

export type TagResult = z.infer<typeof tagResultSchema>;

/**
 * System prompt for document tagging.
 * Guides GPT-5.1 to extract tags, summary, and infer document type.
 */
const TAGGING_SYSTEM_PROMPT = `You are analyzing an insurance document. Based on the content provided, extract:

1. Tags (3-5): Short, relevant keywords describing the document content.
   - Focus on insurance terms (e.g., "liability", "commercial auto", "workers comp")
   - Include carrier name if identifiable
   - Include policy type (e.g., "BOP", "GL", "umbrella")

2. Summary (1-2 sentences): Brief description of what this document is about.
   - Be specific: mention carrier, policy type, coverage highlights
   - Keep under 200 characters

3. Document Type: Is this a "quote" document (insurance proposal/quote) or "general" document (certificate, endorsement, general info)?

Do NOT include:
- PII (names, addresses, policy numbers)
- Generic tags like "insurance" or "document"`;

// ============================================================================
// Main Tagging Function (for Edge Function / Deno runtime)
// ============================================================================

/**
 * Generate document tags using GPT-5.1 with structured outputs.
 * Designed for Edge Function (Deno runtime) - uses fetch directly.
 *
 * AC-F2-3.1: Returns 3-5 tags
 * AC-F2-3.2: Returns summary under 200 chars
 * AC-F2-3.3: Infers document type
 * AC-F2-3.4: 5-second timeout
 * AC-F2-3.5: Returns null on failure (graceful degradation)
 *
 * @param chunks - Document chunks (first 5 used for context)
 * @param openaiApiKey - OpenAI API key
 * @param timeoutMs - Timeout in milliseconds (default 5000)
 * @returns TagResult or null on failure/timeout
 */
export async function generateDocumentTags(
  chunks: string[],
  openaiApiKey: string,
  timeoutMs: number = TAGGING_TIMEOUT_MS
): Promise<TagResult | null> {
  const startTime = Date.now();

  // Use first 5 chunks (~5 pages) as context for efficiency
  const context = chunks.slice(0, 5).join('\n\n---\n\n');

  if (!context.trim()) {
    console.warn('[AI Tagging] No content to analyze');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Build request for OpenAI structured outputs
    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: TAGGING_SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'document_tags',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 5,
                description: 'Short, relevant keywords describing the document content',
              },
              summary: {
                type: 'string',
                maxLength: 200,
                description: 'Brief 1-2 sentence description of the document',
              },
              documentType: {
                type: 'string',
                enum: ['quote', 'general'],
                description: 'Whether this is a quote document or general document',
              },
            },
            required: ['tags', 'summary', 'documentType'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.1, // Low for consistent extraction
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Tagging] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[AI Tagging] No content in response');
      return null;
    }

    // Parse and validate the response
    const parsed = JSON.parse(content);
    const validated = tagResultSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[AI Tagging] Schema validation failed:', validated.error);
      return null;
    }

    const duration = Date.now() - startTime;
    console.log(`[AI Tagging] Success in ${duration}ms`, {
      tagCount: validated.data.tags.length,
      summaryLength: validated.data.summary.length,
      documentType: validated.data.documentType,
    });

    return validated.data;
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`[AI Tagging] Timeout after ${timeoutMs}ms`);
      } else {
        console.error('[AI Tagging] Error:', error.message);
      }
    } else {
      console.error('[AI Tagging] Unknown error:', error);
    }

    return null;
  }
}
