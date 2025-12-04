# Story 8.7: Code Quality Cleanup

**Epic:** 8 - Tech Debt & Production Hardening
**Priority:** P3
**Effort:** S (1-2 hours)
**Added:** 2025-12-03
**Status:** done

---

## User Story

As a **developer**,
I want **code comments and documentation to accurately reflect current implementations**,
So that **future development is not confused by outdated references**.

---

## Context

Epic 7 introduced GPT-5.1 for quote extraction, but some code comments still referenced "GPT-4o". This creates confusion for future developers. Additionally, CLAUDE.md needed Epic 8 patterns documented.

---

## Acceptance Criteria

### AC-8.7.1: No GPT-4o References in Source Code Comments
**Given** the source code in `src/`
**When** searching for "GPT-4o" references
**Then** no outdated comments exist (valid fallback model configs are OK)

### AC-8.7.2: TODO/FIXME Comments Reviewed
**Given** the source code in `src/`
**When** searching for TODO/FIXME comments
**Then** all are either resolved or documented

### AC-8.7.3: CLAUDE.md Updated
**Given** CLAUDE.md
**When** Epic 8 is complete
**Then** Epic 8 patterns and learnings are documented

### AC-8.7.4: TypeScript Types Current
**Given** the Supabase schema
**When** types are regenerated
**Then** `src/types/database.types.ts` matches current schema

---

## Tasks / Subtasks

- [x] Task 1: Fix GPT-4o References (AC: 8.7.1) ✅
  - [x] Fixed `src/lib/compare/extraction.ts:82` - "GPT-4o" → "GPT-5.1"
  - [x] Fixed `src/lib/chat/rag.ts:141` - "GPT-4o" → "LLM"
  - [x] Fixed `src/types/compare.ts:162,185,291` - "GPT-4o" → "GPT-5.1"
  - [x] Verified: `gpt-4o` in `llm/config.ts` is valid (fallback model config)

- [x] Task 2: Review TODO/FIXME Comments (AC: 8.7.2) ✅
  - [x] Searched `src/` for TODO/FIXME - no matches found
  - [x] Codebase is clean of outstanding technical debt markers

- [x] Task 3: Update CLAUDE.md (AC: 8.7.3) ✅
  - [x] Added Epic 8 section with:
    - Database security hardening pattern (SET search_path)
    - RLS policy performance pattern (SELECT subquery)
    - Rate limiting pattern and configuration
    - Supabase advisor commands

- [x] Task 4: Verify TypeScript Types (AC: 8.7.4) ✅
  - [x] Types already current from Story 8.5 (rate_limits table)
  - [x] Regenerated to confirm - no changes needed

- [x] Task 5: ESLint & React Best Practices Cleanup (AC: 8.7.5) ✅
  - [x] Fixed components defined inside render (causes state reset on re-render)
  - [x] Fixed setState in useEffect anti-pattern
  - [x] Replaced useState+useEffect with useSyncExternalStore for SSR-safe detection
  - [x] Replaced console.log with proper logger
  - [x] Fixed TypeScript type issues

- [x] Task 6: Final Verification (AC: all) ✅
  - [x] ESLint passes clean (0 errors)
  - [x] Build passes
  - [x] 1097 tests pass

---

## Dev Notes

### GPT-4o References - What Was Fixed

| File | Line | Before | After |
|------|------|--------|-------|
| `src/lib/compare/extraction.ts` | 82 | "Uses GPT-4o function calling" | "Uses GPT-5.1 structured outputs" |
| `src/lib/chat/rag.ts` | 141 | "Build the full prompt for GPT-4o" | "Build the full prompt for the LLM" |
| `src/types/compare.ts` | 162 | "GPT-4o function calling schema" | "GPT-5.1 structured output schema" |
| `src/types/compare.ts` | 185 | "e.g., 'gpt-4o'" | "e.g., 'gpt-5.1'" |
| `src/types/compare.ts` | 291 | "GPT-4o function calling schema" | "GPT-5.1 structured output schema" |

### Valid gpt-4o References (Not Changed)

The `src/lib/llm/config.ts` file contains valid `gpt-4o` references for the fallback model configuration:
- Type definition: `'gpt-4o'` as valid ChatModel option
- OpenRouter ID mapping: `'gpt-4o': 'openai/gpt-4o'`
- Pricing: `'gpt-4o': { input: 2.5, output: 10.0 }`

These are correct - gpt-4o is the designated fallback when other models are unavailable.

### ESLint & React Best Practices - What Was Fixed

#### Components Defined Inside Render (Causes State Reset)

| File | Component | Fix |
|------|-----------|-----|
| `src/components/layout/header.tsx` | NavLinks | Extracted to module level, pass pathname/onNavigate as props |
| `src/components/layout/split-view.tsx` | CollapsedChatButton | Extracted to module level, pass position/onRestore as props |

**Why this matters:** Components defined inside render are recreated on every parent render, causing their state to reset and breaking React's reconciliation.

#### setState in useEffect Anti-pattern

| File | Issue | Fix |
|------|-------|-----|
| `src/components/documents/label-input.tsx` | setHighlightedIndex in useEffect | Replaced with useMemo for computed clampedHighlightedIndex |
| `src/components/layout/split-view.tsx` | setIsClient in useEffect (3 places) | Replaced with useSyncExternalStore |
| `src/hooks/use-mobile.ts` | setIsMobile in useEffect | Replaced with useSyncExternalStore |
| `src/hooks/use-document-status.ts` | Ref update during render | Wrapped in useEffect |
| `src/hooks/use-processing-progress.ts` | Ref update during render | Wrapped in useEffect |

**useSyncExternalStore Pattern:**
```typescript
// Before (causes ESLint warning)
const [isClient, setIsClient] = useState(false);
useEffect(() => { setIsClient(true); }, []);

// After (SSR-safe, no warnings)
const subscribeToNothing = () => () => {};
const getIsClient = () => true;
const getIsServer = () => false;
const isClient = useSyncExternalStore(subscribeToNothing, getIsClient, getIsServer);
```

#### Other Fixes

| File | Issue | Fix |
|------|-------|-----|
| `src/components/documents/label-input.tsx` | Unescaped quotes in JSX | Changed to `&quot;` entities |
| `src/hooks/use-chat.ts` | `let` for non-reassigned array | Changed to `const` |
| `src/lib/documents/service.ts` | console.log | Replaced with `log.info()` |
| `src/lib/documents/stale-detection.ts` | console.log | Replaced with `log.info()` |
| `src/app/(auth)/reset-password/actions.ts` | console.log | Replaced with `log.info()` |
| `src/lib/compare/pdf-export.tsx` | `as any` for style arrays | Added `@ts-expect-error` with explanation |

#### Legitimate ESLint Disable Comments

Some setState-in-effect patterns are legitimate synchronization with external state. Added disable comments with explanations:

```typescript
// src/hooks/use-processing-progress.ts
// eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate sync: clear state when tracking no documents
setProgressMap(new Map());
```

---

## Dev Agent Record

### Context Reference

N/A - Story implemented directly from tech spec

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) as Amelia (Dev Agent)

### Completion Notes List

1. **Comment Updates (2025-12-03)**
   - Fixed 5 outdated GPT-4o comments in source code
   - Verified llm/config.ts references are valid fallback configs

2. **TODO/FIXME Search (2025-12-03)**
   - No TODO/FIXME comments found in src/

3. **CLAUDE.md Update (2025-12-03)**
   - Added Epic 8 section with patterns for security, performance, rate limiting

4. **Type Verification (2025-12-03)**
   - Types already current from Story 8.5

5. **ESLint & React Best Practices Cleanup (2025-12-04)**
   - Fixed 12 files with actual code issues
   - Ran ESLint to identify issues: `npx eslint src/ --quiet`
   - Fixed React anti-patterns (components in render, setState in useEffect)
   - Replaced console.log with proper logger
   - All fixes verified with build + 1097 tests passing

### File List

**Comment Fixes (Commit a3f677d):**
- `src/lib/compare/extraction.ts` (modified - comment fix)
- `src/lib/chat/rag.ts` (modified - comment fix)
- `src/types/compare.ts` (modified - comment fixes)
- `CLAUDE.md` (modified - Epic 8 patterns)

**Code Cleanup (Commit b885233):**
- `src/components/layout/header.tsx` (modified - NavLinks extraction)
- `src/components/layout/split-view.tsx` (modified - useSyncExternalStore, CollapsedChatButton extraction)
- `src/components/documents/label-input.tsx` (modified - useMemo, quote escaping)
- `src/hooks/use-mobile.ts` (modified - useSyncExternalStore)
- `src/hooks/use-chat.ts` (modified - const fix)
- `src/hooks/use-document-status.ts` (modified - ref in useEffect)
- `src/hooks/use-processing-progress.ts` (modified - ref in useEffect, eslint-disable)
- `src/lib/documents/service.ts` (modified - logger)
- `src/lib/documents/stale-detection.ts` (modified - logger)
- `src/app/(auth)/reset-password/actions.ts` (modified - logger)
- `src/lib/compare/pdf-export.tsx` (modified - ts-expect-error)

---

## Senior Developer Review (AI)

### Reviewer
Sam (Senior Developer)

### Date
2025-12-03

### Outcome
✅ **APPROVED** - All acceptance criteria verified.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-8.7.1 | No GPT-4o in source comments | ✅ | Grep shows only valid config refs |
| AC-8.7.2 | TODO/FIXME reviewed | ✅ | Grep shows 0 matches in src/ |
| AC-8.7.3 | CLAUDE.md updated | ✅ | Epic 8 section added |
| AC-8.7.4 | Types current | ✅ | Types match schema |

**Summary:** 4 of 4 acceptance criteria verified ✅

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-03 | SM (BMad Master) | Story drafted from tech spec |
| 2025-12-03 | Dev (Amelia) | Comment fixes + CLAUDE.md update complete |
| 2025-12-03 | Reviewer (Senior Dev) | Senior Developer Review: APPROVED |
| 2025-12-04 | Dev (Amelia) | ESLint & React best practices cleanup (12 files) |
