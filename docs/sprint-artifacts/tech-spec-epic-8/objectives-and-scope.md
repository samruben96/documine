# Objectives and Scope

## In Scope

- **Security Hardening (Story 8.1):** Set explicit `search_path = public, extensions` on all 7 database functions; enable leaked password protection in Supabase Auth
- **RLS Performance (Story 8.2):** Optimize 28 RLS policies to use `(SELECT auth.uid())` pattern for single evaluation instead of per-row re-evaluation
- **Index Optimization (Story 8.3):** Add missing foreign key indexes on 8 columns across 7 tables
- **RLS Consolidation (Story 8.4):** Merge multiple permissive SELECT policies on `processing_jobs` into single optimized policy
- **Rate Limiting (Story 8.5):** Implement per-agency and per-user rate limits on `/api/compare` and `/api/chat` endpoints
- **Test Fix (Story 8.6):** Fix failing `useAgencyId` test from Epic 5
- **Code Quality (Story 8.7):** Update model name references, resolve TODO/FIXME comments, regenerate TypeScript types

## Out of Scope

- New features (deferred to Epic 9+)
- UI/UX changes beyond error displays for rate limiting
- Mobile optimization (Epic F4)
- Source text highlighting (Epic F5)
- Any Phase 2 PRD features
