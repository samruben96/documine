# Story 13.3: Remove Document AI Code

**Epic:** 13 - LlamaParse Migration
**Status:** TODO
**Priority:** P1 - Technical Debt
**Points:** 2
**Created:** 2025-12-06

---

## User Story

**As a** developer
**I want** Document AI code removed from the codebase
**So that** we have clean, maintainable code without dead code paths

---

## Background

Epic 12 (Google Document AI migration) was abandoned after encountering multiple critical issues. The Document AI code should be removed to:
- Reduce codebase complexity
- Remove unused dependencies
- Clean up environment variables
- Prevent confusion about which parser is active

---

## Acceptance Criteria

### AC-13.3.1: Remove Document AI Client
- [ ] Delete `supabase/functions/process-document/documentai-client.ts`
- [ ] Remove all imports of documentai-client
- [ ] Remove any Document AI type definitions

### AC-13.3.2: Remove GCP Configuration
- [ ] Remove GCP-related environment variable reads
- [ ] Remove GCP service account handling
- [ ] Remove GCS upload/download functions (if not used elsewhere)

### AC-13.3.3: Clean Up Index.ts
- [ ] Remove Document AI fallback logic
- [ ] Remove batch processing code paths
- [ ] Remove GCS-related imports
- [ ] Simplify parseDocumentWithRetry to only use LlamaParse

### AC-13.3.4: Remove Environment Variables
- [ ] Document which env vars to remove from Supabase:
  - `GCP_PROJECT_ID`
  - `GCP_LOCATION`
  - `GCP_PROCESSOR_ID`
  - `GCP_SERVICE_ACCOUNT_KEY`
  - `GCS_BUCKET`
- [ ] Update any .env.example files

### AC-13.3.5: Update Documentation
- [ ] Update CLAUDE.md if it references Document AI
- [ ] Update architecture docs
- [ ] Remove Epic 12 tech spec references from active docs

### AC-13.3.6: Build Verification
- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] Edge function deploys successfully

---

## Technical Design

### Files to Delete

| File | Reason |
|------|--------|
| `supabase/functions/process-document/documentai-client.ts` | Epic 12 abandoned |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/process-document/index.ts` | Remove Document AI imports and logic |

### Environment Variables to Remove

```bash
# Remove from Supabase Edge Function secrets
GCP_PROJECT_ID
GCP_LOCATION
GCP_PROCESSOR_ID
GCP_SERVICE_ACCOUNT_KEY
GCS_BUCKET
```

---

## Cleanup Checklist

### Code Cleanup
- [ ] Delete documentai-client.ts
- [ ] Remove Document AI imports from index.ts
- [ ] Remove batch processing functions
- [ ] Remove GCS helper functions (if unused)
- [ ] Remove Document AI type definitions

### Configuration Cleanup
- [ ] Remove GCP env vars from Supabase dashboard
- [ ] Update .env.example (if exists)
- [ ] Remove GCP credentials from any config files

### Documentation Cleanup
- [ ] Update claude-md files
- [ ] Archive Epic 12 documentation (already marked abandoned)
- [ ] Update architecture.md if needed

---

## Testing Requirements

### Build Verification
- [ ] TypeScript compilation succeeds
- [ ] No unused import warnings
- [ ] Edge function bundles correctly

### Deployment Verification
- [ ] `npx supabase functions deploy process-document` succeeds
- [ ] Function invocation works
- [ ] No runtime errors from missing code

---

## Definition of Done

- [ ] All Document AI code removed
- [ ] Build passes
- [ ] Tests pass
- [ ] Edge function deploys
- [ ] Document upload still works (using LlamaParse)
- [ ] Code reviewed

---

## Dependencies

- Story 13.2 complete and verified (LlamaParse working in production)

---

## Notes

- Do NOT remove until Story 13.2 is fully tested
- Keep Epic 12 documentation for historical reference (marked abandoned)
- Sam may want to keep GCP credentials for other purposes - confirm before deleting from GCP console

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Story created | SM Agent |
