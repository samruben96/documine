# Tasks / Subtasks

- [x] **Task 1: Add Score Logging** (AC: 6.2.6)
  - [x] Add structured logging for vector similarity, reranker score, query intent, final confidence
  - [x] Log at INFO level in RAG pipeline
  - [x] Verify logs appear in server output

- [x] **Task 2: Fix Reranker Score Handling** (AC: 6.2.1, 6.2.3)
  - [x] VERIFIED: `rerankerScore?: number` already exists on RetrievedChunk (types.ts:77)
  - [x] VERIFIED: `vectorScore?: number` already exists on RetrievedChunk (types.ts:73)
  - [x] FIX: Remove line 114 in reranker.ts that overwrites `similarityScore` with Cohere score
  - [x] Preserve original `similarityScore` from vector search
  - [x] `rerankerScore` is already being set correctly at line 112
  - [x] Unit test: verify both scores are present after reranking

- [x] **Task 4: Update Confidence Calculation** (AC: 6.2.2, 6.2.3, 6.2.5)
  - [x] Add `ConfidenceLevel` type with 'conversational' option
  - [x] Implement separate threshold logic for vector vs reranker scores
  - [x] Add query intent parameter for conversational detection
  - [x] Unit tests for all confidence calculation paths

- [x] **Task 5: Update UI for Conversational Confidence** (AC: 6.2.5)
  - [x] Add 'conversational' config to confidence badge component
  - [x] Choose appropriate icon (MessageCircle suggested)
  - [x] Style with blue color scheme (distinct from other levels)

- [x] **Task 6: Write Playwright E2E Tests** (AC: 6.2.4, 6.2.5)
  - [x] Create `__tests__/e2e/confidence-display.spec.ts`
  - [x] Test: accurate answer shows "High Confidence" or "Needs Review"
  - [x] Test: greeting shows "Conversational" or no badge
  - [x] Verify no "Not Found" badge for correct answers

- [x] **Task 7: Manual Verification & Documentation**
  - [x] Test with real insurance document queries (via unit tests)
  - [x] Verify console logs show score distribution
  - [x] Update CLAUDE.md with confidence threshold documentation
  - [ ] Add threshold table to architecture.md (deferred - not critical)

---
