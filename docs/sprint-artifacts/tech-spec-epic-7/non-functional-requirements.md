# Non-Functional Requirements

## Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Extraction time per document | < 60 seconds | Timed from API call to extraction complete |
| Comparison generation (cached) | < 2 seconds | All extractions cached, only diff generation |
| Comparison generation (uncached, 4 docs) | < 4 minutes | Parallel extraction + diff |
| Table render time | < 500ms | Time from data received to DOM painted |
| Export generation (PDF) | < 10 seconds | Time from click to download |
| Export generation (CSV) | < 1 second | Client-side generation |

**Optimization Strategies:**
- Parallel extraction: Extract all documents concurrently (Promise.all)
- Extraction caching: Cache by document_id + extraction_version
- Lazy loading: Load document viewer only when source citation clicked
- Streaming progress: Show per-document extraction status as each completes

## Security

| Requirement | Implementation |
|-------------|----------------|
| Agency isolation | RLS policies on quote_extractions, comparisons tables |
| Document access | Validate all documentIds belong to user's agency before extraction |
| API authentication | Require valid session for all /api/compare endpoints |
| Input validation | Zod schema validation on all requests |
| Injection prevention | Parameterized queries only, no raw SQL |
| Rate limiting | Max 10 comparisons per hour per agency (prevent GPT cost abuse) |

**GPT-4o Cost Controls:**
- Extraction caching prevents re-extraction
- Rate limiting prevents abuse
- Max 4 documents per comparison limits per-request cost
- Estimated cost: ~$0.10-0.30 per document extraction (depending on size)

## Reliability/Availability

| Scenario | Handling |
|----------|----------|
| GPT-4o timeout | Retry once with exponential backoff, then mark extraction failed |
| GPT-4o rate limit | Queue extraction, retry after cooldown |
| Partial extraction failure | Return partial comparison with failed documents marked |
| Database unavailable | Return 503, no data loss (stateless extraction) |
| Export generation failure | Retry, show error toast if persistent |

**Fallback Strategy:**
- If GPT-4o unavailable, attempt extraction with Claude Sonnet 4.5 via OpenRouter
- Extraction schema compatible with both models

## Observability

| Log Event | Data Captured |
|-----------|---------------|
| `compare.initiated` | comparisonId, documentIds, userId, agencyId |
| `extraction.started` | documentId, chunkCount |
| `extraction.completed` | documentId, duration, tokenCount, fieldCount |
| `extraction.failed` | documentId, error, retryCount |
| `compare.completed` | comparisonId, duration, gapCount, conflictCount |
| `export.generated` | comparisonId, format, fileSize |

**Metrics Dashboard (Post-MVP):**
- Extraction success rate
- Average extraction time by document size
- Most common coverage types extracted
- Gap detection frequency
