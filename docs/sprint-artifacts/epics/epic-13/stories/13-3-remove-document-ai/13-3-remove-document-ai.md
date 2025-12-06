# Story 13.3: Remove Document AI & Docling Code

**Epic:** 13 - LlamaParse Migration
**Status:** drafted
**Priority:** P1 - Technical Debt
**Points:** 3
**Created:** 2025-12-06

---

## User Story

**As a** developer
**I want** all Document AI and Docling code removed from the codebase
**So that** we have clean, maintainable code with only LlamaParse as the parser

---

## Background

Now that LlamaParse is fully integrated (Story 13.2), we should remove:
1. **Document AI code** - Epic 12 was abandoned after encountering multiple critical issues
2. **Docling code** - The original parser service hosted on Railway (can cancel Railway account after this)

Benefits:
- Reduce codebase complexity
- Remove unused dependencies
- Clean up environment variables
- Prevent confusion about which parser is active
- **Cancel Railway account** (Docling service no longer needed)

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

### AC-13.3.3: Remove Docling Code
- [ ] Remove any Docling-related imports and functions
- [ ] Remove `DOCLING_SERVICE_URL` environment variable reads
- [ ] Remove Docling API client code (if separate file exists)
- [ ] Remove Docling-specific error handling

### AC-13.3.4: Clean Up Index.ts
- [ ] Remove Document AI fallback logic
- [ ] Remove Docling fallback logic
- [ ] Remove batch processing code paths
- [ ] Remove GCS-related imports
- [ ] Simplify parseDocumentWithRetry to only use LlamaParse
- [ ] Remove any dead code paths for old parsers

### AC-13.3.5: Remove Environment Variables
- [ ] Document which env vars to remove from Supabase:
  - `GCP_PROJECT_ID`
  - `GCP_LOCATION`
  - `GCP_PROCESSOR_ID`
  - `GCP_SERVICE_ACCOUNT_KEY`
  - `GCS_BUCKET`
  - `DOCLING_SERVICE_URL`
- [ ] Update any .env.example files

### AC-13.3.6: Update Documentation
- [ ] Update CLAUDE.md if it references Document AI or Docling
- [ ] Update architecture docs to reflect LlamaParse-only
- [ ] Remove Epic 12 tech spec references from active docs
- [ ] Add note about Railway account cancellation

### AC-13.3.7: Build Verification
- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] Edge function deploys successfully
- [ ] Test document upload works with LlamaParse

---

## Technical Design

### Files to Delete

| File | Reason |
|------|--------|
| `supabase/functions/process-document/documentai-client.ts` | Epic 12 abandoned |
| Any Docling-specific client files | Replaced by LlamaParse |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/process-document/index.ts` | Remove Document AI and Docling imports/logic |

### Environment Variables to Remove

```bash
# Remove from Supabase Edge Function secrets

# GCP/Document AI (Epic 12)
GCP_PROJECT_ID
GCP_LOCATION
GCP_PROCESSOR_ID
GCP_SERVICE_ACCOUNT_KEY
GCS_BUCKET

# Docling (Railway service)
DOCLING_SERVICE_URL
```

### External Services

| Service | Status |
|---------|--------|
| Railway (Docling) | ✅ CANCELLED (2025-12-06) |
| GCP Document AI | Keep credentials (may use for other purposes) |

---

## Cleanup Checklist

### Code Cleanup
- [ ] Delete documentai-client.ts
- [ ] Remove Document AI imports from index.ts
- [ ] Remove Docling imports and functions from index.ts
- [ ] Remove batch processing functions
- [ ] Remove GCS helper functions (if unused)
- [ ] Remove Document AI type definitions
- [ ] Remove Docling type definitions

### Configuration Cleanup
- [ ] Remove GCP env vars from Supabase dashboard
- [ ] Remove DOCLING_SERVICE_URL from Supabase dashboard
- [ ] Update .env.example (if exists)
- [ ] Remove GCP credentials from any config files

### Documentation Cleanup
- [ ] Update claude-md files (remove Docling service URL references)
- [ ] Archive Epic 12 documentation (already marked abandoned)
- [ ] Update architecture.md to reflect LlamaParse-only
- [ ] Note: Cancel Railway account after Story 13.4 validation

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
- [ ] All Docling code removed
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
- ~~Railway account can be cancelled~~ **Railway account CANCELLED** (2025-12-06) - Docling no longer needed

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-06 | Story created | SM Agent |
| 2025-12-06 | Added Docling removal scope, Railway cancelled | SM Agent |
