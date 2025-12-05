# Non-Functional Requirements

## Performance

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| Document upload (< 50MB) | < 30 seconds | Direct upload to Supabase Storage with progress tracking | NFR1 |
| Document processing | < 2 minutes | LlamaParse ~6s + chunking ~5s + embeddings ~30s + DB writes | NFR2 |
| Document list load | < 500ms | Single query with agency_id filter, indexed | General |
| File picker response | < 100ms | Client-side file selection, no server round-trip | UX |
| Realtime status update | < 1 second | Supabase Realtime subscription on documents table | General |
| Signed URL generation | < 200ms | Supabase Storage API, 1-hour expiry | General |
| Search/filter documents | < 500ms | PostgreSQL ILIKE + GIN index on labels | General |

**Performance Optimizations:**
- Parallel uploads for multi-file (up to 5 concurrent)
- Batch embedding generation (20 chunks per API call)
- IVFFlat index on embeddings for O(log n) similarity search
- Skeleton loading states per UX spec (no spinners > 200ms)
- Optimistic UI updates for immediate feedback

## Security

| Requirement | Implementation | Source |
|-------------|----------------|--------|
| Data encrypted in transit | TLS 1.3 via Supabase/Vercel | NFR6 |
| Data encrypted at rest | AES-256 via Supabase managed | NFR7 |
| Agency isolation - database | RLS policies on documents, document_chunks, processing_jobs | NFR10 |
| Agency isolation - storage | Storage policies using agency_id path prefix | NFR10 |
| Signed URLs for file access | 1-hour expiry, agency-scoped | NFR11 |
| File type validation | Server-side MIME type check, not just extension | Security best practice |
| File size limits | 50MB max enforced client + server side | NFR1 |
| API key protection | LLAMA_CLOUD_API_KEY, OPENAI_API_KEY server-side only | Security best practice |
| Service role key | Used only in Edge Functions, never client-exposed | Supabase docs |

**Storage Security Policies:**

```sql
-- Storage bucket: documents
-- Path structure: {agency_id}/{document_id}/{filename}

-- Users can upload to their agency folder only
CREATE POLICY "Upload to agency folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
  );

-- Users can read from their agency folder only
CREATE POLICY "Read from agency folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
  );

-- Users can delete from their agency folder only
CREATE POLICY "Delete from agency folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid())
  );
```

## Reliability/Availability

| Requirement | Target | Implementation | Source |
|-------------|--------|----------------|--------|
| Upload reliability | 99.9% | Supabase Storage SLA, retry on failure | NFR22 |
| Processing reliability | 95%+ success rate | Retry once on LlamaParse failure, manual retry option | General |
| No data loss | Zero document loss | Storage + DB replication via Supabase | NFR22 |
| Graceful degradation | Processing queue backlog | Queue pending status visible, no blocking | NFR21 |
| Edge Function timeout | 150 seconds | Sufficient for most documents, large docs may timeout | Supabase limit |

**Error Recovery:**

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| Upload failure | HTTP error from Storage API | Client retry with exponential backoff (3 attempts) |
| LlamaParse failure | API error response | Retry once automatically, then mark failed |
| LlamaParse timeout | No response in 60s | Mark failed, allow manual retry |
| OpenAI embedding failure | API error response | Retry with exponential backoff (3 attempts) |
| Edge Function timeout | 150s limit exceeded | Mark failed, log partial progress |
| Database write failure | PostgreSQL error | Rollback transaction, mark failed |
| Storage delete failure | API error on cleanup | Log error, continue (orphaned file acceptable) |

## Observability

| Signal | Type | Implementation |
|--------|------|----------------|
| Document uploaded | Event log | `log.info('Document uploaded', { documentId, agencyId, filename, size })` |
| Processing started | Event log | `log.info('Processing started', { documentId, jobId })` |
| Processing completed | Event log | `log.info('Processing completed', { documentId, duration, chunkCount, pageCount })` |
| Processing failed | Error log | `log.error('Processing failed', error, { documentId, step, duration })` |
| LlamaParse latency | Metric | Track API call duration |
| OpenAI embeddings latency | Metric | Track API call duration per batch |
| Queue depth | Metric | Count of pending jobs per agency |
| Storage usage | Metric | Track bytes uploaded per agency |

**Structured Logging Format:**

```typescript
// All logs follow this format
{
  level: 'info' | 'warn' | 'error',
  message: string,
  timestamp: string, // ISO 8601
  documentId?: string,
  agencyId?: string,
  jobId?: string,
  duration?: number, // milliseconds
  error?: string,
  stack?: string,
  ...additionalContext
}
```

**Key Metrics to Track:**
- Documents uploaded per day/agency
- Processing success rate
- Average processing time by document size
- LlamaParse API latency (p50, p95, p99)
- OpenAI API latency (p50, p95, p99)
- Queue wait time (time from pending to processing)
- Storage usage by agency
