# Non-Functional Requirements

## Performance

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| First token latency | < 500ms | OpenAI streaming API starts immediately | NFR3 |
| Full response time | < 5 seconds for typical queries | GPT-4o with streaming, ~100 tokens/sec | NFR3 |
| Vector search latency | < 100ms | pgvector IVFFlat index, top 5 chunks | General |
| Query embedding generation | < 200ms | OpenAI text-embedding-3-small | General |
| PDF viewer initial load | < 2 seconds | react-pdf with lazy worker loading | General |
| Page navigation | < 100ms | Virtualized page rendering | General |
| Highlight scroll + render | < 300ms | Smooth scroll + CSS animation | UX Spec |
| Conversation history load | < 500ms | Single query with message join, indexed | General |
| Message persistence | < 200ms | Async save, doesn't block UI | General |

**Performance Optimizations:**
- Streaming responses provide perceived instant feedback
- Query embeddings generated on-demand (not cached) - freshness over speed
- PDF worker loaded from CDN to reduce bundle size
- Conversation messages loaded in single query with proper indexes
- Optimistic UI updates for user messages (appear instantly)
- Skeleton loading states per UX spec (no spinners > 200ms)

## Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Data encrypted in transit | TLS 1.3 via Supabase/Vercel | NFR6 |
| Data encrypted at rest | AES-256 via Supabase managed | NFR7 |
| Conversation isolation | RLS policies on conversations and chat_messages tables | NFR10 |
| Document access verification | Verify document.agency_id matches user's agency before RAG | NFR10 |
| API input validation | Zod schemas validate all chat requests | Security best practice |
| Message length limits | 1000 character max per message | DoS prevention |
| Rate limiting | 20 messages per minute per user | Abuse prevention |
| No PII in logs | Sanitize user messages before logging | Privacy |
| OpenAI API key protection | Server-side only, never exposed to client | Security best practice |

**RLS Policies for Chat:**

```sql
-- Conversations scoped to agency
CREATE POLICY "Conversations scoped to agency" ON conversations
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Chat messages scoped to agency
CREATE POLICY "Messages scoped to agency" ON chat_messages
  FOR ALL USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Users can only query their agency's document chunks
CREATE POLICY "Chunks scoped to agency" ON document_chunks
  FOR SELECT USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

## Reliability/Availability

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| Chat API availability | 99.9% | Vercel Edge + OpenAI SLA | NFR22 |
| Graceful degradation | Informative errors | Clear error messages when AI unavailable | FR34 |
| OpenAI timeout handling | 30 second timeout | Abort and show retry option | General |
| Conversation persistence | No message loss | Save to DB after each exchange | General |
| PDF viewer fallback | Show error state | If PDF fails to load, show retry option | FR34 |

**Error Recovery:**

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| OpenAI API timeout | 30s without response | Show "Taking longer than expected..." then error with retry |
| OpenAI rate limit (429) | HTTP 429 response | Show "Too many requests. Please wait a moment." |
| Vector search returns no chunks | Empty result set | Return "not_found" confidence, suggest rephrasing |
| Document not found | 404 from document query | Redirect to /documents with error toast |
| Stream connection dropped | SSE disconnect | Show partial response + "Connection lost. Retry?" |
| Invalid document ID | Zod validation fail | Return 400 with clear error message |

## Observability

| Signal | Type | Implementation |
|--------|------|----------------|
| Chat query received | Event log | `log.info('Chat query', { documentId, messageLength, userId })` |
| RAG retrieval complete | Event log | `log.info('RAG retrieval', { documentId, chunksRetrieved, topScore, confidence })` |
| OpenAI request sent | Event log | `log.info('OpenAI request', { model, promptTokens })` |
| Response streamed | Event log | `log.info('Response complete', { documentId, responseTokens, duration })` |
| Chat error | Error log | `log.error('Chat error', error, { documentId, step })` |
| Vector search latency | Metric | Track query time in ms |
| OpenAI latency | Metric | Track time-to-first-token and total duration |
| Confidence distribution | Metric | Track high/needs_review/not_found ratios |

**Key Metrics to Track:**
- Queries per day/user/agency
- Average response time (first token, complete)
- Confidence level distribution (are users getting useful answers?)
- Error rate by type (timeout, rate limit, not found)
- Conversation length (messages per conversation)
- Source citation click rate (are users verifying?)
