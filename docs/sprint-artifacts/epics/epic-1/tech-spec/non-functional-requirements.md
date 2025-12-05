# Non-Functional Requirements

## Performance

| Requirement | Target | Source |
|-------------|--------|--------|
| Database query latency | < 100ms for simple queries | Architecture spec |
| pgvector similarity search | < 500ms for top-5 chunks | Architecture spec |
| Page load (SSR) | < 1s initial load | NFR5 |
| Build time | < 3 minutes | Development workflow |

**Implementation:**
- Use connection pooling via Supabase
- IVFFlat index on embeddings with 100 lists
- Enable ISR where applicable
- Minimize bundle size

## Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Data in transit | TLS 1.2+ (Vercel + Supabase managed) | NFR6 |
| Data at rest | AES-256 (Supabase managed) | NFR7 |
| Tenant isolation | RLS policies with agency_id | NFR10 |
| API key protection | Environment variables, server-only | Architecture spec |
| Session management | httpOnly cookies, auto-refresh | NFR9 |

**RLS Policy Summary:**
```sql
-- All tables enforce agency_id matching authenticated user's agency
-- processing_jobs: service_role only (Edge Functions)
-- Storage: folder-based policies matching agency_id
```

## Reliability/Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| Uptime | 99.5% during business hours | Vercel + Supabase SLA |
| Data durability | No document loss | Supabase Storage redundancy |
| Graceful degradation | Partial outage handling | Error boundaries, fallback states |

**Implementation:**
- Vercel handles infrastructure availability
- Supabase provides managed PostgreSQL with automatic backups
- Error boundaries catch React errors and show recovery UI
- All database operations wrapped in try-catch

## Observability

| Signal | Implementation | Location |
|--------|----------------|----------|
| Structured logs | JSON format with timestamp, level, context | `src/lib/utils/logger.ts` |
| Error tracking | Console logging (upgrade to Sentry post-MVP) | Error handlers |
| Request logging | Next.js built-in + custom middleware | `src/middleware.ts` |

**Log Format:**
```json
{
  "level": "info|warn|error",
  "message": "Description",
  "timestamp": "ISO-8601",
  "documentId": "optional-context",
  "agencyId": "optional-context",
  "stack": "error-stack-trace-if-applicable"
}
```
