# Key Learnings

## 1. Supabase Query Modifiers Are Critical

**Learning:** `.single()` vs `.maybeSingle()` have very different behaviors.

```typescript
// ❌ Bad - throws 406 when no rows match
.single()

// ✅ Good - returns null gracefully when no rows match
.maybeSingle()
```

**Rule:** Use `.maybeSingle()` for any query where 0 rows is a valid outcome.

## 2. Score Semantics Must Be Preserved

**Learning:** Different scoring systems need separate thresholds.

```typescript
// Vector similarity (cosine): 0.75/0.50 thresholds
// Cohere reranker: 0.30/0.10 thresholds

// Keep both scores, don't overwrite
{
  similarityScore: vectorScore,  // Original preserved
  rerankerScore: cohereScore,    // Added separately
}
```

**Rule:** Never overwrite scores with semantically different values.

## 3. Conditional Rendering vs CSS Hiding

**Learning:** CSS hiding (display:none) still renders components and attaches refs.

**Problem:** Two DocumentViewer instances in DOM, ref attached to hidden one.

**Solution:** Use React conditional rendering to ensure only one instance exists:
```tsx
// ❌ CSS hiding - both instances exist
<div className="hidden lg:block"><DocumentViewer /></div>
<div className="lg:hidden"><DocumentViewer /></div>

// ✅ Conditional rendering - one instance
{isMobile ? <MobileViewer /> : <DesktopViewer />}
```

## 4. Story Consolidation Improves Velocity

**Learning:** Related small stories should be combined.

**Before:** 3 stories (6.7, 6.8, 6.9) with overlapping files
**After:** 1 story (6.7) with 15 ACs and shared implementation

**Rule:** If stories touch the same files, consider combining.

## 5. Phased Approach for Large Scope

**Learning:** Large stories benefit from explicit phases.

**Story 6.8 Pattern:**
- Phase 1: Core changes (6 ACs)
- UX Audit: Screenshot capture + designer review
- Phase 2: Enhancements based on audit (12 ACs)

**Rule:** If story has 10+ ACs, consider phased delivery.

## 6. Cohere Model Names Matter

**Learning:** `rerank-v3.5` is correct, not `rerank-english-v3.5`.

```typescript
// ❌ Returns 404
const RERANK_MODEL = 'rerank-english-v3.5';

// ✅ Correct model identifier
const RERANK_MODEL = 'rerank-v3.5';
```

**Rule:** Always verify API model names against current documentation.

---
