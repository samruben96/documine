/**
 * Chat types for Story 5.3 AI Response with Streaming & Trust Elements
 * @module @/lib/chat/types
 */

import type { ConfidenceLevel } from '@/components/chat/confidence-badge';

/**
 * Bounding box for source highlight in document viewer
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Source citation from RAG retrieval
 * Used for displaying clickable source links in chat messages
 */
export interface SourceCitation {
  pageNumber: number;
  text: string;
  chunkId: string;
  boundingBox?: BoundingBox;
  similarityScore?: number;
}

/**
 * SSE stream event types
 */
export type SSEEventType = 'text' | 'source' | 'confidence' | 'done' | 'error';

/**
 * Payload when stream completes successfully
 */
export interface DonePayload {
  conversationId: string;
  messageId: string;
}

/**
 * Error payload for stream errors
 */
export interface ErrorPayload {
  code: string;
  message: string;
}

/**
 * SSE event with typed content based on event type
 */
export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'source'; content: SourceCitation }
  | { type: 'confidence'; content: ConfidenceLevel }
  | { type: 'done'; content: DonePayload }
  | { type: 'error'; content: ErrorPayload };

/**
 * Retrieved chunk from vector search
 */
export interface RetrievedChunk {
  id: string;
  content: string;
  pageNumber: number;
  boundingBox: BoundingBox | null;
  similarityScore: number;
}

/**
 * RAG context containing retrieved chunks and confidence
 */
export interface RAGContext {
  chunks: RetrievedChunk[];
  topScore: number | null;
  confidence: ConfidenceLevel;
}

/**
 * Chat request body
 */
export interface ChatRequest {
  documentId: string;
  message: string;
  conversationId?: string;
}

/**
 * Conversation record from database
 */
export interface Conversation {
  id: string;
  agencyId: string;
  documentId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat message record from database
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  agencyId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceCitation[] | null;
  confidence: ConfidenceLevel | null;
  createdAt: Date;
}
