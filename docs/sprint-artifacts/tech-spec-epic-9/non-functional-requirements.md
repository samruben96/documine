# Non-Functional Requirements

## Performance

| Metric | Target | Implementation Strategy |
|--------|--------|------------------------|
| PDF generation time | < 3 seconds | Client-side generation, lazy-load logo |
| Preview update latency | < 500ms | React state, no server round-trip |
| Page load time | < 2 seconds | SSR, code splitting |
| Logo upload | < 5 seconds | Direct to Supabase Storage |

## Security

| Requirement | Implementation |
|-------------|---------------|
| Admin-only branding access | RLS policy: `role = 'admin'` for UPDATE on agencies |
| Logo storage isolation | Storage path: `branding/{agencyId}/...` with RLS |
| No PII in generated PDFs | Client name is user-entered, no auto-population |
| Document access control | Existing RLS policies on documents, comparisons |

```sql
-- RLS policy for branding updates (admin only)
CREATE POLICY "Admins can update branding" ON agencies
  FOR UPDATE
  USING (
    id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Storage policy for branding bucket
CREATE POLICY "Upload to own agency branding folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'branding' AND
    (storage.foldername(name))[1] = (SELECT agency_id::text FROM users WHERE id = auth.uid()) AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

## Reliability/Availability

| Requirement | Implementation |
|-------------|---------------|
| Graceful degradation | If logo fetch fails, use agency name text |
| No data loss | PDF generated client-side, no server state |
| Error feedback | Toast notifications for all failures |
| Offline support | Not required (needs data from server) |

## Observability

| Signal | Implementation |
|--------|---------------|
| Generation events | `log.info('One-pager generated', { mode, agencyId })` |
| Error tracking | `log.error('PDF generation failed', error)` |
| Usage metrics | Future: Track generation count per agency |

---
