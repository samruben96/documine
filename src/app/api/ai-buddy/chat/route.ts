/**
 * AI Buddy Chat API Route
 * Story 14.2: API Route Structure
 *
 * POST /api/ai-buddy/chat - Send a message and receive AI response (streaming)
 * Stub implementation - actual chat functionality in Epic 15.
 */

import { notImplementedResponse } from '@/lib/ai-buddy';

/**
 * POST /api/ai-buddy/chat
 * Send a message and receive AI response via SSE stream
 *
 * Request body:
 * {
 *   conversationId?: string;  // Optional, creates new if not provided
 *   projectId?: string;       // Optional project context
 *   message: string;
 *   attachments?: { documentId: string; type: 'pdf' | 'image'; }[];
 * }
 *
 * Response: SSE Stream
 * data: {"type":"chunk","content":"Based on..."}
 * data: {"type":"sources","citations":[...]}
 * data: {"type":"confidence","level":"high"}
 * data: {"type":"done","conversationId":"...","messageId":"..."}
 */
export async function POST(): Promise<Response> {
  return notImplementedResponse();
}
