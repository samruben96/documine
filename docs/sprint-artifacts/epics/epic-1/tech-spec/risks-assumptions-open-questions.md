# Risks, Assumptions, Open Questions

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R1: pgvector performance at scale | Query latency exceeds targets | Low | IVFFlat index, filter by document_id first |
| R2: RLS policy complexity | Security gaps or performance issues | Medium | Thorough testing, simple policy patterns |
| R3: Supabase Edge Function timeouts | Document processing fails | Medium | Chunked processing, retry logic |
| R4: Environment variable exposure | Security breach | Low | Server-only for sensitive keys |

## Assumptions

| Assumption | Rationale |
|------------|-----------|
| A1: Supabase local development via Docker works on developer machines | Standard Supabase workflow |
| A2: OpenAI embedding dimensions remain 1536 | Current standard for text-embedding-3-small |
| A3: Vercel-Supabase latency is acceptable | Both services in AWS us-east-1 |
| A4: 50MB file limit sufficient for insurance PDFs | Most policies < 20MB |

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Q1: Should we use Supabase branching for preview environments? | Sam | Defer to post-MVP |
| Q2: Rate limiting implementation - Upstash or custom? | Sam | Decision needed before Epic 2 |
| Q3: Error monitoring service selection (Sentry vs alternatives)? | Sam | Defer to post-MVP |
