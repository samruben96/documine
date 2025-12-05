# Development Context

## Relevant Existing Code

| File | Lines | Reference |
|------|-------|-----------|
| `src/types/compare.ts` | 20-41 | Current CoverageType enum |
| `src/types/compare.ts` | 107-126 | Current CoverageItem interface |
| `src/types/compare.ts` | 164-188 | Current QuoteExtraction interface |
| `src/types/compare.ts` | 232-288 | Zod schemas for extraction |
| `src/lib/compare/extraction.ts` | 38-73 | EXTRACTION_SYSTEM_PROMPT |
| `src/lib/compare/extraction.ts` | 331-411 | callGPTExtraction function |
| `src/lib/compare/diff.ts` | All | Comparison diff engine |
| `src/components/compare/gap-conflict-banner.tsx` | All | Gap display component |

## Dependencies

**Framework/Libraries (from package.json):**
- `openai@6.9.1` - GPT-5.1 extraction with zodResponseFormat
- `zod@4.1.13` - Schema validation
- `@tanstack/react-table@8.21.3` - Comparison table
- `@react-pdf/renderer@4.3.1` - One-pager PDF generation
- `lucide-react@0.554.0` - Icons

**Internal Modules:**
- `@/lib/compare/extraction` - Extraction service
- `@/lib/compare/diff` - Diff engine
- `@/types/compare` - Type definitions
- `@/lib/utils/logger` - Structured logging
- `@/components/compare/*` - Comparison UI components
- `@/components/one-pager/*` - PDF generation

## Configuration Changes

**Environment Variables:**
- No new environment variables required
- Existing `OPENAI_API_KEY` used for extraction

**Constants:**
```typescript
// src/types/compare.ts
export const EXTRACTION_VERSION = 2;  // Bump from 1

// src/lib/compare/extraction.ts - update timeout if needed
const EXTRACTION_TIMEOUT_MS = 90000;  // Consider increasing for larger schemas
```

## Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode
- ESLint with Next.js config
- 2-space indentation
- Single quotes for strings
- No semicolons (project style)

**Test Patterns:**
- Vitest for unit tests (`__tests__/`)
- Playwright for E2E (`__tests__/e2e/`)
- Test file naming: `*.test.ts`, `*.spec.ts`
- Coverage target: >80%

**File Organization:**
- Types in `src/types/`
- Services in `src/lib/`
- Components in `src/components/{feature}/`

## Test Framework & Standards

**Vitest Configuration:**
- Config: `vitest.config.ts`
- Environment: `happy-dom`
- Coverage: `@vitest/coverage-v8`

**Test Locations:**
- Unit: `__tests__/lib/`, `__tests__/components/`, `__tests__/hooks/`
- E2E: `__tests__/e2e/`

---
