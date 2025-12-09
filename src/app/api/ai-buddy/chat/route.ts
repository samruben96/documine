/**
 * AI Buddy Chat API Route
 * Story 15.3: Streaming Chat API
 * Story 15.5: AI Response Quality & Attribution
 * Story 17.1: Document Upload to Conversation with Status
 *
 * POST /api/ai-buddy/chat - Send a message and receive AI response (streaming)
 *
 * AC-15.3.1: Response streams via Server-Sent Events (SSE) format
 * AC-15.3.2: First token appears within 500ms of sending message
 * AC-15.3.4: SSE events include: chunk, sources, confidence, done, error types
 * AC-15.3.6: Rate limiting enforced (20 messages/minute default)
 * AC-15.3.8: Conversation auto-creates on first message if no conversationId
 *
 * Story 15.5 ACs:
 * AC1-AC6: Source citations with SSE emission
 * AC7-AC14: Confidence indicators with SSE emission
 * AC15-AC20: Guardrail-aware responses via prompt builder
 *
 * Story 17.1 ACs:
 * AC-17.1.4: AI references documents with page-level citations
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import { getLLMClient, getModelId } from '@/lib/llm/config';
import { checkAiBuddyRateLimit } from '@/lib/ai-buddy/rate-limiter';
import { loadGuardrails, checkGuardrails } from '@/lib/ai-buddy/guardrails';
import {
  buildSystemPrompt,
  extractCitationsFromResponse,
  calculateConfidence,
  type DocumentContext,
} from '@/lib/ai-buddy/prompt-builder';
import { logGuardrailEvent, logMessageEvent } from '@/lib/ai-buddy/audit-logger';
import {
  getConversationAttachments,
  getConversationAttachmentChunks,
  getProjectDocumentChunks,
  buildConversationPrompt,
  conversationChunksToCitations,
} from '@/lib/chat/rag';
import type { ConfidenceLevel as RagConfidenceLevel } from '@/lib/chat/confidence';
import type { ChatRequest, Citation, ConfidenceLevel } from '@/types/ai-buddy';

/**
 * Map RAG confidence levels to AI Buddy confidence levels
 */
function mapRagConfidenceToAiBuddy(ragConfidence: RagConfidenceLevel): ConfidenceLevel {
  switch (ragConfidence) {
    case 'high':
      return 'high';
    case 'needs_review':
      return 'medium';
    case 'not_found':
    case 'conversational':
      return 'low';
    default:
      return 'medium';
  }
}

// Edge Runtime for low latency streaming (AC-15.3.2)
export const runtime = 'edge';

/**
 * Request validation schema per tech spec
 */
const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  attachments: z
    .array(
      z.object({
        documentId: z.string().uuid(),
        type: z.enum(['pdf', 'image']),
      })
    )
    .optional(),
});

/**
 * SSE Event types for AI Buddy streaming
 * AC-15.3.4: chunk, sources, confidence, done, error
 */
interface AiBuddySSEEvent {
  type: 'chunk' | 'sources' | 'confidence' | 'done' | 'error';
  content?: string;
  citations?: Citation[];
  level?: ConfidenceLevel;
  conversationId?: string;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Format SSE event for transmission
 */
function formatSSEEvent(event: AiBuddySSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * AI Buddy error codes
 */
const AI_BUDDY_ERRORS = {
  AIB_001: 'Project not found',
  AIB_002: 'Conversation not found',
  AIB_003: 'Rate limit exceeded',
  AIB_004: 'AI provider error',
  AIB_005: 'Invalid attachment type',
  AIB_006: 'Guardrail configuration invalid',
  AIB_007: 'Insufficient permissions',
  AIB_008: 'Onboarding incomplete',
} as const;

/**
 * Create error response with appropriate status code
 */
function createErrorResponse(
  code: keyof typeof AI_BUDDY_ERRORS | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR',
  message: string,
  status: number,
  retryAfter?: number
): Response {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return new Response(
    JSON.stringify({
      data: null,
      error: { code, message },
    }),
    { status, headers }
  );
}

/**
 * POST /api/ai-buddy/chat
 * Streaming chat endpoint using Server-Sent Events
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const firstIssue = issues[0];
      log.warn('AI Buddy chat request validation failed', { issues });
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request: ' + (firstIssue?.message ?? 'Invalid input'),
        400
      );
    }

    const { conversationId, projectId, message, attachments } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('AI Buddy chat unauthorized - no user session');
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Get user's agency and preferences
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id, ai_buddy_preferences')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      log.error('Failed to get user agency', userError ?? new Error('No user data'), {
        userId: user.id,
      });
      return createErrorResponse('UNAUTHORIZED', 'User not found', 401);
    }

    const agencyId = userData.agency_id;
    const userPreferences = userData.ai_buddy_preferences as Record<string, unknown> | null;

    // Check rate limit (AC-15.3.6)
    const rateLimitCheck = await checkAiBuddyRateLimit(user.id, agencyId, supabase);

    if (!rateLimitCheck.allowed) {
      log.warn('AI Buddy rate limit exceeded', {
        userId: user.id,
        tier: rateLimitCheck.tier,
        limit: rateLimitCheck.limit,
        resetAt: rateLimitCheck.resetAt.toISOString(),
      });

      const retryAfter = Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 1000);
      return createErrorResponse(
        'AIB_003',
        `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
        429,
        retryAfter
      );
    }

    // Verify project exists if provided
    let projectName: string | undefined;
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('ai_buddy_projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        log.warn('AI Buddy project not found', { projectId, userId: user.id });
        return createErrorResponse('AIB_001', 'Project not found', 404);
      }
      projectName = project.name;
    }

    // Load guardrails for the agency (AC15-AC20)
    const guardrailConfig = await loadGuardrails(agencyId);

    // Check message against guardrails
    const guardrailCheckResult = checkGuardrails(message, guardrailConfig);

    // Log guardrail trigger if applicable (AC19)
    if (guardrailCheckResult.triggeredTopic) {
      log.info('AI Buddy guardrail triggered', {
        userId: user.id,
        topic: guardrailCheckResult.triggeredTopic.trigger,
      });
    }

    // Handle conversation - create new or verify existing (AC-15.3.8)
    let activeConversationId = conversationId;
    let isNewConversation = false;

    if (conversationId) {
      // Verify conversation exists and belongs to user
      const { data: conv, error: convError } = await supabase
        .from('ai_buddy_conversations')
        .select('id')
        .eq('id', conversationId)
        .single();

      if (convError || !conv) {
        log.warn('AI Buddy conversation not found', { conversationId, userId: user.id });
        return createErrorResponse('AIB_002', 'Conversation not found', 404);
      }
    } else {
      // Create new conversation
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      const { data: newConv, error: createError } = await supabase
        .from('ai_buddy_conversations')
        .insert({
          agency_id: agencyId,
          user_id: user.id,
          project_id: projectId || null,
          title,
        })
        .select('id')
        .single();

      if (createError || !newConv) {
        log.error('Failed to create conversation', createError ?? new Error('No conversation data'));
        return createErrorResponse('INTERNAL_ERROR', 'Failed to create conversation', 500);
      }

      activeConversationId = newConv.id;
      isNewConversation = true;

      log.info('AI Buddy conversation created', {
        conversationId: activeConversationId,
        userId: user.id,
        projectId,
      });
    }

    // Type guard: at this point activeConversationId is guaranteed to be set
    if (!activeConversationId) {
      log.error('Conversation ID not set after handling', new Error('Logic error'));
      return createErrorResponse('INTERNAL_ERROR', 'Failed to initialize conversation', 500);
    }

    // Save user message
    const { data: userMessage, error: msgError } = await supabase
      .from('ai_buddy_messages')
      .insert({
        conversation_id: activeConversationId,
        agency_id: agencyId,
        role: 'user',
        content: message,
      })
      .select('id')
      .single();

    if (msgError || !userMessage) {
      log.error('Failed to save user message', msgError ?? new Error('No message data'));
      return createErrorResponse('INTERNAL_ERROR', 'Failed to save message', 500);
    }

    // Log guardrail event if triggered (AC19)
    if (guardrailCheckResult.triggeredTopic) {
      await logGuardrailEvent(
        agencyId,
        user.id,
        activeConversationId,
        guardrailCheckResult.triggeredTopic.trigger,
        guardrailCheckResult.triggeredTopic.redirect,
        message
      );
    }

    // Verify LLM configuration
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
    if (!hasOpenRouterKey) {
      log.error('OPENROUTER_API_KEY not configured', new Error('Missing API key'));
      return createErrorResponse('INTERNAL_ERROR', 'Service not configured', 500);
    }

    // Get conversation history for context
    const { data: historyMessages } = await supabase
      .from('ai_buddy_messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Story 17.1: Check for conversation attachments and use RAG (AC-17.1.4)
    let documentContext: DocumentContext[] = [];
    let attachmentChunks: Awaited<ReturnType<typeof getConversationAttachmentChunks>> | null = null;

    // Check if conversation has attachments
    const conversationAttachments = await getConversationAttachments(supabase, activeConversationId);
    const readyAttachments = conversationAttachments.filter((att) => att.status === 'ready');

    if (readyAttachments.length > 0) {
      // Retrieve relevant chunks from attached documents
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          attachmentChunks = await getConversationAttachmentChunks(
            supabase,
            activeConversationId,
            message,
            openaiKey
          );

          // Convert to DocumentContext for prompt builder
          // Group chunks by document
          const chunksByDoc = new Map<string, { documentName: string; chunks: Array<{ content: string; page?: number; similarity?: number }> }>();
          for (const chunk of attachmentChunks.chunks) {
            const existing = chunksByDoc.get(chunk.documentId);
            const chunkData = {
              content: chunk.content,
              page: chunk.pageNumber,
              similarity: chunk.similarityScore,
            };
            if (existing) {
              existing.chunks.push(chunkData);
            } else {
              chunksByDoc.set(chunk.documentId, {
                documentName: chunk.documentName,
                chunks: [chunkData],
              });
            }
          }

          documentContext = Array.from(chunksByDoc.entries()).map(([docId, data]) => ({
            documentId: docId,
            documentName: data.documentName,
            chunks: data.chunks,
          }));

          log.info('RAG context retrieved for conversation', {
            conversationId: activeConversationId,
            attachmentCount: readyAttachments.length,
            chunkCount: attachmentChunks.chunks.length,
            confidence: attachmentChunks.confidence,
          });
        } catch (ragError) {
          log.error(
            'Failed to retrieve RAG context',
            ragError instanceof Error ? ragError : new Error(String(ragError)),
            { conversationId: activeConversationId }
          );
          // Continue without RAG - will use general knowledge
        }
      }
    }

    // Story 17.2: Also retrieve project documents if projectId is provided (AC-17.2.7)
    let projectDocumentContext: string | undefined;
    if (projectId) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const projectChunks = await getProjectDocumentChunks(
            supabase,
            projectId,
            message,
            openaiKey
          );

          // Add project document chunks to document context
          if (projectChunks.chunks.length > 0) {
            const chunksByDoc = new Map<string, { documentName: string; chunks: Array<{ content: string; page?: number; similarity?: number }> }>();
            for (const chunk of projectChunks.chunks) {
              const existing = chunksByDoc.get(chunk.documentId);
              const chunkData = {
                content: chunk.content,
                page: chunk.pageNumber,
                similarity: chunk.similarityScore,
              };
              if (existing) {
                existing.chunks.push(chunkData);
              } else {
                chunksByDoc.set(chunk.documentId, {
                  documentName: chunk.documentName,
                  chunks: [chunkData],
                });
              }
            }

            const projectDocs = Array.from(chunksByDoc.entries()).map(([docId, data]) => ({
              documentId: docId,
              documentName: data.documentName,
              chunks: data.chunks,
            }));

            // Merge with conversation attachment context (avoid duplicates by docId)
            const existingDocIds = new Set(documentContext.map((d) => d.documentId));
            for (const doc of projectDocs) {
              if (!existingDocIds.has(doc.documentId)) {
                documentContext.push(doc);
              }
            }

            // Update attachment chunks with project chunks if not already set
            // (for confidence calculation later)
            if (!attachmentChunks) {
              attachmentChunks = {
                chunks: projectChunks.chunks,
                confidence: projectChunks.confidence,
                attachments: projectChunks.documents,
              };
            }
          }

          // AC-17.2.7: Include structured extraction data from project documents
          if (projectChunks.structuredContext) {
            projectDocumentContext = projectChunks.structuredContext;
          }

          log.info('RAG context retrieved for project documents', {
            projectId,
            documentCount: projectChunks.documents.length,
            chunkCount: projectChunks.chunks.length,
            hasStructuredContext: !!projectChunks.structuredContext,
            confidence: projectChunks.confidence,
          });
        } catch (ragError) {
          log.error(
            'Failed to retrieve project document RAG context',
            ragError instanceof Error ? ragError : new Error(String(ragError)),
            { projectId }
          );
          // Continue without project document RAG
        }
      }
    }

    // Build system prompt with guardrails (AC15-AC20)
    // Story 18.3: Pass complete preferences including licensedStates (AC-18.3.5)
    const { systemPrompt } = buildSystemPrompt({
      userPreferences: userPreferences
        ? {
            displayName: userPreferences.displayName as string | undefined,
            role: userPreferences.role as 'producer' | 'csr' | 'manager' | 'other' | undefined,
            linesOfBusiness: userPreferences.linesOfBusiness as string[] | undefined,
            favoriteCarriers: userPreferences.favoriteCarriers as string[] | undefined,
            communicationStyle: userPreferences.communicationStyle as 'professional' | 'casual' | undefined,
            agencyName: userPreferences.agencyName as string | undefined,
            licensedStates: userPreferences.licensedStates as string[] | undefined,
          }
        : undefined,
      guardrailConfig,
      guardrailCheckResult,
      documentContext,
      projectName,
      // Story 17.2: Include structured extraction data from project documents (AC-17.2.7)
      structuredExtractionContext: projectDocumentContext,
    });

    // Build messages for LLM
    const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (excluding current message which we just saved)
    if (historyMessages) {
      for (const msg of historyMessages.slice(0, -1)) {
        llmMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current user message
    llmMessages.push({ role: 'user', content: message });

    // Story 18.3: Log preference injection details (AC-18.3.6)
    log.info('AI Buddy chat request processing', {
      conversationId: activeConversationId,
      userId: user.id,
      messageCount: llmMessages.length,
      isNewConversation,
      guardrailsApplied: guardrailCheckResult.appliedRules,
      preferencesInjected: {
        hasCarriers: !!(userPreferences?.favoriteCarriers as string[] | undefined)?.length,
        hasLOB: !!(userPreferences?.linesOfBusiness as string[] | undefined)?.length,
        hasStates: !!(userPreferences?.licensedStates as string[] | undefined)?.length,
        style: (userPreferences?.communicationStyle as string | undefined) ?? 'professional',
      },
    });

    // Create streaming response (AC-15.3.1, AC-15.3.4)
    const encoder = new TextEncoder();
    const finalConversationId = activeConversationId!;
    const hasDocumentContext = documentContext.length > 0;
    // Story 17.1: Use RAG confidence if available (mapped to AI Buddy levels)
    const mappedRagConfidence = attachmentChunks?.confidence
      ? mapRagConfidenceToAiBuddy(attachmentChunks.confidence)
      : null;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const openai = getLLMClient();
          const modelId = getModelId();

          const completion = await openai.chat.completions.create({
            model: modelId,
            messages: llmMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          });

          let fullResponse = '';

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              // Emit chunk event (AC-15.3.4)
              const event: AiBuddySSEEvent = { type: 'chunk', content };
              controller.enqueue(encoder.encode(formatSSEEvent(event)));
            }
          }

          // Extract citations from response (AC1-AC5)
          const citations = extractCitationsFromResponse(fullResponse, documentContext);

          // Calculate confidence level (AC9-AC11)
          // Story 17.1: Use RAG confidence if available, otherwise calculate from response
          const confidence = mappedRagConfidence ?? calculateConfidence(hasDocumentContext, citations, fullResponse);

          // Emit sources event (AC5: SSE includes citation data)
          const sourcesEvent: AiBuddySSEEvent = { type: 'sources', citations };
          controller.enqueue(encoder.encode(formatSSEEvent(sourcesEvent)));

          // Emit confidence event (AC8: SSE includes confidence data)
          const confidenceEvent: AiBuddySSEEvent = { type: 'confidence', level: confidence };
          controller.enqueue(encoder.encode(formatSSEEvent(confidenceEvent)));

          // Save assistant message to database with citations and confidence (T9, T14)
          // Cast citations to JSON-compatible format for Supabase
          const sourcesJson = citations.length > 0
            ? citations.map((c) => ({
                documentId: c.documentId,
                documentName: c.documentName,
                page: c.page,
                text: c.text,
                startOffset: c.startOffset,
                endOffset: c.endOffset,
              }))
            : null;

          const { data: assistantMessage, error: saveError } = await supabase
            .from('ai_buddy_messages')
            .insert({
              conversation_id: finalConversationId,
              agency_id: agencyId,
              role: 'assistant',
              content: fullResponse,
              sources: sourcesJson,
              confidence,
            })
            .select('id')
            .single();

          if (saveError) {
            log.error('Failed to save assistant message', saveError);
          }

          // Update conversation updated_at
          await supabase
            .from('ai_buddy_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', finalConversationId);

          // Log message received event
          if (assistantMessage) {
            await logMessageEvent(
              agencyId,
              user.id,
              finalConversationId,
              assistantMessage.id,
              'assistant',
              fullResponse.length,
              citations.length > 0,
              confidence
            );
          }

          // Emit done event (AC-15.3.4)
          const doneEvent: AiBuddySSEEvent = {
            type: 'done',
            conversationId: finalConversationId,
            messageId: assistantMessage?.id,
          };
          controller.enqueue(encoder.encode(formatSSEEvent(doneEvent)));

          const duration = Date.now() - startTime;
          log.info('AI Buddy chat response complete', {
            conversationId: finalConversationId,
            messageId: assistantMessage?.id,
            responseLength: fullResponse.length,
            citationCount: citations.length,
            confidence,
            duration,
          });

          controller.close();
        } catch (error) {
          log.error(
            'AI Buddy streaming error',
            error instanceof Error ? error : new Error(String(error))
          );

          // Emit error event (AC-15.3.4)
          const errorEvent: AiBuddySSEEvent = {
            type: 'error',
            error: 'AI provider error. Please try again.',
            code: 'AIB_004',
          };
          controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
          controller.close();
        }
      },
    });

    // Return SSE response (AC-15.3.1)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('AI Buddy chat API error', error instanceof Error ? error : new Error(String(error)));
    return createErrorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong. Please try again.',
      500
    );
  }
}
