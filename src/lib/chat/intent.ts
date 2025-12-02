/**
 * Query Intent Classification
 *
 * Classifies user queries to determine if they are document queries
 * or conversational messages (greetings, thanks, etc.).
 *
 * This allows the chat system to respond naturally to greetings
 * instead of forcing a "not found" response.
 *
 * @module @/lib/chat/intent
 */

/**
 * Query intent types
 * - document_query: User is asking about document content
 * - greeting: User is greeting the assistant
 * - gratitude: User is expressing thanks
 * - farewell: User is saying goodbye
 * - meta: User is asking about the assistant's capabilities
 */
export type QueryIntent =
  | 'document_query'
  | 'greeting'
  | 'gratitude'
  | 'farewell'
  | 'meta';

/**
 * Pattern matchers for different intents
 * These patterns match the START of the message to avoid false positives
 */
const GREETING_PATTERNS = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|yo)\s*[!.,?]?\s*$/i;
const GRATITUDE_PATTERNS = /^(thanks?|thank\s*you|thx|ty|appreciate\s*it|cheers)\s*[!.,?]?\s*$/i;
const FAREWELL_PATTERNS = /^(bye|goodbye|see\s*you|later|take\s*care|cya)\s*[!.,?]?\s*$/i;
const META_PATTERNS = /^(what\s*(can\s*you|do\s*you)\s*(do|help)|help|who\s*are\s*you|what\s*are\s*you)\s*[!.,?]?\s*$/i;

/**
 * Extended patterns for greetings with additional text
 * e.g., "hello there", "hi, how are you"
 */
const GREETING_EXTENDED = /^(hi|hello|hey)\s*(there|,?\s*(how\s*are\s*you|how's\s*it\s*going))?\s*[!.,?]?\s*$/i;

/**
 * Classify the intent of a user query
 *
 * @param query - The user's message
 * @returns The classified intent type
 *
 * @example
 * classifyIntent("hello") // returns 'greeting'
 * classifyIntent("What is my deductible?") // returns 'document_query'
 * classifyIntent("thanks!") // returns 'gratitude'
 */
export function classifyIntent(query: string): QueryIntent {
  const trimmed = query.trim();

  // Empty or very short queries default to document query
  if (trimmed.length === 0) {
    return 'document_query';
  }

  // Check for greeting patterns (including extended)
  if (GREETING_PATTERNS.test(trimmed) || GREETING_EXTENDED.test(trimmed)) {
    return 'greeting';
  }

  // Check for gratitude
  if (GRATITUDE_PATTERNS.test(trimmed)) {
    return 'gratitude';
  }

  // Check for farewell
  if (FAREWELL_PATTERNS.test(trimmed)) {
    return 'farewell';
  }

  // Check for meta questions about the assistant
  if (META_PATTERNS.test(trimmed)) {
    return 'meta';
  }

  // Default to document query
  return 'document_query';
}

/**
 * Check if the intent is conversational (non-document query)
 *
 * @param intent - The classified intent
 * @returns True if the intent is conversational
 */
export function isConversationalIntent(intent: QueryIntent): boolean {
  return intent !== 'document_query';
}
