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
  getOrCreateConversation,
  saveUserMessage,
  saveAssistantMessage,
  getConversationHistory,
} from '@/lib/chat/service';
import {
  retrieveContext,
  buildPrompt,
  chunksToSourceCitations,
  getNotFoundMessage,
  shouldShowNotFound,
} from '@/lib/chat/rag';
import { createChatStream } from '@/lib/chat/openai-stream';
import type { SourceCitation } from '@/lib/chat/types';

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
    const conversation = await getOrCreateConversation(
      supabase,
      documentId,
      user.id,
      agencyId
    );

    // Save user message
    await saveUserMessage(supabase, conversation.id, agencyId, message);

    // Get conversation history for context
    const history = await getConversationHistory(supabase, conversation.id);
    // Exclude the message we just saved (it's at the end)
    const previousMessages = history.slice(0, -1);

    // Get OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      log.error('OPENAI_API_KEY not configured', new Error('Missing API key'));
      return errorResponse('CONFIG_ERROR', 'Service not configured', 500);
    }

    // Retrieve RAG context
    const ragContext = await retrieveContext(
      supabase,
      documentId,
      message,
      openaiApiKey
    );

    // Build prompt with context
    const promptMessages = buildPrompt(message, ragContext.chunks, previousMessages);

    // Convert chunks to source citations for storage
    const sources: SourceCitation[] = chunksToSourceCitations(ragContext.chunks);

    log.info('Chat request processing', {
      documentId,
      conversationId: conversation.id,
      userId: user.id,
      confidence: ragContext.confidence,
      chunksRetrieved: ragContext.chunks.length,
    });

    // Handle "not found" case with immediate response
    if (shouldShowNotFound(ragContext.confidence)) {
      // For not_found, we still stream but with the not found message
      const notFoundMessage = getNotFoundMessage();

      // Update prompt to use not found message
      const lastMessage = promptMessages[promptMessages.length - 1];
      if (lastMessage) {
        lastMessage.content =
          `DOCUMENT CONTEXT: No relevant sections found for this query.\n\n` +
          `USER QUESTION: ${message}\n\n` +
          `Please respond with: "${notFoundMessage}"`;
      }
    }

    // Create streaming response
    const stream = createChatStream({
      messages: promptMessages,
      apiKey: openaiApiKey,
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

    // Log and return generic error
    log.error(
      'Chat API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return errorResponse(
      'INTERNAL_ERROR',
      'Something went wrong. Please try again.',
      500
    );
  }
}
