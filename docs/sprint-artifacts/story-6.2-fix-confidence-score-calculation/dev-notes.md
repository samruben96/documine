# Dev Notes

## Relevant Architecture Patterns

From architecture.md - Trust-Transparent AI Responses:

```typescript
// Confidence thresholds (original design)
const CONFIDENCE_THRESHOLDS = {
  high: 0.85,        // >= 85% confident
  needs_review: 0.60, // 60-84% confident
  not_found: 0        // < 60% or no relevant chunks found
};
```

Note: Architecture shows 0.85/0.60, but current code uses 0.75/0.50. The exact thresholds are less important than using the right score type.

## Project Structure Notes

**Files to Modify:**
- `src/lib/chat/types.ts` - RetrievedChunk type definition
- `src/lib/chat/reranker.ts` - Score handling fix
- `src/lib/chat/confidence.ts` - Threshold calculation
- `src/lib/chat/rag.ts` - Pipeline updates
- `src/components/chat/confidence-badge.tsx` - UI update

**Files to Create:**
- `__tests__/e2e/confidence-display.spec.ts` - E2E tests
- `__tests__/unit/confidence.test.ts` - Unit tests (if not existing)

## Testing Standards

From Story 6.1 learnings - Test-Driven Bug Fixing (TDBF):
1. Write failing test first (Playwright for E2E, Vitest for unit)
2. Implement fix
3. Verify test passes
4. Document in story file

## References

- [Source: docs/sprint-artifacts/tech-spec-epic-6.md#BUG-2]
- [Source: docs/architecture.md#Trust-Transparent-AI-Responses]
- [Source: docs/prd.md#FR16-Confidence-Indicators]
- [Source: docs/epics.md#Story-6.2]

## Learnings from Previous Story

**From Story 6.1 (Status: Done)**

- **Playwright testing patterns**: Story 6.1 established Playwright E2E testing with `data-testid` attributes. Reuse these patterns for confidence badge testing.
- **Debug logging**: Story 6.1 added error logging for debugging. Apply same pattern for score logging.
- **CLAUDE.md documentation**: Story 6.1 documented the fix in CLAUDE.md. This story should add confidence threshold documentation.

**Key Files from 6.1 to reference:**
- `playwright.config.ts` - Test configuration
- `__tests__/e2e/conversation-persistence.spec.ts` - E2E test patterns
- Components with `data-testid` attributes already in place

[Source: docs/sprint-artifacts/story-6.1-fix-conversation-loading-406.md#Dev-Agent-Record]

---
