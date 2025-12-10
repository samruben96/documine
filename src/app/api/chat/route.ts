/**
 * Chat API Route - Streaming Endpoint
 *
 * Implements Story 5.3 streaming chat with SSE.
 * POST /api/chat
 *
 * AC-5.3.1: Streaming response display
 * AC-5.3.6: Confidence thresholds
 * AC-5.3.8: API timeout error handling
 * AC-5.3.9: Rate limit error handling
 * AC-5.3.10: Generic error handling
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/utils/api-response';
import { log } from '@/lib/utils/logger';
import { DocumentNotFoundError, UnauthorizedError } from '@/lib/errors';
import {
  checkRateLimit,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import {
  getOrCreateConversation,
  saveUserMessage,
  saveAssistantMessage,
  getConversationHistory,
} from '@/lib/chat/service';
import {
  retrieveContext,
  buildPrompt,
  buildPromptWithStructuredData,
  chunksToSourceCitations,
  getStructuredExtractionData,
  formatStructuredContext,
} from '@/lib/chat/rag';
import { classifyIntent } from '@/lib/chat/intent';
import { createChatStream } from '@/lib/chat/openai-stream';
import type { SourceCitation } from '@/lib/chat/types';
// Story 21.4: Audit logging for document chat actions
import { logDocumentChatStarted } from '@/lib/admin';

/**
 * Request validation schema per tech spec
 */
const chatRequestSchema = z.object({
  documentId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

/**
 * POST /api/chat
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
      log.warn('Chat request validation failed', {
        issues,
      });
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request: ' + (firstIssue?.message ?? 'Invalid input'),
        400
      );
    }

    const { documentId, message } = parseResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.warn('Chat unauthorized - no user session');
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Check rate limit - AC-8.5.2: 100 messages per hour per user
    const rateLimit = await checkRateLimit({
      entityType: RATE_LIMITS.chat.entityType,
      entityId: user.id,
      endpoint: '/api/chat',
      limit: RATE_LIMITS.chat.limit,
      windowMs: RATE_LIMITS.chat.windowMs,
    });

    if (!rateLimit.allowed) {
      log.warn('Chat rate limit exceeded', {
        userId: user.id,
        limit: rateLimit.limit,
        resetAt: rateLimit.resetAt.toISOString(),
      });
      return rateLimitExceededResponse(
        rateLimit,
        `You've reached the message limit (${RATE_LIMITS.chat.limit} per hour). Please try again later.`
      );
    }

    // Get user's agency
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      log.error('Failed to get user agency', userError ?? new Error('No user data'), {
        userId: user.id,
      });
      return errorResponse('UNAUTHORIZED', 'User not found', 401);
    }

    const agencyId = userData.agency_id;

    // Verify document exists and user has access (RLS)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, status')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      log.warn('Document not found or not accessible', {
        documentId,
        userId: user.id,
      });
      return errorResponse('DOCUMENT_NOT_FOUND', 'Document not found', 404);
    }

    if (document.status !== 'ready') {
      log.warn('Document not ready for chat', {
        documentId,
        status: document.status,
      });
      return errorResponse(
        'DOCUMENT_NOT_READY',
        'Document is still being processed',
        400
      );
    }

    // Get or create conversation
    const { conversation, isNewConversation } = await getOrCreateConversation(
      supabase,
      documentId,
      user.id,
      agencyId
    );

    // Story 21.4 (AC-21.4.4): Log document chat session start for new conversations
    if (isNewConversation) {
      await logDocumentChatStarted(
        agencyId,
        user.id,
        documentId,
        conversation.id
      );
    }

    // Save user message
    await saveUserMessage(supabase, conversation.id, agencyId, message);

    // Get conversation history for context
    const history = await getConversationHistory(supabase, conversation.id);
    // Exclude the message we just saved (it's at the end)
    const previousMessages = history.slice(0, -1);

    // Verify LLM configuration
    // OpenRouter: Needs OPENROUTER_API_KEY
    // OpenAI: Needs OPENAI_API_KEY (also needed for embeddings)
    const llmProvider = process.env.LLM_PROVIDER || 'openrouter';
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (llmProvider === 'openrouter' && !hasOpenRouterKey) {
      log.error('OPENROUTER_API_KEY not configured', new Error('Missing API key'));
      return errorResponse('CONFIG_ERROR', 'Service not configured', 500);
    }
    if (llmProvider === 'openai' && !hasOpenAIKey) {
      log.error('OPENAI_API_KEY not configured', new Error('Missing API key'));
      return errorResponse('CONFIG_ERROR', 'Service not configured', 500);
    }
    // OpenAI key is always needed for embeddings
    if (!hasOpenAIKey) {
      log.error('OPENAI_API_KEY not configured for embeddings', new Error('Missing API key'));
      return errorResponse('CONFIG_ERROR', 'Service not configured', 500);
    }

    const openaiApiKey = process.env.OPENAI_API_KEY!;

    // Classify query intent for logging/analytics (not used for decision making)
    const queryIntent = classifyIntent(message);

    log.info('Query intent classified', {
      documentId,
      intent: queryIntent,
    });

    // Retrieve RAG context
    const ragContext = await retrieveContext(
      supabase,
      documentId,
      message,
      openaiApiKey
    );

    // Story 10.12: Fetch structured extraction data for enhanced context
    // AC-10.12.6: Answer field queries from extraction_data
    const extractionData = await getStructuredExtractionData(supabase, documentId);
    const structuredContext = extractionData
      ? formatStructuredContext(extractionData)
      : undefined;

    // Build prompt with both structured and unstructured context
    const promptMessages = buildPromptWithStructuredData(
      message,
      ragContext.chunks,
      previousMessages,
      structuredContext
    );

    // Convert chunks to source citations for storage
    const sources: SourceCitation[] = chunksToSourceCitations(ragContext.chunks);

    log.info('Chat request processing', {
      documentId,
      conversationId: conversation.id,
      userId: user.id,
      confidence: ragContext.confidence,
      chunksRetrieved: ragContext.chunks.length,
      hasStructuredData: !!structuredContext, // Story 10.12
    });

    // Note: We no longer force a "not found" response.
    // The system prompt instructs GPT to say "I don't see that covered in this document"
    // when information isn't available. This allows GPT to:
    // - Respond naturally to greetings ("hello")
    // - Give helpful general answers ("what can you tell me about this document?")
    // - Appropriately say "not found" for specific questions with no matching context
    // The confidence level is still tracked for UI display (badge color)

    // Create streaming response
    log.info('Creating chat stream', {
      documentId,
      conversationId: conversation.id,
      messageCount: promptMessages.length,
    });

    const stream = createChatStream({
      messages: promptMessages,
      sources,
      confidence: ragContext.confidence,
      conversationId: conversation.id,
      onComplete: async (fullResponse) => {
        // Save assistant message to database
        const savedMessage = await saveAssistantMessage(
          supabase,
          conversation.id,
          agencyId,
          fullResponse,
          sources,
          ragContext.confidence
        );

        const duration = Date.now() - startTime;
        log.info('Chat response complete', {
          documentId,
          conversationId: conversation.id,
          messageId: savedMessage.id,
          responseLength: fullResponse.length,
          confidence: ragContext.confidence,
          duration,
        });

        return savedMessage.id;
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof DocumentNotFoundError) {
      return errorResponse(error.code, error.message, 404);
    }
    if (error instanceof UnauthorizedError) {
      return errorResponse(error.code, error.message, 401);
    }

    // Log and return error with details for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    log.error(
      'Chat API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return errorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong. Please try again.',
      500,
      process.env.NODE_ENV === 'development' ? { stack: errorStack } : undefined
    );
  }
}
