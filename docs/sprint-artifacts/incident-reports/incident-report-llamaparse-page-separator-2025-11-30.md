# Incident Report: LlamaParse Page Separator Not Working

**Date:** 2025-11-30
**Severity:** High
**Epic:** Epic 4 - Document Management
**Stories Affected:** 4-6 (Document Processing Pipeline)
**Status:** RESOLVED

---

## Executive Summary

All documents processed through LlamaParse were incorrectly showing `page_count=1` regardless of actual page count. This meant multi-page documents were being treated as single-page, affecting chunking accuracy and page attribution in search results.

**Root Cause:** The LlamaParse API uses `{pageNumber}` (camelCase) for the page separator placeholder, but our code was using `{page_number}` (snake_case). This caused the placeholder to remain as literal text instead of being replaced with actual page numbers.

---

## Timeline

| Time | Event |
|------|-------|
| Initial Implementation | Code deployed with `{page_number}` placeholder |
| Story 5.2 Development | User notices all documents show page_count=1 |
| Investigation | Searched LlamaIndex GitHub issues |
| Fix Applied | Changed to `{pageNumber}` in both files |
| Deployed | Edge Function redeployed (version 3) |

---

## Investigation Process

### Database State Analysis

Query on documents table showed:
```sql
SELECT filename, page_count FROM documents;
-- All documents returned page_count = 1
```

Multi-page PDFs were confirmed to exist but database showed single page.

### API Documentation Research

- LlamaIndex GitHub Issue #537: Documents inconsistent placeholder naming
- LlamaIndex GitHub Issue #721: Confirms `{pageNumber}` is correct format
- Web search on LlamaParse API confirmed camelCase convention

### Code Analysis

The page separator parameter was being sent as:
```typescript
// BEFORE (broken)
formData.append('page_separator', '--- PAGE {page_number} ---');
```

LlamaParse expects:
```typescript
// AFTER (fixed)
formData.append('page_separator', '--- PAGE {pageNumber} ---');
```

---

## Root Cause Analysis

### The Bug

Both files had the same issue:

**`supabase/functions/process-document/index.ts` (Line 338)**
```typescript
// BEFORE
formData.append('page_separator', '--- PAGE {page_number} ---');

// AFTER
formData.append('page_separator', '--- PAGE {pageNumber} ---');
```

**`src/lib/llamaparse/client.ts` (Line 107)**
```typescript
// BEFORE
formData.append('page_separator', '--- PAGE {page_number} ---');

// AFTER
formData.append('page_separator', '--- PAGE {pageNumber} ---');
```

### Why This Happened

1. **API Documentation Gap**: LlamaParse API documentation doesn't clearly specify the placeholder format
2. **Inconsistent Naming**: Snake_case is common in API parameters, but LlamaParse uses camelCase for this specific placeholder
3. **No Immediate Error**: The API accepts the invalid placeholder without error - it just doesn't replace it
4. **Missing Validation**: No test verified that page markers actually appeared in parsed output

---

## Resolution

### 1. Code Fix

Changed `{page_number}` to `{pageNumber}` in both:
- `supabase/functions/process-document/index.ts`
- `src/lib/llamaparse/client.ts`

Added clarifying comment:
```typescript
// Note: LlamaParse uses {pageNumber} (camelCase), not {page_number}
```

### 2. Edge Function Deployment

```bash
# Deployed via Supabase MCP
mcp__supabase__deploy_edge_function(
  project_id: "qfhzvkqbbtxvmwiixlhf",
  name: "process-document",
  files: [...]
)
# Result: version 3 deployed successfully
```

### 3. Git Commit

```bash
git commit -m "fix: correct LlamaParse page_separator placeholder format"
git push origin main
# Commit: 5ebe558
```

---

## Verification

To verify the fix:
1. Upload a new multi-page PDF document
2. Check database: `SELECT filename, page_count FROM documents ORDER BY created_at DESC LIMIT 1;`
3. Verify `page_count` matches actual PDF page count
4. Check `document_chunks` table has varying `page_number` values

**Note:** Documents processed before the fix will retain `page_count=1`. They would need to be re-processed to get correct page counts.

---

## Lessons Learned

### What Went Wrong

1. **API Documentation Assumption**: Assumed snake_case based on other parameters
2. **No Output Validation**: Tests didn't verify page markers appeared in parsed content
3. **Silent Failure**: LlamaParse doesn't error on invalid placeholders

### Process Improvements

1. **Add Integration Tests for External APIs**
   - Verify page markers appear in LlamaParse output
   - Test with actual multi-page PDF

2. **API Documentation Deep Dive**
   - When using third-party APIs, search GitHub issues for gotchas
   - Don't assume naming conventions

3. **Output Validation**
   - Log sample of parsed output during development
   - Verify expected patterns exist before proceeding

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/process-document/index.ts` | Fixed placeholder: `{page_number}` → `{pageNumber}` |
| `src/lib/llamaparse/client.ts` | Fixed placeholder: `{page_number}` → `{pageNumber}` |

---

## Related Documentation

- Story 4-6: Document Processing Pipeline (LlamaParse)
- CLAUDE.md: Known Issues section updated
- LlamaIndex GitHub Issues: #537, #721
- Commit: 5ebe558

---

## Supabase Project Reference

- **Project ID:** `qfhzvkqbbtxvmwiixlhf`
- **Edge Function:** `process-document` (version 3)
